const { Asset, Department, User, sequelize } = require('../models');

// Get all assets
const getAllAssets = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, category } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;
        if (category) where.category = category;

        const { count, rows } = await Asset.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['purchaseDate', 'DESC']],
            include: [
                { association: 'department', attributes: ['id', 'departmentCode', 'departmentName'] },
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
        console.error('Get assets error:', error);
        res.status(500).json({ error: 'Failed to get assets' });
    }
};

// Get single asset
const getAsset = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id, {
            include: [
                { association: 'department' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json(asset);
    } catch (error) {
        console.error('Get asset error:', error);
        res.status(500).json({ error: 'Failed to get asset' });
    }
};

// Create asset
const createAsset = async (req, res) => {
    try {
        const { assetName, category, departmentId, purchaseDate, purchasePrice, usefulLife, salvageValue, description, supplier, serialNumber, location } = req.body;

        if (!assetName || !category || !purchaseDate || !purchasePrice) {
            return res.status(400).json({ error: 'Asset name, category, purchase date, and purchase price are required' });
        }

        // Generate asset tag
        const assetCount = await Asset.count();
        const assetTag = `AST${String(assetCount + 1).padStart(6, '0')}`;

        // Calculate depreciation
        const price = parseFloat(purchasePrice);
        const salvage = parseFloat(salvageValue) || 0;
        const life = parseInt(usefulLife) || 5;
        const annualDepreciation = (price - salvage) / life;

        const asset = await Asset.create({
            assetTag,
            assetName,
            category,
            departmentId,
            purchaseDate,
            purchasePrice: price,
            usefulLife: life,
            salvageValue: salvage,
            annualDepreciation,
            description,
            supplier,
            serialNumber,
            location,
            createdBy: req.user.id
        });

        const createdAsset = await Asset.findByPk(asset.id, {
            include: [
                { association: 'department' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(201).json(createdAsset);
    } catch (error) {
        console.error('Create asset error:', error);
        res.status(500).json({ error: 'Failed to create asset' });
    }
};

// Update asset
const updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Recalculate depreciation if relevant fields changed
        if (req.body.purchasePrice || req.body.salvageValue || req.body.usefulLife) {
            const price = parseFloat(req.body.purchasePrice || asset.purchasePrice);
            const salvage = parseFloat(req.body.salvageValue || asset.salvageValue);
            const life = parseInt(req.body.usefulLife || asset.usefulLife);
            req.body.annualDepreciation = (price - salvage) / life;
        }

        await asset.update(req.body);

        const updatedAsset = await Asset.findByPk(asset.id, {
            include: [
                { association: 'department' },
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.json(updatedAsset);
    } catch (error) {
        console.error('Update asset error:', error);
        res.status(500).json({ error: 'Failed to update asset' });
    }
};

// Delete asset
const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        await asset.destroy();
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
};

// Get depreciation schedule
const getDepreciationSchedule = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        const schedule = [];
        const purchaseYear = new Date(asset.purchaseDate).getFullYear();
        const annualDep = parseFloat(asset.annualDepreciation);
        let bookValue = parseFloat(asset.purchasePrice);

        for (let year = 0; year < asset.usefulLife; year++) {
            const depreciation = annualDep;
            bookValue -= depreciation;

            schedule.push({
                year: purchaseYear + year,
                depreciation: depreciation.toFixed(2),
                accumulatedDepreciation: ((year + 1) * annualDep).toFixed(2),
                bookValue: Math.max(bookValue, parseFloat(asset.salvageValue)).toFixed(2)
            });
        }

        res.json({
            asset: {
                assetTag: asset.assetTag,
                assetName: asset.assetName,
                purchasePrice: asset.purchasePrice,
                salvageValue: asset.salvageValue,
                usefulLife: asset.usefulLife,
                annualDepreciation: asset.annualDepreciation
            },
            schedule
        });
    } catch (error) {
        console.error('Get depreciation schedule error:', error);
        res.status(500).json({ error: 'Failed to get depreciation schedule' });
    }
};

// Get asset summary
const getAssetSummary = async (req, res) => {
    try {
        const totalAssets = await Asset.count();
        const activeAssets = await Asset.count({ where: { status: 'active' } });

        const totalValue = await Asset.sum('purchasePrice') || 0;
        const totalDepreciation = await Asset.sum('accumulatedDepreciation') || 0;
        const netBookValue = totalValue - totalDepreciation;

        // Group by category
        const assetsByCategory = await Asset.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('purchasePrice')), 'totalValue']
            ],
            group: ['category']
        });

        res.json({
            summary: {
                totalAssets,
                activeAssets,
                totalValue: parseFloat(totalValue).toFixed(2),
                totalDepreciation: parseFloat(totalDepreciation).toFixed(2),
                netBookValue: parseFloat(netBookValue).toFixed(2)
            },
            byCategory: assetsByCategory
        });
    } catch (error) {
        console.error('Get asset summary error:', error);
        res.status(500).json({ error: 'Failed to get asset summary' });
    }
};

module.exports = {
    getAllAssets,
    getAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    getDepreciationSchedule,
    getAssetSummary
};
