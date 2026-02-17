const { Shift, Payment, User, sequelize } = require('../models');

// Start a new shift
const startShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startCash, notes } = req.body;

        // Check for existing open shift
        const existingShift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (existingShift) {
            return res.status(400).json({ error: 'You already have an open shift. Please close it before starting a new one.' });
        }

        const shift = await Shift.create({
            userId,
            startCash: startCash || 0,
            startTime: new Date(),
            status: 'open',
            notes
        });

        res.status(201).json(shift);
    } catch (error) {
        console.error('Start shift error:', error);
        res.status(500).json({ error: 'Failed to start shift' });
    }
};

// End current shift
const endShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const { endCash, notes } = req.body;

        const shift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (!shift) {
            return res.status(404).json({ error: 'No open shift found' });
        }

        const endTime = new Date();

        // Calculate system cash (payments received by this user during this shift)
        const systemCash = await Payment.sum('amount', {
            where: {
                receivedBy: userId,
                paymentMethod: 'cash',
                paymentDate: {
                    [sequelize.Sequelize.Op.between]: [shift.startTime, endTime]
                }
            }
        }) || 0;

        await shift.update({
            endTime,
            endCash: endCash || 0,
            systemCalculatedCash: parseFloat(systemCash), // We only track cash payments for drawer balancing
            status: 'closed',
            notes: notes ? `${shift.notes ? shift.notes + '; ' : ''}Closing Note: ${notes}` : shift.notes
        });

        const shortageExcess = parseFloat(endCash) - (parseFloat(shift.startCash) + parseFloat(systemCash));

        res.json({
            shift,
            summary: {
                openingBalance: parseFloat(shift.startCash),
                systemCashCollection: parseFloat(systemCash),
                expectedClosingBalance: parseFloat(shift.startCash) + parseFloat(systemCash),
                actualClosingBalance: parseFloat(endCash),
                difference: shortageExcess
            }
        });
    } catch (error) {
        console.error('End shift error:', error);
        res.status(500).json({ error: 'Failed to end shift' });
    }
};

// Get current open shift
const getCurrentShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const shift = await Shift.findOne({
            where: {
                userId,
                status: 'open'
            }
        });

        if (!shift) {
            return res.status(404).json({ message: 'No open shift' });
        }

        // Calculate current running total
        const systemCash = await Payment.sum('amount', {
            where: {
                receivedBy: userId,
                paymentMethod: 'cash',
                paymentDate: {
                    [sequelize.Sequelize.Op.gte]: shift.startTime
                }
            }
        }) || 0;

        res.json({
            shift,
            currentSystemCash: parseFloat(systemCash)
        });
    } catch (error) {
        console.error('Get current shift error:', error);
        res.status(500).json({ error: 'Failed to get current shift' });
    }
};

// Get shift reports (history)
const getShiftReports = async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        const where = {};

        if (startDate && endDate) {
            where.startTime = {
                [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        if (userId) {
            where.userId = userId;
        } else if (req.user.role !== 'admin' && req.user.role !== 'accountant') {
            // Regular users can only see their own shifts
            where.userId = req.user.id;
        }

        const shifts = await Shift.findAll({
            where,
            include: [{
                model: User,
                attributes: ['firstName', 'lastName']
            }],
            order: [['startTime', 'DESC']]
        });

        res.json(shifts);
    } catch (error) {
        console.error('Get shift reports error:', error);
        res.status(500).json({ error: 'Failed to get shift reports' });
    }
};

module.exports = {
    startShift,
    endShift,
    getCurrentShift,
    getShiftReports
};
