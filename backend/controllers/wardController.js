const { Ward, Bed } = require('../models');

const wardController = {
    // Get all wards
    getAllWards: async (req, res) => {
        try {
            const wards = await Ward.findAll({
                include: [{
                    model: Bed,
                    as: 'beds'
                }]
            });
            res.json(wards);
        } catch (error) {
            console.error('Error fetching wards:', error);
            res.status(500).json({ error: 'Failed to fetch wards' });
        }
    },

    // Get available beds for a ward
    getAvailableBeds: async (req, res) => {
        try {
            const { wardId } = req.params;
            const beds = await Bed.findAll({
                where: {
                    wardId,
                    status: 'available'
                }
            });
            res.json(beds);
        } catch (error) {
            console.error('Error fetching available beds:', error);
            res.status(500).json({ error: 'Failed to fetch available beds' });
        }
    },

    // Create a new ward (for future admin functionality)
    createWard: async (req, res) => {
        try {
            const ward = await Ward.create(req.body);
            res.status(201).json(ward);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create ward' });
        }
    },

    // Create a new bed
    createBed: async (req, res) => {
        try {
            const bed = await Bed.create({ ...req.body, wardId: req.params.wardId });
            res.status(201).json(bed);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create bed' });
        }
    }
};

module.exports = wardController;
