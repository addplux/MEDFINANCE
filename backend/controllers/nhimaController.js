const { NHIMAClaim, ClaimBatch, Patient, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get claims pending vetting
const getPendingVettingClaims = async (req, res) => {
    try {
        const claims = await NHIMAClaim.findAll({
            where: { vettingStatus: 'pending' },
            include: [
                { model: Patient, as: 'patient', attributes: ['firstName', 'lastName', 'nhimaNumber'] },
                { model: User, as: 'creator', attributes: ['firstName', 'lastName'] }
            ],
            order: [['createdAt', 'ASC']]
        });
        res.json(claims);
    } catch (error) {
        console.error('Error fetching pending vetting claims:', error);
        res.status(500).json({ error: 'Failed to fetch pending claims' });
    }
};

// Vet a claim (Approve/Reject)
const vetClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason, notes } = req.body; // status: 'approved' | 'rejected'

        const claim = await NHIMAClaim.findByPk(id);
        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid vetting status' });
        }

        claim.vettingStatus = status;
        if (rejectionReason) claim.rejectionReason = rejectionReason;
        if (notes) claim.notes = notes;

        // If rejected, also update main status to rejected
        if (status === 'rejected') {
            claim.status = 'rejected';
        }

        await claim.save();
        res.json(claim);
    } catch (error) {
        console.error('Error vetting claim:', error);
        res.status(500).json({ error: 'Failed to vet claim' });
    }
};

// Create a batch from approved claims
const createBatch = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { month, year, notes } = req.body;
        const userId = req.user?.id;

        // Find all approved but unbatched claims for the period
        // For simplicity, we'll just take all approved unbatched claims
        // In reality, might filter by date range
        const claims = await NHIMAClaim.findAll({
            where: {
                vettingStatus: 'approved',
                batchId: null
            },
            transaction: t
        });

        if (claims.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'No approved claims available for batching' });
        }

        const totalAmount = claims.reduce((sum, claim) => sum + Number(claim.claimAmount), 0);
        const batchNumber = `BATCH-${year}${String(month).padStart(2, '0')}-${Date.now()}`;

        const batch = await ClaimBatch.create({
            batchNumber,
            month,
            year,
            totalAmount,
            claimCount: claims.length,
            status: 'open',
            submissionDate: new Date(),
            notes,
            createdBy: userId
        }, { transaction: t });

        // Update claims with batchId
        await NHIMAClaim.update({
            batchId: batch.id,
            status: 'submitted' // Update workflow status
        }, {
            where: {
                id: { [Op.in]: claims.map(c => c.id) }
            },
            transaction: t
        });

        await t.commit();
        res.status(201).json(batch);
    } catch (error) {
        await t.rollback();
        console.error('Error creating batch:', error);
        res.status(500).json({ error: 'Failed to create claim batch' });
    }
};

// Get batches
const getBatches = async (req, res) => {
    try {
        const batches = await ClaimBatch.findAll({
            include: [{ model: User, as: 'creator', attributes: ['firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(batches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
};

module.exports = {
    getPendingVettingClaims,
    vetClaim,
    createBatch,
    getBatches
};
