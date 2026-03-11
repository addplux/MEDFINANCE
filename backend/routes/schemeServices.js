const express = require('express');
const router = express.Router();
const { SchemeService, Service, Scheme } = require('../models');
const { authMiddleware, authorize } = require('../middleware/auth');

router.use(authMiddleware);

/**
 * GET /api/scheme-services/:schemeId
 * Returns all services covered by the scheme with their prices.
 * Also returns 'uncovered' services for UI reference.
 */
router.get('/:schemeId', async (req, res) => {
    try {
        const { schemeId } = req.params;
        const scheme = await Scheme.findByPk(schemeId);
        if (!scheme) return res.status(404).json({ error: 'Scheme not found' });

        const schemeServices = await SchemeService.findAll({
            where: { schemeId },
            include: [{ model: Service, as: 'service', attributes: ['id', 'serviceCode', 'serviceName', 'category', 'price', 'schemePrice', 'isActive'] }],
            order: [[{ model: Service, as: 'service' }, 'serviceName', 'ASC']]
        });

        const coveredServiceIds = schemeServices.map(ss => ss.serviceId);

        // Also get all services not yet added so the UI can pick them
        const allServices = await Service.findAll({
            where: { isActive: true },
            order: [['serviceName', 'ASC']]
        });

        res.json({
            success: true,
            covered: schemeServices,
            allServices,
            coveredIds: coveredServiceIds
        });
    } catch (error) {
        console.error('Fetch scheme services error:', error);
        res.status(500).json({ error: 'Failed to fetch scheme services' });
    }
});

/**
 * POST /api/scheme-services/:schemeId
 * Add or update a service for a scheme (upsert).
 * Body: { serviceId, schemePrice, isCovered, notes }
 */
router.post('/:schemeId', authorize('admin', 'accountant'), async (req, res) => {
    try {
        const { schemeId } = req.params;
        const { serviceId, schemePrice, isCovered = true, notes } = req.body;

        if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

        const [ss, created] = await SchemeService.findOrCreate({
            where: { schemeId, serviceId },
            defaults: { schemePrice: schemePrice ?? null, isCovered, notes }
        });

        if (!created) {
            await ss.update({ schemePrice: schemePrice ?? null, isCovered, notes });
        }

        const withService = await SchemeService.findByPk(ss.id, {
            include: [{ model: Service, as: 'service', attributes: ['id', 'serviceCode', 'serviceName', 'category', 'price', 'schemePrice'] }]
        });

        res.json({ success: true, data: withService, created });
    } catch (error) {
        console.error('Upsert scheme service error:', error);
        res.status(500).json({ error: 'Failed to save scheme service' });
    }
});

/**
 * DELETE /api/scheme-services/:schemeId/:serviceId
 * Remove a service from a scheme's coverage.
 */
router.delete('/:schemeId/:serviceId', authorize('admin', 'accountant'), async (req, res) => {
    try {
        const { schemeId, serviceId } = req.params;
        await SchemeService.destroy({ where: { schemeId, serviceId } });
        res.json({ success: true, message: 'Service removed from scheme coverage.' });
    } catch (error) {
        console.error('Delete scheme service error:', error);
        res.status(500).json({ error: 'Failed to remove service' });
    }
});

/**
 * GET /api/scheme-services/:schemeId/price/:serviceId
 * Look up the effective price for a service under a specific scheme.
 * Returns schemePrice if set, otherwise falls back to service.schemePrice then service.price.
 */
router.get('/:schemeId/price/:serviceId', authMiddleware, async (req, res) => {
    try {
        const { schemeId, serviceId } = req.params;
        const ss = await SchemeService.findOne({ where: { schemeId, serviceId }, include: [{ model: Service, as: 'service' }] });
        const service = ss?.service || await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ error: 'Service not found' });

        const effectivePrice = ss?.schemePrice ?? service.schemePrice ?? service.price;
        const isCovered = ss ? ss.isCovered : true;

        res.json({ success: true, effectivePrice: parseFloat(effectivePrice), isCovered, standardPrice: parseFloat(service.price) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to look up price' });
    }
});

module.exports = router;
