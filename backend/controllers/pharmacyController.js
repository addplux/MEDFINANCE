const { Medication, PharmacyBatch, PharmacyBill, Patient, User } = require('../models');
const { updatePatientBalance } = require('../utils/balanceUpdater');
const { postChargeToGL } = require('../utils/glPoster');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// ========== Medication Inventory ==========

// Get all medications with stock levels
const getAllMedications = async (req, res) => {
    try {
        const { search, category } = req.query;
        const where = { isActive: true };

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } }
            ];
        }
        if (category) where.category = category;

        const medications = await Medication.findAll({
            where,
            include: [{
                model: PharmacyBatch,
                as: 'batches',
                where: { quantityOnHand: { [Op.gt]: 0 }, expiryDate: { [Op.gt]: new Date() } },
                required: false
            }],
            order: [['name', 'ASC']]
        });

        // Calculate total stock for each medication
        const result = medications.map(med => {
            const totalStock = med.batches.reduce((sum, batch) => sum + batch.quantityOnHand, 0);
            const medData = med.toJSON();
            medData.totalStock = totalStock;
            return medData;
        });

        res.json(result);
    } catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({ error: 'Failed to get medications' });
    }
};

// Create medication
const createMedication = async (req, res) => {
    try {
        const { name, code, category, unitOfMeasure, reorderLevel, description, manufacturer } = req.body;

        if (!name || !code || !category || !unitOfMeasure) {
            return res.status(400).json({ error: 'Name, code, category, and unit of measure are required' });
        }

        const medication = await Medication.create({
            name,
            code,
            category,
            unitOfMeasure,
            reorderLevel: reorderLevel || 10,
            description,
            manufacturer
        });

        res.status(201).json(medication);
    } catch (error) {
        console.error('Create medication error:', error);
        res.status(500).json({ error: 'Failed to create medication' });
    }
};

// Update medication
const updateMedication = async (req, res) => {
    try {
        const medication = await Medication.findByPk(req.params.id);
        if (!medication) return res.status(404).json({ error: 'Medication not found' });

        await medication.update(req.body);
        res.json(medication);
    } catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({ error: 'Failed to update medication' });
    }
};

// ========== Stock Management (GRN) ==========

// Receive stock (GRN)
const receiveStock = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { medicationId, batchNumber, expiryDate, quantity, unitCost, sellingPrice, supplier } = req.body;

        if (!medicationId || !batchNumber || !expiryDate || !quantity || !unitCost || !sellingPrice) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const batch = await PharmacyBatch.create({
            medicationId,
            batchNumber,
            expiryDate,
            quantityReceived: quantity,
            quantityOnHand: quantity,
            unitCost,
            sellingPrice,
            supplier
        }, { transaction: t });

        await t.commit();
        res.status(201).json(batch);
    } catch (error) {
        await t.rollback();
        console.error('Receive stock error:', error);
        res.status(500).json({ error: 'Failed to receive stock' });
    }
};

// Get batches for a medication
const getBatches = async (req, res) => {
    try {
        const { medicationId } = req.params;
        const batches = await PharmacyBatch.findAll({
            where: {
                medicationId,
                quantityOnHand: { [Op.gt]: 0 }
            },
            order: [['expiryDate', 'ASC']] // FIFO by expiry
        });
        res.json(batches);
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({ error: 'Failed to get batches' });
    }
};

// ========== Dispensing ==========

// Dispense medication
const dispenseMedication = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { patientId, items, paymentMethod } = req.body; // items: [{ medicationId, batchId, quantity, discount }]

        if (!patientId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Patient and items are required' });
        }

        const bills = [];

        for (const item of items) {
            const { medicationId, batchId, quantity, discount } = item;

            // 1. Find Batch
            let batch;
            if (batchId) {
                batch = await PharmacyBatch.findByPk(batchId, { transaction: t });
            } else {
                // Auto-select oldest batch with stock
                batch = await PharmacyBatch.findOne({
                    where: {
                        medicationId,
                        quantityOnHand: { [Op.gte]: quantity },
                        expiryDate: { [Op.gt]: new Date() }
                    },
                    order: [['expiryDate', 'ASC']],
                    transaction: t
                });
            }

            if (!batch) {
                throw new Error(`Insufficient stock for medication ID ${medicationId}`);
            }

            if (batch.quantityOnHand < quantity) {
                throw new Error(`Insufficient stock in batch ${batch.batchNumber}`);
            }

            // 2. Deduct Stock
            await batch.decrement('quantityOnHand', { by: quantity, transaction: t });

            // 3. Create Bill
            const medication = await Medication.findByPk(medicationId, { transaction: t });
            const totalAmount = batch.sellingPrice * quantity;
            const netAmount = totalAmount - (discount || 0);

            // Generate bill number for THIS item (usually grouped, but model is per line item for now)
            // In a real app, we might have PharmacyOrderHeader and PharmacyOrderDetails. 
            // Here we just create individual bills per line item for simplicity as per existing model, 
            // OR we assume the frontend sends one item at a time or we group them.
            // Given the PharmacyBill model looks like a line item, let's create one per item.

            const billCount = await PharmacyBill.count({ transaction: t });
            const billNumber = `PHARM${String(billCount + 1).padStart(6, '0')}-${Math.floor(Math.random() * 1000)}`;

            const bill = await PharmacyBill.create({
                billNumber,
                patientId,
                medicationId,
                batchId: batch.id,
                medication: medication.name, // Legacy field support
                batchNumber: batch.batchNumber, // Legacy field support
                quantity,
                unitPrice: batch.sellingPrice,
                totalAmount,
                discount: discount || 0,
                netAmount,
                status: 'pending', // Or 'paid' if cash
                createdBy: req.user.id
            }, { transaction: t });

            bills.push(bill);

            // Post to GL
            await postChargeToGL(bill, '4000', t); // 4000 is generic Service/Pharmacy Revenue
        }

        // Update Patient Balance
        await updatePatientBalance(patientId, t);

        await t.commit();
        res.status(201).json(bills);

    } catch (error) {
        await t.rollback();
        console.error('Dispense error:', error);
        res.status(500).json({ error: error.message || 'Failed to dispense medication' });
    }
};

module.exports = {
    getAllMedications,
    createMedication,
    updateMedication,
    receiveStock,
    getBatches,
    dispenseMedication
};
