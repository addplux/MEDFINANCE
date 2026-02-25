const { TheatreBill, Patient, Visit, sequelize } = require('../models');
const { Op } = require('sequelize');
const { postChargeToGL } = require('../utils/glPoster');
const { updatePatientBalance } = require('../utils/balanceUpdater');

// Generate unique bill number
const generateBillNumber = async () => {
    const prefix = 'THR';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const lastBill = await TheatreBill.findOne({
        order: [['createdAt', 'DESC']]
    });

    let sequence = 1;
    if (lastBill && lastBill.billNumber.startsWith(`${prefix}${year}${month}`)) {
        sequence = parseInt(lastBill.billNumber.slice(-4)) + 1;
    }

    return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
};

// Generate unique visit number
const generateVisitNumber = async (transaction) => {
    const today = new Date();
    const datePart = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('');

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await Visit.count({
        where: { createdAt: { [Op.gte]: startOfDay } },
        transaction
    });
    const seq = String(count + 1).padStart(4, '0');
    return `VIS-${datePart}-${seq}`;
};

// Create theatre bill (and request visit)
exports.createTheatreBill = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { patientId, schemeId, notes } = req.body;

        let visitId = req.body.visitId;

        // Setup Visit to put patient in Theatre Queue if no existing visit provided
        if (!visitId && patientId) {
            const visitNumber = await generateVisitNumber(transaction);
            const visit = await Visit.create({
                visitNumber,
                patientId,
                visitType: 'outpatient',
                schemeId,
                departmentId: 7, // Theatre Department
                status: 'active',
                notes: notes,
            }, { transaction });
            visitId = visit.id;
        }

        const billNumber = await generateBillNumber();
        const bill = await TheatreBill.create({
            ...req.body,
            billNumber,
            visitId
        }, { transaction });

        if (patientId) {
            await updatePatientBalance(patientId, transaction);
        }
        await postChargeToGL(bill, '4000', transaction);

        await transaction.commit();
        res.status(201).json(bill);
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating theatre bill:', error);
        res.status(500).json({ error: 'Failed to create theatre bill' });
    }
};

// Get all theatre bills
exports.getAllTheatreBills = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.paymentStatus = status;

        const bills = await TheatreBill.findAndCountAll({
            where,
            include: [{
                model: Patient,
                as: 'patient',
                attributes: ['id', 'firstName', 'lastName', 'dateOfBirth']
            }],
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
        console.error('Error fetching theatre bills:', error);
        res.status(500).json({ error: 'Failed to fetch theatre bills' });
    }
};

// Get theatre bill by ID
exports.getTheatreBillById = async (req, res) => {
    try {
        const bill = await TheatreBill.findByPk(req.params.id, {
            include: [{
                model: Patient,
                as: 'patient'
            }]
        });

        if (!bill) {
            return res.status(404).json({ error: 'Theatre bill not found' });
        }

        res.json(bill);
    } catch (error) {
        console.error('Error fetching theatre bill:', error);
        res.status(500).json({ error: 'Failed to fetch theatre bill' });
    }
};

// Update theatre bill
exports.updateTheatreBill = async (req, res) => {
    try {
        const bill = await TheatreBill.findByPk(req.params.id);

        if (!bill) {
            return res.status(404).json({ error: 'Theatre bill not found' });
        }

        await bill.update(req.body);
        res.json(bill);
    } catch (error) {
        console.error('Error updating theatre bill:', error);
        res.status(500).json({ error: 'Failed to update theatre bill' });
    }
};

// Complete operation and clear from queue
exports.completeOperation = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const bill = await TheatreBill.findByPk(req.params.id);
        if (!bill) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Theatre bill not found' });
        }

        // Close out the associated visit to remove patient from the queue
        if (bill.visitId) {
            const visit = await Visit.findByPk(bill.visitId);
            if (visit) {
                await visit.update({ status: 'completed' }, { transaction });
            }
        }

        // Add the current completion date
        await bill.update({ procedureDate: new Date() }, { transaction });

        await transaction.commit();
        res.json({ message: 'Operation marked as complete and cleared from queue', bill });
    } catch (error) {
        await transaction.rollback();
        console.error('Error completing theatre operation:', error);
        res.status(500).json({ error: 'Failed to complete theatre operation' });
    }
};

// Delete theatre bill
exports.deleteTheatreBill = async (req, res) => {
    try {
        const bill = await TheatreBill.findByPk(req.params.id);

        if (!bill) {
            return res.status(404).json({ error: 'Theatre bill not found' });
        }

        await bill.destroy();
        res.json({ message: 'Theatre bill deleted successfully' });
    } catch (error) {
        console.error('Error deleting theatre bill:', error);
        res.status(500).json({ error: 'Failed to delete theatre bill' });
    }
};

// Get theatre revenue statistics
exports.getTheatreRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};

        if (startDate && endDate) {
            where.procedureDate = {
                [require('sequelize').Op.between]: [startDate, endDate]
            };
        }

        const bills = await TheatreBill.findAll({ where });

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
        console.error('Error fetching theatre revenue:', error);
        res.status(500).json({ error: 'Failed to fetch theatre revenue' });
    }
};
