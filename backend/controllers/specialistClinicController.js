const { SpecialistClinicBill, Patient } = require('../models');
const { Op } = require('sequelize');

// Generate unique bill number
const generateBillNumber = async () => {
    const prefix = 'SPC';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const lastBill = await SpecialistClinicBill.findOne({
        order: [['createdAt', 'DESC']]
    });

    let sequence = 1;
    if (lastBill && lastBill.billNumber.startsWith(`${prefix}${year}${month}`)) {
        sequence = parseInt(lastBill.billNumber.slice(-4)) + 1;
    }

    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
};

exports.createSpecialistBill = async (req, res) => {
    try {
        const billNumber = await generateBillNumber();
        const bill = await SpecialistClinicBill.create({ ...req.body, billNumber });
        res.status(201).json(bill);
    } catch (error) {
        console.error('Error creating specialist clinic bill:', error);
        res.status(500).json({ error: 'Failed to create specialist clinic bill' });
    }
};

exports.getAllSpecialistBills = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, clinicType } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (status) where.paymentStatus = status;
        if (clinicType) where.clinicType = clinicType;

        const bills = await SpecialistClinicBill.findAndCountAll({
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
        console.error('Error fetching specialist clinic bills:', error);
        res.status(500).json({ error: 'Failed to fetch specialist clinic bills' });
    }
};

exports.getSpecialistBillById = async (req, res) => {
    try {
        const bill = await SpecialistClinicBill.findByPk(req.params.id, {
            include: [{ model: Patient, as: 'patient' }]
        });
        if (!bill) return res.status(404).json({ error: 'Specialist clinic bill not found' });
        res.json(bill);
    } catch (error) {
        console.error('Error fetching specialist clinic bill:', error);
        res.status(500).json({ error: 'Failed to fetch specialist clinic bill' });
    }
};

exports.updateSpecialistBill = async (req, res) => {
    try {
        const bill = await SpecialistClinicBill.findByPk(req.params.id);
        if (!bill) return res.status(404).json({ error: 'Specialist clinic bill not found' });
        await bill.update(req.body);
        res.json(bill);
    } catch (error) {
        console.error('Error updating specialist clinic bill:', error);
        res.status(500).json({ error: 'Failed to update specialist clinic bill' });
    }
};

exports.deleteSpecialistBill = async (req, res) => {
    try {
        const bill = await SpecialistClinicBill.findByPk(req.params.id);
        if (!bill) return res.status(404).json({ error: 'Specialist clinic bill not found' });
        await bill.destroy();
        res.json({ message: 'Specialist clinic bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting specialist clinic bill:', error);
        res.status(500).json({ error: 'Failed to delete specialist clinic bill' });
    }
};

exports.getSpecialistRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.consultationDate = { [Op.between]: [startDate, endDate] };
        }

        const bills = await SpecialistClinicBill.findAll({ where });
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
            }
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching specialist clinic revenue:', error);
        res.status(500).json({ error: 'Failed to fetch specialist clinic revenue' });
    }
};

exports.getClinicStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.consultationDate = { [Op.between]: [startDate, endDate] };
        }

        const bills = await SpecialistClinicBill.findAll({ where });
        const clinicTypes = ['cardiology', 'orthopedics', 'neurology', 'dermatology', 'ophthalmology', 'ent', 'gynecology', 'urology', 'pediatrics', 'psychiatry', 'other'];

        const byClinic = {};
        clinicTypes.forEach(type => {
            const clinicBills = bills.filter(b => b.clinicType === type);
            byClinic[type] = {
                count: clinicBills.length,
                revenue: clinicBills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount), 0)
            };
        });

        res.json({ totalConsultations: bills.length, byClinic });
    } catch (error) {
        console.error('Error fetching clinic stats:', error);
        res.status(500).json({ error: 'Failed to fetch clinic stats' });
    }
};
