const { TheatreBill, Patient } = require('../models');

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

// Create theatre bill
exports.createTheatreBill = async (req, res) => {
    try {
        const billNumber = await generateBillNumber();
        const bill = await TheatreBill.create({
            ...req.body,
            billNumber
        });

        res.status(201).json(bill);
    } catch (error) {
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
