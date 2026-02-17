const { OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Payment, Patient, Department, User, sequelize } = require('../models');

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

// Medical Superintendent Dashboard
const getMedicalSuperintendentDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Clinical Stats
        const totalPatients = await Patient.count();
        const newPatientsToday = await Patient.count({
            where: {
                createdAt: { [sequelize.Sequelize.Op.gte]: today }
            }
        });

        const activeInpatients = await IPDBill.count({ where: { status: 'active' } });

        // Department Activity (Today)
        const opdVisitsToday = await OPDBill.count({
            where: { createdAt: { [sequelize.Sequelize.Op.gte]: today } }
        });

        // Clinical Revenue (High Level)
        const totalRevenue = await Payment.sum('amount') || 0;

        res.json({
            patientStats: {
                totalRegistered: totalPatients,
                newToday: newPatientsToday,
                currentlyAdmitted: activeInpatients
            },
            clinicalActivity: {
                opdVisitsToday,
                // Add more granular clinical stats here as models allow
            },
            financials: {
                totalRevenue: parseFloat(totalRevenue).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Get Med Supt dashboard error:', error);
        res.status(500).json({ error: 'Failed to get Medical Superintendent dashboard' });
    }
};

// Administrator Dashboard
const getAdministratorDashboard = async (req, res) => {
    try {
        // Staff Stats
        const totalStaff = await User.count({ where: { role: { [sequelize.Sequelize.Op.ne]: 'admin' } } });
        const activeStaff = await User.count({ where: { isActive: true } });

        // Department Stats
        const activeDepartments = await Department.count({ where: { status: 'active' } });

        // Financial Overview
        const totalRevenue = await Payment.sum('amount') || 0;

        // Recent System Activity (using created payments/bills as proxy)
        const recentActivityCount = await Payment.count({
            where: {
                createdAt: {
                    [sequelize.Sequelize.Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });

        res.json({
            staffStats: {
                total: totalStaff,
                active: activeStaff
            },
            operationalStats: {
                activeDepartments,
                recentSystemActivity: recentActivityCount
            },
            financialOverview: {
                totalRevenue: parseFloat(totalRevenue).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Get Admin dashboard error:', error);
        res.status(500).json({ error: 'Failed to get Administrator dashboard' });
    }
};

// Accounts Dashboard
const getAccountsDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Daily Financials
        const collectedToday = await Payment.sum('amount', {
            where: { paymentDate: { [sequelize.Sequelize.Op.gte]: today } }
        }) || 0;

        const collectedMonth = await Payment.sum('amount', {
            where: {
                paymentDate: {
                    [sequelize.Sequelize.Op.gte]: new Date(today.getFullYear(), today.getMonth(), 1)
                }
            }
        }) || 0;

        // Pending Receivables (Estimates based on pending bills)
        const pendingOPD = await OPDBill.sum('netAmount', { where: { status: 'pending' } }) || 0;
        const pendingIPD = await IPDBill.sum('totalAmount', { where: { status: 'active' } }) || 0; // Active IPD bills are essentially pending

        const totalReceivables = parseFloat(pendingOPD) + parseFloat(pendingIPD);

        res.json({
            collections: {
                today: parseFloat(collectedToday).toFixed(2),
                thisMonth: parseFloat(collectedMonth).toFixed(2)
            },
            receivables: {
                totalPending: totalReceivables.toFixed(2),
                breakdown: {
                    opd: parseFloat(pendingOPD).toFixed(2),
                    ipd: parseFloat(pendingIPD).toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('Get Accounts dashboard error:', error);
        res.status(500).json({ error: 'Failed to get Accounts dashboard' });
    }
};

// Ministry / Provincial Dashboard
const getMinistryDashboard = async (req, res) => {
    try {
        // High level aggregated stats
        const totalPatients = await Patient.count();
        const totalRevenue = await Payment.sum('amount') || 0;

        // Bed Occupancy Rate (Mock calculation - requires fixed bed count)
        const activeInpatients = await IPDBill.count({ where: { status: 'active' } });
        const totalBeds = 100; // Placeholder constant
        const occupancyRate = (activeInpatients / totalBeds) * 100;

        res.json({
            facilityStats: {
                totalPatients,
                occupancyRate: `${occupancyRate.toFixed(1)}%`
            },
            financialPerformance: {
                totalRevenue: parseFloat(totalRevenue).toFixed(2)
            },
            status: 'Operational'
        });
    } catch (error) {
        console.error('Get Ministry dashboard error:', error);
        res.status(500).json({ error: 'Failed to get Ministry dashboard' });
    }
};

module.exports = {
    getOverview,
    getRecentActivities,
    getRevenueChart,
    getMedicalSuperintendentDashboard,
    getAdministratorDashboard,
    getAccountsDashboard,
    getMinistryDashboard
};
