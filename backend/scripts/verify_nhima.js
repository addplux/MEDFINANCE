const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { NHIMAClaim, ClaimBatch, User, Patient, sequelize } = require('../models');
const nhimaController = require('../controllers/nhimaController');
console.log('Imported Controller Keys:', Object.keys(nhimaController));
const { vetClaim, createBatch } = nhimaController;

const verifyNhimaWorkflow = async () => {
    try {
        console.log('--- Starting NHIMA Workflow Verification ---');

        // 1. Setup Data
        const user = await User.findOne();
        const patient = await Patient.findOne();

        if (!user || !patient) {
            console.error('❌ User or Patient not found. Seed data first.');
            return;
        }

        // 2. Create a Mock Claim
        const claim = await NHIMAClaim.create({
            claimNumber: `CLM-${Date.now()}`,
            patientId: patient.id,
            nhimaNumber: '123456789',
            claimAmount: 500.00,
            submissionDate: new Date(),
            createdBy: user.id,
            status: 'pending',
            vettingStatus: 'pending'
        });
        console.log(`✅ Created Pending Claim: ${claim.id}`);

        // 3. Simulate Vetting (Approval)
        // Mock request/response objects
        const reqVet = {
            params: { id: claim.id },
            body: { status: 'approved', notes: 'Verified by script' },
            user: { id: user.id }
        };
        const resVet = {
            json: (data) => console.log('   Vetting Response:', data.vettingStatus),
            status: (code) => ({ json: (err) => console.error('   Vetting Error:', err) })
        };

        await vetClaim(reqVet, resVet);

        const vettedClaim = await NHIMAClaim.findByPk(claim.id);
        if (vettedClaim.vettingStatus === 'approved') {
            console.log('✅ Claim Vetting Approved');
        } else {
            console.error('❌ Claim Vetting Failed');
        }

        // 4. Simulate Batch Creation
        const reqBatch = {
            body: { month: 2, year: 2026, notes: 'Automated Batch' },
            user: { id: user.id }
        };
        const resBatch = {
            status: (code) => ({
                json: (data) => {
                    console.log(`✅ Batch Created: ${data.batchNumber} (Status: ${code})`);
                    console.log(`   Total Amount: ${data.totalAmount}`);
                    console.log(`   Claim Count: ${data.claimCount}`);
                }
            }),
            json: (err) => console.error('   Batch Creation Error:', err)
        };

        await createBatch(reqBatch, resBatch);

        // 5. Verify Claim is linked to Batch
        const finalClaim = await NHIMAClaim.findByPk(claim.id);
        if (finalClaim.batchId) {
            console.log(`✅ Claim successfully linked to Batch ID: ${finalClaim.batchId}`);
        } else {
            console.error('❌ Claim NOT linked to Batch');
        }

        console.log('--- Verification Complete ---');
    } catch (error) {
        console.error('❌ Verification Script Failed:', error);
        if (error.errors) {
            error.errors.forEach((e, i) => console.error(`   Error ${i + 1}:`, e.message));
        }
    } finally {
        // Cleanup (Optional, but good for repeatability)
        // await NHIMAClaim.destroy({ where: { claimNumber: claim.claimNumber } });
    }
};

// Run if called directly
if (require.main === module) {
    verifyNhimaWorkflow().then(() => process.exit());
}

module.exports = verifyNhimaWorkflow;
