const { Payment, OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Department, Budget, User, Patient, sequelize } = require('../models');

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

// Get wing-specific revenue
const getWingRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateWhere = startDate && endDate ? {
            paymentDate: {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            }
        } : {};

        // Get payments with patient details to determine wing/category
        const payments = await Payment.findAll({
            where: dateWhere,
            include: [{
                association: 'patient',
                attributes: ['costCategory', 'ward']
            }]
        });

        // Initialize counters
        let highCostTotal = 0;
        let lowCostTotal = 0;
        let generalWardTotal = 0;
        let otherTotal = 0;

        // Process payments
        payments.forEach(payment => {
            const amount = parseFloat(payment.amount);
            const patient = payment.patient;

            if (patient) {
                if (patient.costCategory === 'high_cost') {
                    highCostTotal += amount;
                } else if (patient.costCategory === 'low_cost') {
                    lowCostTotal += amount;
                } else if (patient.ward === 'general_ward' || patient.costCategory === 'standard') {
                    generalWardTotal += amount;
                } else {
                    otherTotal += amount;
                }
            } else {
                otherTotal += amount;
            }
        });

        res.json({
            period: startDate && endDate ? { startDate, endDate } : 'All time',
            wings: {
                highCost: parseFloat(highCostTotal).toFixed(2),
                lowCost: parseFloat(lowCostTotal).toFixed(2),
                generalWard: parseFloat(generalWardTotal).toFixed(2),
                other: parseFloat(otherTotal).toFixed(2)
            },
            total: parseFloat(highCostTotal + lowCostTotal + generalWardTotal + otherTotal).toFixed(2)
        });
    } catch (error) {
        console.error('Get wing revenue error:', error);
        res.status(500).json({ error: 'Failed to get wing revenue report' });
    }
};

// Get department revenue
const getDepartmentRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateWhere = startDate && endDate ? {
            paymentDate: {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            }
        } : {};

        // Aggregate by billType which maps to departments
        const revenueByDepartment = await Payment.findAll({
            attributes: [
                'billType',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: dateWhere,
            group: ['billType']
        });

        // Format for response
        const formattedRevenue = {};
        let totalRevenue = 0;

        revenueByDepartment.forEach(entry => {
            const department = entry.billType || 'Other';
            const amount = parseFloat(entry.getDataValue('total'));
            formattedRevenue[department] = amount.toFixed(2);
            totalRevenue += amount;
        });

        res.json({
            period: startDate && endDate ? { startDate, endDate } : 'All time',
            departments: formattedRevenue,
            total: parseFloat(totalRevenue).toFixed(2)
        });
    } catch (error) {
        console.error('Get department revenue error:', error);
        res.status(500).json({ error: 'Failed to get department revenue report' });
    }
};

// Get cashier performance
const getCashierPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateWhere = startDate && endDate ? {
            paymentDate: {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            }
        } : {};

        // Group payments by receivedBy user
        const performance = await Payment.findAll({
            attributes: [
                'receivedBy',
                [sequelize.fn('SUM', sequelize.col('amount')), 'totalCollected'],
                [sequelize.fn('COUNT', sequelize.col('payment.id')), 'transactionCount']
            ],
            where: dateWhere,
            include: [{
                model: User,
                as: 'receiver',
                attributes: ['firstName', 'lastName', 'username']
            }],
            group: ['receivedBy', 'receiver.id', 'receiver.firstName', 'receiver.lastName', 'receiver.username']
        });

        const formattedPerformance = performance.map(p => ({
            cashierId: p.receivedBy,
            cashierName: p.receiver ? `${p.receiver.firstName} ${p.receiver.lastName}` : 'Unknown',
            username: p.receiver ? p.receiver.username : 'N/A',
            totalCollected: parseFloat(p.getDataValue('totalCollected')).toFixed(2),
            transactionCount: parseInt(p.getDataValue('transactionCount'))
        }));

        res.json({
            period: startDate && endDate ? { startDate, endDate } : 'All time',
            performance: formattedPerformance
        });
    } catch (error) {
        console.error('Get cashier performance error:', error);
        res.status(500).json({ error: 'Failed to get cashier performance report' });
    }
};

