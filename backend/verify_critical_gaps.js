require('dotenv').config();
const { sequelize, User, Patient, Shift, Refund, OPDBill, Payment } = require('./models');
const shiftController = require('./controllers/shiftController');
const refundController = require('./controllers/refundController');
const reportsController = require('./controllers/reportsController');

// Mock request/response
const mockReq = (body = {}, query = {}, user = {}, params = {}) => ({
    body,
    query,
    user,
    params
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const verifyGapImplementation = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // 1. Verify Exempted Patient
        console.log('\n--- Verifying Exempted Patient ---');
        // Check if enum allows 'exempted' (Simulated by creating one)
        // 1. Verify Patient Creation
        console.log('\n--- Verifying Patient Creation ---');
        try {
            const adminUser = await User.findOne({ where: { role: 'admin' } });
            // IF no admin, just find ANY user to act as creator if needed, or skip user check if model allows
            // But Patient creation doesn't require user strictly in model, but let's see.
            // Model: Patient.js

            // For STANDARD patients (cash, corporate, etc.):
            const patient = await Patient.create({
                firstName: 'TestExempt',
                lastName: 'Patient',
                dateOfBirth: '1990-01-01',
                gender: 'male',
                phone: '0999999999',
                address: 'Test Address',
                paymentMethod: 'exempted',
                costCategory: 'standard'
            });
            console.log('✅ Exempted patient created successfully:', patient.id);
            // Cleanup
            await patient.destroy();
        } catch (error) {
            console.error('❌ Exempted patient verification failed:', error.message);
        }

        // 2. Verify Shift Management
        console.log('\n--- Verifying Shift Management ---');
        let shiftId;
        try {
            const user = await User.findOne();
            if (user) {
                // Start Shift
                const startReq = mockReq({ startCash: 100, notes: 'Test Shift' }, {}, user);
                const startRes = mockRes();
                await shiftController.startShift(startReq, startRes);
                console.log('Start Shift Status:', startRes.statusCode || 200);

                if (startRes.data && startRes.data.id) {
                    shiftId = startRes.data.id;

                    // End Shift
                    const endReq = mockReq({ endCash: 100, notes: 'Closing Test' }, {}, user);
                    const endRes = mockRes(); // Fixed logic here

                    // We need to simulate the shift being "current". 
                    // shiftController.endShift finds the open shift for the user.

                    await shiftController.endShift(endReq, endRes);
                    console.log('End Shift Status:', endRes.statusCode || 200);
                    if (endRes.data && endRes.data.summary) {
                        console.log('✅ Shift cycle verified. Summary:', endRes.data.summary);
                    }
                }
            } else {
                console.log('⚠️ No users found to test shifts');
            }
        } catch (error) {
            console.error('❌ Shift verification failed:', error.message);
        }

        // 3. Verify Refund
        console.log('\n--- Verifying Refund System ---');
        try {
            // Need a payment first
            const payment = await Payment.findOne();
            if (payment) {
                const reqUser = await User.findOne();

                // Request Refund
                const refundReq = mockReq({
                    paymentId: payment.id,
                    amount: 10,
                    reason: 'Test Refund'
                }, {}, reqUser);
                const refundRes = mockRes();

                await refundController.requestRefund(refundReq, refundRes);
                console.log('Request Refund Status:', refundRes.statusCode || 200);

                if (refundRes.data && refundRes.data.id) {
                    // Approve Refund
                    const approveReq = mockReq({}, {}, reqUser, { id: refundRes.data.id });
                    const approveRes = mockRes();
                    await refundController.approveRefund(approveReq, approveRes);
                    console.log('Approve Refund Status:', approveRes.statusCode || 200);

                    if (approveRes.data && approveRes.data.status === 'approved') {
                        console.log('✅ Refund flow verified');
                        // Cleanup
                        await Refund.destroy({ where: { id: refundRes.data.id } });
                    }
                }
            } else {
                console.log('⚠️ No payments found to test refund');
            }
        } catch (error) {
            console.error('❌ Refund verification failed:', error.message);
        }

        // 4. Verify Claims Aging
        console.log('\n--- Verifying Claims Aging Report ---');
        try {
            // We need to pass query parameters
            const req = mockReq({}, { payerType: 'corporate' });
            const res = mockRes();
            await reportsController.getClaimsAging(req, res);
            console.log('Claims Aging Status:', res.statusCode || 200);
            if (res.data && res.data.summary) {
                console.log('✅ Claims Aging Report generated. Summary:', res.data.summary);
            }
        } catch (error) {
            console.error('❌ Claims Aging verification failed:', error.message);
        }

    } catch (error) {
        console.error('Global verification error:', error);
    } finally {
        await sequelize.close();
    }
};

verifyGapImplementation();
