const { OPDBill, IPDBill, PharmacyBill, LabBill, RadiologyBill, Payment, Patient, Department, User, sequelize } = require('../models');

// Get dashboard overview statistics
const getOverview = async (req, res) => {
    try {
        const { Op } = sequelize.Sequelize;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Clinical Stats
        const [
            totalRegistered,
            newToday,
            activeInpatients,
            opdVisitsToday
        ] = await Promise.all([
            Patient.count(),
            Patient.count({ where: { createdAt: { [Op.gte]: today } } }),
            IPDBill.count({ where: { status: 'active' } }),
            OPDBill.count({ where: { createdAt: { [Op.gte]: today } } })
        ]);

        // 2. Financial Overview
        const [
            totalRevenue,
            todayRevenue,
            monthRevenue
        ] = await Promise.all([
            Payment.sum('amount') || 0,
            Payment.sum('amount', { where: { paymentDate: { [Op.gte]: today } } }) || 0,
            Payment.sum('amount', { where: { paymentDate: { [Op.gte]: firstDayOfMonth } } }) || 0
        ]);

        // 3. Pending Bills (Real counts)
        const [
            pendingOPD,
            pendingIPD,
            pendingPharmacy,
            pendingLab,
            pendingRadiology,
            pendingMaternity,
            pendingTheatre
        ] = await Promise.all([
            OPDBill.count({ where: { status: 'pending' } }),
            IPDBill.count({ where: { status: 'active' } }),
            PharmacyBill.count({ where: { status: 'pending' } }),
            LabBill.count({ where: { status: 'pending' } }),
            RadiologyBill.count({ where: { status: 'pending' } }),
            MaternityBill?.count({ where: { status: 'pending' } }) || Promise.resolve(0),
            TheatreBill?.count({ where: { status: 'pending' } }) || Promise.resolve(0)
        ]);

        const totalPendingBills = pendingOPD + pendingIPD + pendingPharmacy + pendingLab + pendingRadiology;

        // 4. Revenue by Scheme (Grouped by Patient's Payment Method)
        // Note: For actual scheme names, we would join with Scheme model. 
        // For simplicity, we use patientType or paymentMethod from Patient.
        const schemeRevenue = await Payment.findAll({
            attributes: [
                [sequelize.literal('"patient"."payment_method"'), 'scheme'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            include: [{
                model: Patient,
                as: 'patient',
                attributes: []
            }],
            group: [sequelize.literal('"patient"."payment_method"')],
            raw: true
        });

        // 5. Inventory Alerts (Low stock)
        const lowStockItems = await sequelize.query(`
            SELECT COUNT(*) as count FROM medications m
            LEFT JOIN (
                SELECT medication_id, SUM(quantity_on_hand) as total_qty 
                FROM pharmacy_batches 
                WHERE is_active = true 
                GROUP BY medication_id
            ) b ON m.id = b.medication_id
            WHERE m.is_active = true AND COALESCE(b.total_qty, 0) <= m.reorder_level
        `, { type: sequelize.QueryTypes.SELECT });

        res.json({
            totalRevenue: parseFloat(totalRevenue),
            todayRevenue: parseFloat(todayRevenue),
            monthRevenue: parseFloat(monthRevenue),
            totalPendingBills,
            patientStats: {
                totalRegistered,
                newToday,
                currentlyAdmitted: activeInpatients
            },
            clinicalActivity: {
                opdVisitsToday
            },
            billBreakdown: {
                opd: pendingOPD,
                ipd: pendingIPD,
                pharmacy: pendingPharmacy,
                laboratory: pendingLab,
                radiology: pendingRadiology,
                maternity: pendingMaternity,
                theatre: pendingTheatre
            },
            schemeRevenue: schemeRevenue.map(sr => ({
                name: sr.scheme,
                value: parseFloat(sr.total)
            })),
            alerts: {
                lowStockCount: parseInt(lowStockItems[0]?.count || 0),
                nhimaClaimsPending: 0 // Logic to be implemented when insurance claims are refined
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
