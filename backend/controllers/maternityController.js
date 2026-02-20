const { MaternityBill, Patient } = require('../models');
const { Op } = require('sequelize');
const { postChargeToGL } = require('../utils/glPoster');
const { updatePatientBalance } = require('../utils/balanceUpdater');

// Generate unique bill number
const generateBillNumber = async () => {
    const prefix = 'MAT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const lastBill = await MaternityBill.findOne({
        order: [['createdAt', 'DESC']]
    });

    let sequence = 1;
    if (lastBill && lastBill.billNumber.startsWith(`${prefix}${year}${month}`)) {
        sequence = parseInt(lastBill.billNumber.slice(-4)) + 1;
    }

    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
};

exports.createMaternityBill = async (req, res) => {
    try {
        const billNumber = await generateBillNumber();
        const bill = await MaternityBill.create({ ...req.body, billNumber });

        if (req.body.patientId) {
            await updatePatientBalance(req.body.patientId);
        }
        await postChargeToGL(bill, '4000');

        res.status(201).json(bill);
    } catch (error) {
        console.error('Error creating maternity bill:', error);
        res.status(500).json({ error: 'Failed to create maternity bill' });
    }
};

exports.getAllMaternityBills = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        const where = status ? { paymentStatus: status } : {};

        const bills = await MaternityBill.findAndCountAll({
            where,
            include: [{ model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'dateOfBirth'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            data: bills.rows,
            total: bills.count,
            totalPages: Math.ceil(bills.count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching maternity bills:', error);
        res.status(500).json({ error: 'Failed to fetch maternity bills' });
    }
};

exports.getMaternityBillById = async (req, res) => {
    try {
        const bill = await MaternityBill.findByPk(req.params.id, {
            include: [{ model: Patient, as: 'patient' }]
        });
        if (!bill) return res.status(404).json({ error: 'Maternity bill not found' });
        res.json(bill);
    } catch (error) {
        console.error('Error fetching maternity bill:', error);
        res.status(500).json({ error: 'Failed to fetch maternity bill' });
    }
};

exports.updateMaternityBill = async (req, res) => {
    try {
        const bill = await MaternityBill.findByPk(req.params.id);
        if (!bill) return res.status(404).json({ error: 'Maternity bill not found' });
        await bill.update(req.body);
        res.json(bill);
    } catch (error) {
        console.error('Error updating maternity bill:', error);
        res.status(500).json({ error: 'Failed to update maternity bill' });
    }
};

exports.deleteMaternityBill = async (req, res) => {
    try {
        const bill = await MaternityBill.findByPk(req.params.id);
        if (!bill) return res.status(404).json({ error: 'Maternity bill not found' });
        await bill.destroy();
        res.json({ message: 'Maternity bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting maternity bill:', error);
        res.status(500).json({ error: 'Failed to delete maternity bill' });
    }
};

exports.getMaternityRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.deliveryDate = { [Op.between]: [startDate, endDate] };
        }

        const bills = await MaternityBill.findAll({ where });
        const stats = {
            totalBills: bills.length,
            totalRevenue: bills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount), 0),
            totalPaid: bills.reduce((sum, bill) => sum + parseFloat(bill.amountPaid), 0),
            totalPending: bills.reduce((sum, bill) => {
                if (bill.paymentStatus !== 'paid') {
                    return sum + (parseFloat(bill.totalAmount) - parseFloat(bill.amountPaid));
                }
                return sum;
            }, 0),
            byStatus: {
                pending: bills.filter(b => b.paymentStatus === 'pending').length,
                partial: bills.filter(b => b.paymentStatus === 'partial').length,
                paid: bills.filter(b => b.paymentStatus === 'paid').length
            },
            byDeliveryType: {
                normal: bills.filter(b => b.deliveryType === 'normal').length,
                'c-section': bills.filter(b => b.deliveryType === 'c-section').length,
                assisted: bills.filter(b => b.deliveryType === 'assisted').length,
                other: bills.filter(b => b.deliveryType === 'other').length
            }
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching maternity revenue:', error);
        res.status(500).json({ error: 'Failed to fetch maternity revenue' });
    }
};

exports.getDeliveryStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.deliveryDate = { [Op.between]: [startDate, endDate] };
        }

        const bills = await MaternityBill.findAll({ where });
        res.json({
            totalDeliveries: bills.length,
            byType: {
                normal: bills.filter(b => b.deliveryType === 'normal').length,
                'c-section': bills.filter(b => b.deliveryType === 'c-section').length,
                assisted: bills.filter(b => b.deliveryType === 'assisted').length,
                other: bills.filter(b => b.deliveryType === 'other').length
            }
        });
    } catch (error) {
        console.error('Error fetching delivery stats:', error);
        res.status(500).json({ error: 'Failed to fetch delivery stats' });
    }
};
