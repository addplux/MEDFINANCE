const { Patient, OnlineTransaction, Payment, sequelize } = require('../models');
const crypto = require('crypto');

// Utility to generate a unique transaction ID
const generateTransactionId = () => {
    return 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
};

exports.getPatientBalance = async (req, res) => {
    try {
        const { patientNumber } = req.params;

        const patient = await Patient.findOne({
            where: { patientNumber },
            attributes: ['id', 'patientNumber', 'firstName', 'lastName', 'balance', 'phone', 'email']
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.status(200).json({
            patient: {
                id: patient.id,
                patientNumber: patient.patientNumber,
                name: `${patient.firstName} ${patient.lastName}`,
                balance: Number(patient.balance),
                phone: patient.phone,
                email: patient.email
            }
        });
    } catch (error) {
        console.error('getPatientBalance error:', error);
        res.status(500).json({ error: 'Internal server error while fetching balance' });
    }
};

exports.initiatePayment = async (req, res) => {
    try {
        const { patientId, amount, paymentMethod, email, phone } = req.body;

        if (!patientId || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Invalid patient ID or amount' });
        }

        const patient = await Patient.findByPk(patientId);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const transactionId = generateTransactionId();

        // 1. Create a pending online transaction in our DB
        const onlineTx = await OnlineTransaction.create({
            transactionId,
            patientId: patient.id,
            amount,
            currency: 'ZMW',
            gateway: 'mock_gateway', // Replace with 'flutterwave' or 'paystack' in production
            status: 'pending',
            paymentMethod: paymentMethod || 'mobile_money',
            notes: `Online payment initiated`
        });

        // 2. Here you would normally call the Payment Gateway API (e.g. Flutterwave Standard Checkout)
        // and get a `checkoutUrl` to redirect the user to.
        // For now, we simulate success for the frontend portal:
        
        const mockCheckoutUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/simulate?tx_ref=${transactionId}&amount=${amount}`;

        res.status(200).json({
            message: 'Payment initiated',
            transactionId: onlineTx.transactionId,
            checkoutUrl: mockCheckoutUrl,
            // You can pass the public key if generating the form directly on frontend
            // publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY 
        });

    } catch (error) {
        console.error('initiatePayment error:', error);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

exports.handlePaymentWebhook = async (req, res) => {
    /* 
      // Security Validation (example for Flutterwave):
      const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
      const signature = req.headers['verif-hash'];
      if (!signature || (signature !== secretHash)) {
          return res.status(401).end(); // Unauthorized
      }
    */
    
    // In production, req.body might be parsed directly or need raw parse. 
    // We assume JSON body parser is re-applied or it's standard JSON.
    const payload = req.body;
    console.log('Received Webhook:', payload);

    // This is a simplified webhook logic assuming payload = { tx_ref, status: "successful", amount }
    const tx_ref = payload.txRef || payload.tx_ref;
    const status = payload.status;
    const amountPaid = payload.amount;

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

            // 1. Mark OnlineTransaction as successful
            await onlineTx.update({ 
                status: 'successful', 
                gatewayReference: payload.transaction_id || payload.id,
                paidAt: new Date()
            }, { transaction: t });

            // 2. Create the official Payment Receipt in MedFinance
            const receiptNumber = `WEB-${Date.now().toString().slice(-6)}`;
            await Payment.create({
                receiptNumber,
                patientId: patient.id,
                amount: onlineTx.amount, // Or amountPaid from gateway
                paymentMethod: onlineTx.paymentMethod || 'mobile_money',
                status: 'completed',
                notes: `Online Payment via Gateway (Ref: ${tx_ref})`,
                receivedBy: null // System generated
            }, { transaction: t });

            // 3. Update Patient Balance
            // In MedFinance, balance > 0 means the patient owes money. 
            // So a payment reduces the balance. If they overpay, it goes into credit (negative balance).
            await patient.decrement('balance', { 
                by: Number(onlineTx.amount),
                transaction: t 
            });

            await t.commit();
            return res.status(200).send('Webhook processed successfully');
        } else {
            // Mark as failed
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
