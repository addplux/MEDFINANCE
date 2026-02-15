const { Supplier, Invoice, PaymentVoucher, User, sequelize } = require('../models');

// ========== Suppliers ==========

// Get all suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await Supplier.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Failed to get suppliers' });
    }
};

// Create supplier
const createSupplier = async (req, res) => {
    try {
        const { supplierName, contactPerson, phone, email, address, paymentTerms, taxId, bankName, bankAccountNumber, notes } = req.body;

        if (!supplierName) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        // Generate supplier code
        const supplierCount = await Supplier.count();
        const supplierCode = `SUP${String(supplierCount + 1).padStart(5, '0')}`;

        const supplier = await Supplier.create({
            supplierCode,
            supplierName,
            contactPerson,
            phone,
            email,
            address,
            paymentTerms,
            taxId,
            bankName,
            bankAccountNumber,
            notes
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
};

// ========== Invoices ==========

// Get all invoices
const getAllInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await Invoice.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'supplier', attributes: ['id', 'supplierName', 'supplierCode'] },
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
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to get invoices' });
    }
};

// Create invoice
const createInvoice = async (req, res) => {
    try {
        const { supplierId, invoiceDate, dueDate, totalAmount, taxAmount, description, notes } = req.body;

        if (!supplierId || !invoiceDate || !dueDate || !totalAmount) {
            return res.status(400).json({ error: 'Supplier, dates, and total amount are required' });
        }

        // Generate invoice number
        const invoiceCount = await Invoice.count();
        const invoiceNumber = `INV${String(invoiceCount + 1).padStart(6, '0')}`;

        const tax = parseFloat(taxAmount) || 0;
        const total = parseFloat(totalAmount);
        const netAmount = total + tax;

        const invoice = await Invoice.create({
            invoiceNumber,
            supplierId,
            invoiceDate,
            dueDate,
            totalAmount: total,
            taxAmount: tax,
            netAmount,
            description,
            notes,
            createdBy: req.user.id
        });

        const createdInvoice = await Invoice.findByPk(invoice.id, {
            include: [
                { association: 'supplier' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdInvoice);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

// ========== Payment Vouchers ==========

// Get all payment vouchers
const getAllPaymentVouchers = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;

        const { count, rows } = await PaymentVoucher.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            include: [
                {
                    association: 'invoice',
                    include: [{ association: 'supplier', attributes: ['id', 'supplierName'] }]
                },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
                { association: 'approver', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            data: rows
        });
    } catch (error) {
        console.error('Get payment vouchers error:', error);
        res.status(500).json({ error: 'Failed to get payment vouchers' });
    }
};

// Create payment voucher
const createPaymentVoucher = async (req, res) => {
    try {
        const { invoiceId, paymentDate, amount, paymentMethod, referenceNumber, bankName, chequeNumber, notes } = req.body;

        if (!invoiceId || !paymentDate || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Invoice, payment date, amount, and payment method are required' });
        }

        // Verify invoice exists
        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Generate voucher number
        const voucherCount = await PaymentVoucher.count();
        const voucherNumber = `PV${String(voucherCount + 1).padStart(6, '0')}`;

        const voucher = await PaymentVoucher.create({
            voucherNumber,
            invoiceId,
            paymentDate,
            amount,
            paymentMethod,
            referenceNumber,
            bankName,
            chequeNumber,
            notes,
            createdBy: req.user.id
        });

        const createdVoucher = await PaymentVoucher.findByPk(voucher.id, {
            include: [
                {
                    association: 'invoice',
                    include: [{ association: 'supplier' }]
                },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdVoucher);
    } catch (error) {
        console.error('Create payment voucher error:', error);
        res.status(500).json({ error: 'Failed to create payment voucher' });
    }
};

module.exports = {
    getAllSuppliers,
    createSupplier,
    getAllInvoices,
    createInvoice,
    getAllPaymentVouchers,
    createPaymentVoucher
};
