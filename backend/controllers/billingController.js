const { OPDBill, Patient, Service, User } = require('../models');

// Get all OPD bills
const getAllOPDBills = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await OPDBill.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientNumber'] },
                { association: 'service', attributes: ['id', 'serviceName', 'serviceCode'] },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get OPD bills error:', error);
        res.status(500).json({ error: 'Failed to get OPD bills' });
    }
};

// Get single OPD bill
const getOPDBill = async (req, res) => {
    try {
        const bill = await OPDBill.findByPk(req.params.id, {
            include: [
                { association: 'patient' },
                { association: 'service' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!bill) {
            return res.status(404).json({ error: 'OPD bill not found' });
        }

        res.json(bill);
    } catch (error) {
        console.error('Get OPD bill error:', error);
        res.status(500).json({ error: 'Failed to get OPD bill' });
    }
};

// Create OPD bill
const createOPDBill = async (req, res) => {
    try {
        const { patientId, serviceId, quantity, discount, paymentMethod, notes } = req.body;

        // Validate required fields
        if (!patientId || !serviceId) {
            return res.status(400).json({ error: 'Patient and service are required' });
        }

        // Get service to get price
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Calculate amounts
        const qty = quantity || 1;
        const unitPrice = parseFloat(service.price);
        const totalAmount = unitPrice * qty;
        const discountAmount = parseFloat(discount) || 0;
        const netAmount = totalAmount - discountAmount;

        // Generate bill number
        const billCount = await OPDBill.count();
        const billNumber = `OPD${String(billCount + 1).padStart(6, '0')}`;

        // Create bill
        const bill = await OPDBill.create({
            billNumber,
            patientId,
            serviceId,
            quantity: qty,
            unitPrice,
            totalAmount,
            discount: discountAmount,
            netAmount,
            paymentMethod,
            notes,
            createdBy: req.user.id
        });

        // Fetch with associations
        const createdBill = await OPDBill.findByPk(bill.id, {
            include: [
                { association: 'patient' },
                { association: 'service' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdBill);
    } catch (error) {
        console.error('Create OPD bill error:', error);
        res.status(500).json({ error: 'Failed to create OPD bill' });
    }
};

// Update OPD bill
const updateOPDBill = async (req, res) => {
    try {
        const bill = await OPDBill.findByPk(req.params.id);

        if (!bill) {
            return res.status(404).json({ error: 'OPD bill not found' });
        }

        // Update allowed fields
        const { status, paymentMethod, notes, discount } = req.body;

        if (status) bill.status = status;
        if (paymentMethod) bill.paymentMethod = paymentMethod;
        if (notes !== undefined) bill.notes = notes;
        if (discount !== undefined) {
            bill.discount = parseFloat(discount);
            bill.netAmount = bill.totalAmount - bill.discount;
        }

        await bill.save();

        // Fetch with associations
        const updatedBill = await OPDBill.findByPk(bill.id, {
            include: [
                { association: 'patient' },
                { association: 'service' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(updatedBill);
    } catch (error) {
        console.error('Update OPD bill error:', error);
        res.status(500).json({ error: 'Failed to update OPD bill' });
    }
};

// Delete OPD bill
const deleteOPDBill = async (req, res) => {
    try {
        const bill = await OPDBill.findByPk(req.params.id);

        if (!bill) {
            return res.status(404).json({ error: 'OPD bill not found' });
        }

        await bill.destroy();
        res.json({ message: 'OPD bill deleted successfully' });
    } catch (error) {
        console.error('Delete OPD bill error:', error);
        res.status(500).json({ error: 'Failed to delete OPD bill' });
    }
};

module.exports = {
    getAllOPDBills,
    getOPDBill,
    createOPDBill,
    updateOPDBill,
    deleteOPDBill
};
