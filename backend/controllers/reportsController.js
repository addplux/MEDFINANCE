const { Payment, OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Department, Budget, sequelize } = require('../models');

// Get revenue report
const getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const where = {
            paymentDate: {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            }
        };

        // Total revenue
        const totalRevenue = await Payment.sum('amount', { where }) || 0;

        // Revenue by payment method
        const byPaymentMethod = await Payment.findAll({
            attributes: [
                'paymentMethod',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where,
            group: ['paymentMethod']
        });

        // Revenue by bill type
        const byBillType = await Payment.findAll({
            attributes: [
                'billType',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where,
            group: ['billType']
        });

        res.json({
            period: { startDate, endDate },
            totalRevenue: parseFloat(totalRevenue).toFixed(2),
            byPaymentMethod,
            byBillType
        });
    } catch (error) {
        console.error('Get revenue report error:', error);
        res.status(500).json({ error: 'Failed to get revenue report' });
    }
};

// Get cashflow report
const getCashflowReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const dateWhere = {
            [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
        };

        // Cash inflows (payments received)
        const cashInflows = await Payment.sum('amount', {
            where: { paymentDate: dateWhere }
        }) || 0;

        // Cash outflows would come from payment vouchers, petty cash, etc.
        // For now, we'll use a simplified version

        const netCashflow = cashInflows; // - cashOutflows

        res.json({
            period: { startDate, endDate },
            cashInflows: parseFloat(cashInflows).toFixed(2),
            cashOutflows: 0, // To be implemented with payment vouchers
            netCashflow: parseFloat(netCashflow).toFixed(2)
        });
    } catch (error) {
        console.error('Get cashflow report error:', error);
        res.status(500).json({ error: 'Failed to get cashflow report' });
    }
};

// Get department profitability
const getDepartmentProfitability = async (req, res) => {
    try {
        const { fiscalYear } = req.query;

        if (!fiscalYear) {
            return res.status(400).json({ error: 'Fiscal year is required' });
        }

        const departments = await Department.findAll({
            where: { status: 'active' }
        });

        const profitability = [];

        for (const dept of departments) {
            // Get budget
            const budget = await Budget.findOne({
                where: { departmentId: dept.id, fiscalYear }
            });

            // Get revenue (simplified - would need more complex logic in production)
            // This is a placeholder - actual revenue would come from bills linked to departments
            const revenue = 0;

            profitability.push({
                departmentId: dept.id,
                departmentCode: dept.departmentCode,
                departmentName: dept.departmentName,
                budget: budget ? parseFloat(budget.budgetAmount) : 0,
                actualSpent: budget ? parseFloat(budget.actualSpent) : 0,
                revenue,
                profit: revenue - (budget ? parseFloat(budget.actualSpent) : 0)
            });
        }

        res.json({
            fiscalYear,
            departments: profitability,
            summary: {
                totalBudget: profitability.reduce((sum, d) => sum + d.budget, 0),
                totalSpent: profitability.reduce((sum, d) => sum + d.actualSpent, 0),
                totalRevenue: profitability.reduce((sum, d) => sum + d.revenue, 0),
                totalProfit: profitability.reduce((sum, d) => sum + d.profit, 0)
            }
        });
    } catch (error) {
        console.error('Get department profitability error:', error);
        res.status(500).json({ error: 'Failed to get department profitability' });
    }
};

// Get billing summary
const getBillingSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateWhere = startDate && endDate ? {
            createdAt: {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            }
        } : {};

        // OPD Bills
        const opdTotal = await OPDBill.sum('netAmount', { where: dateWhere }) || 0;
        const opdCount = await OPDBill.count({ where: dateWhere });

        // IPD Bills
        const ipdTotal = await IPDBill.sum('totalAmount', { where: dateWhere }) || 0;
        const ipdCount = await IPDBill.count({ where: dateWhere });

        // Pharmacy Bills
        const pharmacyTotal = await PharmacyBill.sum('totalAmount', { where: dateWhere }) || 0;
        const pharmacyCount = await PharmacyBill.count({ where: dateWhere });

        // Lab Bills
        const labTotal = await LabBill.sum('totalAmount', { where: dateWhere }) || 0;
        const labCount = await LabBill.count({ where: dateWhere });

        // Radiology Bills
        const radiologyTotal = await RadiologyBill.sum('totalAmount', { where: dateWhere }) || 0;
        const radiologyCount = await RadiologyBill.count({ where: dateWhere });

        res.json({
            period: startDate && endDate ? { startDate, endDate } : 'All time',
            summary: {
                opd: { count: opdCount, total: parseFloat(opdTotal).toFixed(2) },
                ipd: { count: ipdCount, total: parseFloat(ipdTotal).toFixed(2) },
                pharmacy: { count: pharmacyCount, total: parseFloat(pharmacyTotal).toFixed(2) },
                laboratory: { count: labCount, total: parseFloat(labTotal).toFixed(2) },
                radiology: { count: radiologyCount, total: parseFloat(radiologyTotal).toFixed(2) }
            },
            grandTotal: parseFloat(opdTotal + ipdTotal + pharmacyTotal + labTotal + radiologyTotal).toFixed(2)
        });
    } catch (error) {
        console.error('Get billing summary error:', error);
        res.status(500).json({ error: 'Failed to get billing summary' });
    }
};

module.exports = {
    getRevenueReport,
    getCashflowReport,
    getDepartmentProfitability,
    getBillingSummary
};
