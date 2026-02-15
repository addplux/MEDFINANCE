const { OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Payment, sequelize } = require('../models');

// Get dashboard overview statistics
const getOverview = async (req, res) => {
    try {
        // Get total revenue (sum of all payments)
        const totalRevenue = await Payment.sum('amount') || 0;

        // Get pending bills count
        const pendingOPD = await OPDBill.count({ where: { status: 'pending' } });
        const pendingIPD = await IPDBill.count({ where: { status: 'active' } });
        const pendingPharmacy = await PharmacyBill.count({ where: { status: 'pending' } });
        const pendingLab = await LabBill.count({ where: { status: 'pending' } });
        const pendingRadiology = await RadiologyBill.count({ where: { status: 'pending' } });

        const totalPendingBills = pendingOPD + pendingIPD + pendingPharmacy + pendingLab + pendingRadiology;

        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayRevenue = await Payment.sum('amount', {
            where: {
                paymentDate: {
                    [sequelize.Sequelize.Op.gte]: today
                }
            }
        }) || 0;

        // Get this month's revenue
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthRevenue = await Payment.sum('amount', {
            where: {
                paymentDate: {
                    [sequelize.Sequelize.Op.gte]: firstDayOfMonth
                }
            }
        }) || 0;

        res.json({
            totalRevenue,
            totalPendingBills,
            todayRevenue,
            monthRevenue,
            billBreakdown: {
                opd: pendingOPD,
                ipd: pendingIPD,
                pharmacy: pendingPharmacy,
                laboratory: pendingLab,
                radiology: pendingRadiology
            }
        });
    } catch (error) {
        console.error('Get overview error:', error);
        res.status(500).json({ error: 'Failed to get dashboard overview' });
    }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get recent payments
        const recentPayments = await Payment.findAll({
            limit,
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'patient', attributes: ['firstName', 'lastName', 'patientNumber'] },
                { association: 'receiver', attributes: ['firstName', 'lastName'] }
            ]
        });

        // Get recent OPD bills
        const recentBills = await OPDBill.findAll({
            limit,
            order: [['createdAt', 'DESC']],
            include: [
                { association: 'patient', attributes: ['firstName', 'lastName', 'patientNumber'] },
                { association: 'service', attributes: ['serviceName'] }
            ]
        });

        res.json({
            recentPayments,
            recentBills
        });
    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({ error: 'Failed to get recent activities' });
    }
};

// Get revenue chart data (last 7 days)
const getRevenueChart = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const chartData = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const revenue = await Payment.sum('amount', {
                where: {
                    paymentDate: {
                        [sequelize.Sequelize.Op.gte]: date,
                        [sequelize.Sequelize.Op.lt]: nextDate
                    }
                }
            }) || 0;

            chartData.push({
                date: date.toISOString().split('T')[0],
                revenue: parseFloat(revenue)
            });
        }

        res.json(chartData);
    } catch (error) {
        console.error('Get revenue chart error:', error);
        res.status(500).json({ error: 'Failed to get revenue chart data' });
    }
};

module.exports = {
    getOverview,
    getRecentActivities,
    getRevenueChart
};
