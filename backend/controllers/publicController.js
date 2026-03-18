const { Patient, OnlineTransaction, Payment, sequelize } = require('../models');
const crypto = require('crypto');

// Utility to generate a unique transaction ID
const generateTransactionId = () => {
    return 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
};

// ── Get Patient Balance (public self-service portal) ─────────────────────────
// NOTE: Returns minimal info only — no PII (phone/email excluded)
exports.getPatientBalance = async (req, res) => {
    try {
        const { patientNumber } = req.params;

        const { Op } = require('sequelize');
        const { lastName } = req.query;

        if (!lastName) {
            return res.status(400).json({ error: 'lastName query parameter is required for verification' });
        }

        const patient = await Patient.findOne({
            where: { 
                patientNumber,
                lastName: { [Op.iLike]: lastName }
            },
            attributes: ['id', 'patientNumber', 'firstName', 'lastName', 'balance']
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.status(200).json({
            patient: {
                patientNumber: patient.patientNumber,
                name: `${patient.firstName} ${patient.lastName}`,
                balance: Number(patient.balance)
            }
        });
    } catch (error) {
        console.error('getPatientBalance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ── Initiate Online Payment ───────────────────────────────────────────────────
// Guarded: Only active when PAYMENT_GATEWAY_ENABLED=true in environment
exports.initiatePayment = async (req, res) => {
    if (process.env.PAYMENT_GATEWAY_ENABLED !== 'true') {
        return res.status(503).json({ error: 'Online payment gateway is not enabled.' });
    }

    try {
        const { patientId, amount, paymentMethod, email, phone } = req.body;

        if (!patientId || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Invalid patient ID or amount' });
        }

        const patient = await Patient.findByPk(patientId);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const transactionId = generateTransactionId();

        const onlineTx = await OnlineTransaction.create({
            transactionId,
            patientId: patient.id,
            amount,
            currency: 'ZMW',
            gateway: process.env.PAYMENT_GATEWAY_NAME || 'flutterwave',
            status: 'pending',
            paymentMethod: paymentMethod || 'mobile_money',
            notes: `Online payment initiated`
        });

        // Build checkout URL — must be configured via environment variable
        const gatewayCheckoutUrl = process.env.PAYMENT_GATEWAY_CHECKOUT_URL;
        if (!gatewayCheckoutUrl) {
            return res.status(500).json({ error: 'Payment gateway checkout URL not configured.' });
        }

        const checkoutUrl = `${gatewayCheckoutUrl}?tx_ref=${transactionId}&amount=${amount}`;

        res.status(200).json({
            message: 'Payment initiated',
            transactionId: onlineTx.transactionId,
            checkoutUrl
        });

    } catch (error) {
        console.error('initiatePayment error:', error);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

// ── Payment Gateway Webhook ───────────────────────────────────────────────────
exports.handlePaymentWebhook = async (req, res) => {
    // Signature validation — reject any webhook that does not carry the correct hash
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const signature = req.headers['verif-hash'];

    if (!secretHash || !signature || signature !== secretHash) {
        console.warn('[Webhook] Unauthorized webhook attempt blocked');
        return res.status(401).end();
    }

    const payload = req.body;

    const tx_ref = payload.txRef || payload.tx_ref;
    const status = payload.status;

    if (!tx_ref) {
        return res.status(400).json({ error: 'Missing transaction reference' });
    }

    const t = await sequelize.transaction();

    try {
        const onlineTx = await OnlineTransaction.findOne({ where: { transactionId: tx_ref } });
        if (!onlineTx) {
            await t.rollback();
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Idempotency check: if already processed, return 200 OK to gateway
        if (onlineTx.status === 'successful') {
            await t.commit();
            return res.status(200).send('Already processed');
        }

        if (status === 'successful' || status === 'success') {
            const patient = await Patient.findByPk(onlineTx.patientId);

            await onlineTx.update({
                status: 'successful',
                gatewayReference: payload.transaction_id || payload.id,
                paidAt: new Date()
            }, { transaction: t });

            const receiptNumber = `WEB-${Date.now().toString().slice(-6)}`;
            await Payment.create({
                receiptNumber,
                patientId: patient.id,
                amount: onlineTx.amount,
                paymentMethod: onlineTx.paymentMethod || 'mobile_money',
                status: 'completed',
                notes: `Online Payment via Gateway (Ref: ${tx_ref})`,
                receivedBy: null
            }, { transaction: t });

            await patient.decrement('balance', {
                by: Number(onlineTx.amount),
                transaction: t
            });

            await t.commit();
            return res.status(200).send('Webhook processed successfully');
        } else {
            await onlineTx.update({ status: 'failed' }, { transaction: t });
            await t.commit();
            return res.status(200).send('Webhook recorded status update');
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        await t.rollback();
        return res.status(500).send('Internal Server Error');
    }
};
