const { Refund, Payment, User, sequelize } = require('../models');

// Request a refund
const requestRefund = async (req, res) => {
    try {
        const { paymentId, amount, reason } = req.body;
        const requestedBy = req.user.id;

        const payment = await Payment.findByPk(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (parseFloat(amount) > parseFloat(payment.amount)) {
            return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
        }

        const refund = await Refund.create({
            paymentId,
            amount,
            reason,
            requestedBy,
            status: 'pending'
        });

        res.status(201).json(refund);
    } catch (error) {
        console.error('Request refund error:', error);
        res.status(500).json({ error: 'Failed to request refund' });
    }
};

// Approve a refund
const approveRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const approvedBy = req.user.id;

        const refund = await Refund.findByPk(id);
        if (!refund) {
            return res.status(404).json({ error: 'Refund request not found' });
        }

        if (refund.status !== 'pending') {
            return res.status(400).json({ error: 'Refund request is not pending' });
        }

        await refund.update({
            status: 'approved',
            approvedBy,
            approvalDate: new Date()
        });

        // Optionally, create a negative payment record or update the original payment status
        // For now, we assume the finance team handles the physical payout based on this approval

        res.json(refund);
    } catch (error) {
        console.error('Approve refund error:', error);
        res.status(500).json({ error: 'Failed to approve refund' });
    }
};

// Reject a refund
const rejectRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const approvedBy = req.user.id; // Using approvedBy field for the rejector as well

        const refund = await Refund.findByPk(id);
        if (!refund) {
            return res.status(404).json({ error: 'Refund request not found' });
        }

        if (refund.status !== 'pending') {
            return res.status(400).json({ error: 'Refund request is not pending' });
        }

        await refund.update({
            status: 'rejected',
            approvedBy, // The person who rejected
            rejectionReason,
            approvalDate: new Date()
        });

        res.json(refund);
    } catch (error) {
        console.error('Reject refund error:', error);
        res.status(500).json({ error: 'Failed to reject refund' });
    }
};

// Get refunds (with filters)
const getRefunds = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const where = {};

        if (status) query.where.status = status;
        if (startDate && endDate) {
            where.createdAt = {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const refunds = await Refund.findAll({
            where,
            include: [
                { model: Payment, as: 'payment' },
                { model: User, as: 'requester', attributes: ['firstName', 'lastName'] },
                { model: User, as: 'approver', attributes: ['firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(refunds);
    } catch (error) {
        console.error('Get refunds error:', error);
        res.status(500).json({ error: 'Failed to get refunds' });
    }
};

module.exports = {
    requestRefund,
    approveRefund,
    rejectRefund,
    getRefunds
};