// Get collection summary (daily/monthly)
const getCollectionSummary = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query; // groupBy: 'day' or 'month'

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const dateAttribute = groupBy === 'month'
            ? [sequelize.fn('date_trunc', 'month', sequelize.col('paymentDate')), 'period']
            : [sequelize.col('paymentDate'), 'period'];

        const collections = await Payment.findAll({
            attributes: [
                dateAttribute,
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: {
                paymentDate: {
                    [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            group: [groupBy === 'month' ? sequelize.fn('date_trunc', 'month', sequelize.col('paymentDate')) : 'paymentDate'],
            order: [[sequelize.col('period'), 'ASC']]
        });

        const formattedCollections = collections.map(c => ({
            period: c.getDataValue('period'),
            total: parseFloat(c.getDataValue('total')).toFixed(2)
        }));

        res.json({
            period: { startDate, endDate },
            groupBy,
            collections: formattedCollections,
            totalForPeriod: formattedCollections.reduce((sum, c) => sum + parseFloat(c.total), 0).toFixed(2)
        });
    } catch (error) {
        console.error('Get collection summary error:', error);
        res.status(500).json({ error: 'Failed to get collection summary' });
    }
};

// Get outstanding claims aging report
const getClaimsAging = async (req, res) => {
    try {
        const { payerType } = req.query; // 'nhima', 'corporate', 'scheme', or undefined for all

        const paymentMethods = payerType ? [payerType] : ['nhima', 'corporate', 'scheme'];

        // 1. Get all patients who have used these payment methods
        const patients = await Patient.findAll({
            where: {
                paymentMethod: {
                    [sequelize.Sequelize.Op.in]: paymentMethods
                }
            }
        });

        const agingBuckets = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        };

        const details = [];

        for (const patient of patients) {
            // Get all bills
            const opdBills = await OPDBill.findAll({ where: { patientId: patient.id }, order: [['createdAt', 'DESC']] });
            const ipdBills = await IPDBill.findAll({ where: { patientId: patient.id }, order: [['createdAt', 'DESC']] });

            const allBills = [...opdBills, ...ipdBills].map(b => ({
                id: b.id,
                type: b.billNumber ? 'OPD' : 'IPD',
                amount: parseFloat(b.netAmount || b.totalAmount),
                date: b.createdAt
            })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

            const totalBilled = allBills.reduce((sum, b) => sum + b.amount, 0);

            // Get all payments
            const totalPaid = await Payment.sum('amount', {
                where: {
                    patientId: patient.id
                }
            }) || 0;

            let outstandingBalance = totalBilled - parseFloat(totalPaid);

            if (outstandingBalance > 0) {
                let remainingToAllocate = outstandingBalance;

                for (const bill of allBills) {
                    if (remainingToAllocate <= 0) break;

                    const amountForThisBill = Math.min(bill.amount, remainingToAllocate);

                    // Calculate age
                    const ageInDays = Math.floor((new Date() - new Date(bill.date)) / (1000 * 60 * 60 * 24));

                    if (ageInDays <= 30) agingBuckets['0-30'] += amountForThisBill;
                    else if (ageInDays <= 60) agingBuckets['31-60'] += amountForThisBill;
                    else if (ageInDays <= 90) agingBuckets['61-90'] += amountForThisBill;
                    else agingBuckets['90+'] += amountForThisBill;

                    details.push({
                        patientName: `${patient.firstName} ${patient.lastName}`,
                        payer: patient.paymentMethod,
                        amount: amountForThisBill.toFixed(2),
                        age: ageInDays,
                        billDate: bill.date
                    });

                    remainingToAllocate -= amountForThisBill;
                }
            }
        }

        res.json({
            summary: {
                '0-30': agingBuckets['0-30'].toFixed(2),
                '31-60': agingBuckets['31-60'].toFixed(2),
                '61-90': agingBuckets['61-90'].toFixed(2),
                '90+': agingBuckets['90+'].toFixed(2),
                total: (agingBuckets['0-30'] + agingBuckets['31-60'] + agingBuckets['61-90'] + agingBuckets['90+']).toFixed(2)
            },
            details: details.slice(0, 100)
        });
    } catch (error) {
        console.error('Get claims aging error:', error);
        res.status(500).json({ error: 'Failed to get claims aging report' });
    }
};

module.exports = {
    getRevenueReport,
    getCashflowReport,
    getDepartmentProfitability,
    getBillingSummary,
    getWingRevenue,
    getDepartmentRevenue,
    getCashierPerformance,
    getCollectionSummary,
    getClaimsAging
};
