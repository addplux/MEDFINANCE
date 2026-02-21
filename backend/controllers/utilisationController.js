const { Patient, PrepaidPlan, sequelize } = require('../models');
const { Op } = require('sequelize');

const getUtilisationReport = async (req, res) => {
    try {
        // 1. Fetch all prepaid plans to get their coverage limits
        const plans = await PrepaidPlan.findAll({
            where: { isActive: true },
            order: [['sortOrder', 'ASC']]
        });

        // 2. Fetch all prepaid patients with their spend data
        const patients = await Patient.findAll({
            where: {
                paymentMethod: 'private_prepaid',
                memberPlan: { [Op.ne]: null }
            },
            attributes: ['id', 'firstName', 'lastName', 'patientNumber', 'memberPlan', 'totalPlanSpend', 'planStartDate', 'planEndDate']
        });

        // 3. Aggregate stats by plan tier
        const planStats = plans.map(plan => {
            const planPatients = patients.filter(p =>
                p.memberPlan === plan.planKey || p.memberPlan === plan.name
            );

            const totalSpent = planPatients.reduce((sum, p) => sum + parseFloat(p.totalPlanSpend || 0), 0);
            const totalCoverage = planPatients.length * parseFloat(plan.coverageLimit || 0);

            return {
                planId: plan.id,
                planName: plan.name,
                planKey: plan.planKey,
                color: plan.color,
                memberCount: planPatients.length,
                totalSpent,
                totalCoverage,
                utilisationPercent: totalCoverage > 0 ? (totalSpent / totalCoverage) * 100 : 0
            };
        });

        // 4. Calculate overall scheme stats
        const totalSchemeSpent = patients.reduce((sum, p) => sum + parseFloat(p.totalPlanSpend || 0), 0);

        // Dynamic coverage calculation based on individual plan assignments
        let totalSchemeCoverage = 0;
        patients.forEach(p => {
            const plan = plans.find(pl => pl.planKey === p.memberPlan || pl.name === p.memberPlan);
            if (plan) {
                totalSchemeCoverage += parseFloat(plan.coverageLimit || 0);
            }
        });

        // 5. Format detailed member data for the DataGrid
        const memberDetails = patients.map(p => {
            const plan = plans.find(pl => pl.planKey === p.memberPlan || pl.name === p.memberPlan);
            const limit = plan ? parseFloat(plan.coverageLimit) : 0;
            const spent = parseFloat(p.totalPlanSpend);

            return {
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                patientNumber: p.patientNumber,
                planName: plan ? plan.name : p.memberPlan,
                planColor: plan ? plan.color : '#94a3b8',
                coverageLimit: limit,
                totalSpent: spent,
                remaining: Math.max(0, limit - spent),
                utilisationPercent: limit > 0 ? (spent / limit) * 100 : 0,
                status: spent >= limit ? 'Exceeded' : (spent > limit * 0.9 ? 'Critical' : 'Stable')
            };
        });

        res.json({
            summary: {
                totalMembers: patients.length,
                totalSpent: totalSchemeSpent,
                totalCoverage: totalSchemeCoverage,
                overallUtilisation: totalSchemeCoverage > 0 ? (totalSchemeSpent / totalSchemeCoverage) * 100 : 0
            },
            planBreakdown: planStats,
            memberBreakdown: memberDetails
        });

    } catch (error) {
        console.error('Utilisation report error:', error);
        res.status(500).json({ error: 'Failed to generate utilisation report' });
    }
};

module.exports = {
    getUtilisationReport
};
