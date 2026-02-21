const { PrepaidPlan } = require('../models');

// Default seed data to auto-create plans on first load
const SEED_PLANS = [
    {
        planKey: 'basic',
        name: 'Basic',
        color: '#6366f1',
        icon: 'shield',
        monthlyPremium: 500,
        annualPremium: 5500,
        coverageLimit: 10000,
        duration: 30,
        description: 'Essential coverage for individuals needing routine outpatient and pharmacy services.',
        benefits: ['Outpatient consultation', 'Pharmacy (generic drugs)', 'Basic laboratory tests', 'Emergency OPD'],
        sortOrder: 1
    },
    {
        planKey: 'standard',
        name: 'Standard',
        color: '#0ea5e9',
        icon: 'zap',
        monthlyPremium: 1200,
        annualPremium: 13000,
        coverageLimit: 30000,
        duration: 30,
        description: 'Balanced cover for individuals and couples including specialist and radiology services.',
        benefits: ['All Basic benefits', 'Specialist consultations', 'Radiology & Ultrasound', 'Minor theatre procedures', 'Maternity (2 ante-natal visits)'],
        sortOrder: 2
    },
    {
        planKey: 'premium',
        name: 'Premium',
        color: '#f59e0b',
        icon: 'star',
        monthlyPremium: 2500,
        annualPremium: 27000,
        coverageLimit: 80000,
        duration: 30,
        description: 'Comprehensive family cover with full inpatient, theatre, and maternity benefits.',
        benefits: ['All Standard benefits', 'Inpatient admission', 'Major theatre & anaesthesia', 'Full maternity package', 'Dental & optical (basic)', 'Physiotherapy'],
        sortOrder: 3
    }
];

// GET all plans (seed defaults if table is empty)
const getAllPlans = async (req, res) => {
    try {
        let plans = await PrepaidPlan.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] });

        // Auto-seed on first access
        if (plans.length === 0) {
            for (const plan of SEED_PLANS) {
                await PrepaidPlan.create(plan);
            }
            plans = await PrepaidPlan.findAll({ order: [['sortOrder', 'ASC']] });
        }

        res.json(plans);
    } catch (error) {
        console.error('Get prepaid plans error:', error);
        res.status(500).json({ error: 'Failed to get prepaid plans' });
    }
};

// GET single plan
const getPlan = async (req, res) => {
    try {
        const plan = await PrepaidPlan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get plan' });
    }
};

// CREATE plan
const createPlan = async (req, res) => {
    try {
        const { planKey, name, color, icon, monthlyPremium, annualPremium, coverageLimit, duration, description, benefits, sortOrder } = req.body;
        if (!planKey || !name) return res.status(400).json({ error: 'planKey and name are required' });

        const plan = await PrepaidPlan.create({
            planKey, name, color, icon,
            monthlyPremium: parseFloat(monthlyPremium) || 0,
            annualPremium: parseFloat(annualPremium) || 0,
            coverageLimit: parseFloat(coverageLimit) || 0,
            duration: parseInt(duration) || 30,
            description,
            benefits: Array.isArray(benefits) ? benefits : [],
            sortOrder: parseInt(sortOrder) || 0
        });
        res.status(201).json(plan);
    } catch (error) {
        console.error('Create plan error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'A plan with that key already exists' });
        }
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

// UPDATE plan
const updatePlan = async (req, res) => {
    try {
        const plan = await PrepaidPlan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const fields = ['name', 'color', 'icon', 'monthlyPremium', 'annualPremium', 'coverageLimit', 'duration', 'description', 'benefits', 'isActive', 'sortOrder'];
        for (const field of fields) {
            if (req.body[field] !== undefined) {
                plan[field] = field === 'benefits'
                    ? (Array.isArray(req.body[field]) ? req.body[field] : plan.benefits)
                    : req.body[field];
            }
        }
        await plan.save();
        res.json(plan);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

// DELETE plan
const deletePlan = async (req, res) => {
    try {
        const plan = await PrepaidPlan.findByPk(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        await plan.destroy();
        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete plan' });
    }
};

module.exports = { getAllPlans, getPlan, createPlan, updatePlan, deletePlan };
