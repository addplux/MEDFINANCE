/**
 * MEDFINANCE360 — Nchanga North General Hospital Price List Seeder (2021)
 * ------------------------------------------------------------------------
 * Seeds the `services` table with the official hospital price list.
 * Includes both Low Cost and High Cost (Private) tariffs where applicable.
 * 
 * Run: node seed_nchanga_prices.js
 */

const { sequelize } = require('./config/database');
const { Service } = require('./models');

// Helper to generate a unique service code
const generateCode = (dept, type, index) => `${dept.substring(0, 3).toUpperCase()}-${type === 'High Cost' ? 'HC' : 'LC'}-${String(index).padStart(3, '0')}`;

const PRICE_LIST = [
    // ── 1. PHYSIOTHERAPY SECTION ─────────────────────────────────────────────
    // High Cost Fees (identical in both years)
    { name: 'Physiotherapy Consultation', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 250 },
    { name: 'Ante/Post Natal PT', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Infra Red Radiation', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Ultra Sound Therapy', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Shortwave Diathermy', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Wax Bath', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Nerve/Muscle Stimulation', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Exercise Therapy', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Massage Therapy', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Skin Traction', dept: 'Physiotherapy', cat: 'ipd', type: 'High Cost', price: 275 },
    { name: 'Skin Traction Using Strapping', dept: 'Physiotherapy', cat: 'ipd', type: 'High Cost', price: 100 },
    { name: 'Cervical Collar', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 150 },
    { name: 'Lumbar Corset', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 250 },
    { name: 'Knee Brace', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 200 },
    { name: 'Elbow/Axillary Crutches', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 750 },
    { name: 'Triangular Bandage', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Varicose bandage/Socks', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Crepe Bandage', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Arm Sling', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 120 },
    { name: 'Cock-up Splint Metallic Type', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Cock-up Splint POP Type', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Upper Limb (per POP used)', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Lower Limb (per POP used)', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    { name: 'Orthopaedic Review (HC)', dept: 'Physiotherapy', cat: 'opd', type: 'High Cost', price: 100 },
    
    // Low Cost Fees (2021 rates)
    { name: 'Physiotherapy 10 Sessions', dept: 'Physiotherapy', cat: 'opd', type: 'Low Cost', price: 100 },
    { name: 'Orthopaedic Review (LC)', dept: 'Physiotherapy', cat: 'opd', type: 'Low Cost', price: 100 },
    { name: 'POP for Adult', dept: 'Physiotherapy', cat: 'opd', type: 'Low Cost', price: 70 },
    { name: 'POP for Minor', dept: 'Physiotherapy', cat: 'opd', type: 'Low Cost', price: 50 },

    // ── 2. X-RAY AND SCAN ────────────────────────────────────────────────────
    // Basic X-Rays
    { name: 'CXR (Chest X-Ray)', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'CXR (Chest X-Ray)', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 100 },
    { name: 'Skull X-Ray', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Skull X-Ray', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 150 },
    { name: 'Abdominal X-Ray', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Abdominal X-Ray', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 150 },
    { name: 'Lumbar Spine X-Ray', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Lumbar Spine X-Ray', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 150 },
    { name: 'Forearm X-Ray', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Forearm X-Ray', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 100 },
    { name: 'Pelvic X-Ray', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Pelvic X-Ray', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 100 },
    { name: 'Knees X-Ray', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Knees X-Ray', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 100 },
    
    // Scans
    { name: 'Obstetrics Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Obstetrics Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 400 },
    { name: 'Pelvic Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Pelvic Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 400 },
    { name: 'Abdominal Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Abdominal Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 400 },
    { name: 'Small Parts Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 50 },
    { name: 'Small Parts Ultrasound', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 400 },

    // Special Examinations
    { name: 'HSG (Hysterosalpingography)', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 300 },
    { name: 'HSG (Hysterosalpingography)', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 450 },
    { name: 'Barium Swallow', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 100 },
    { name: 'Barium Swallow', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 300 },
    { name: 'Barium Meal', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 250 },
    { name: 'Barium Meal', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 550 },
    { name: 'Barium Enema', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 250 },
    { name: 'Barium Enema', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 650 },
    { name: 'IVU (Intravenous Urogram)', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 300 },
    { name: 'IVU (Intravenous Urogram)', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 650 },
    { name: 'Urograms (Other)', dept: 'Radiology', cat: 'radiology', type: 'Low Cost', price: 150 },
    { name: 'Urograms (Other)', dept: 'Radiology', cat: 'radiology', type: 'High Cost', price: 450 },

    // ── 3. MISCELLANEOUS / VARIOUS HOSPITAL FEES ─────────────────────────────
    { name: 'Admission Fee (Casual)', dept: 'General', cat: 'ipd', type: 'High Cost', price: 3000 },
    { name: 'Admission Fee (Casual)', dept: 'General', cat: 'ipd', type: 'Low Cost', price: 3000 }, // same across board
    { name: 'General Consultation', dept: 'OPD', cat: 'opd', type: 'High Cost', price: 250 },
    { name: 'Caesarian Section', dept: 'Maternity', cat: 'other', type: 'High Cost', price: 5000 },
    { name: 'Major Surgery', dept: 'Theatre', cat: 'other', type: 'High Cost', price: 5000 },
    { name: 'Minor Surgery', dept: 'Theatre', cat: 'other', type: 'High Cost', price: 3000 },

    // ── 4. KITCHEN / MEAL PRICE LIST (HIGH COST) ─────────────────────────────
    { name: 'Breakfast', dept: 'Kitchen', cat: 'ipd', type: 'High Cost', price: 30 },
    { name: 'Tea Break', dept: 'Kitchen', cat: 'ipd', type: 'High Cost', price: 10 },
    { name: 'Lunch/Supper (Chicken)', dept: 'Kitchen', cat: 'ipd', type: 'High Cost', price: 50 },
    { name: 'Lunch/Supper (Fish)', dept: 'Kitchen', cat: 'ipd', type: 'High Cost', price: 50 },
    { name: 'Lunch/Supper (T-Bone)', dept: 'Kitchen', cat: 'ipd', type: 'High Cost', price: 50 },
    { name: 'Lunch/Supper (Beef Stew)', dept: 'Kitchen', cat: 'ipd', type: 'High Cost', price: 50 },

    // ── 5. SCHEME MEMBERSHIP / ADMIN FEES ────────────────────────────────────
    { name: 'Scheme Membership (Zambian)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 100 },
    { name: 'Scheme Membership (Non-Zambian)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 150 },
    { name: 'Scheme Consultation (Zambian)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 250 },
    { name: 'Scheme Consultation (Non-Zambian)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 300 },
    { name: 'Scheme Deposit (1-2 Family Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 2000 },
    { name: 'Scheme Deposit (3-5 Family Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 2500 },
    { name: 'Scheme Deposit (6+ Family Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 3000 },
    { name: 'Board & Lodging per Night', dept: 'Admin', cat: 'ipd', type: 'High Cost', price: 500 },
    { name: 'Company Registration', dept: 'Admin', cat: 'other', type: 'High Cost', price: 100 },
    { name: 'Company Deposit (5-10 Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 5000 },
    { name: 'Company Deposit (11-25 Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 6000 },
    { name: 'Company Deposit (26-50 Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 8000 },
    { name: 'Company Deposit (51-100 Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 10500 },
    { name: 'Company Deposit (101-499 Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 17000 },
    { name: 'Company Deposit (500+ Members)', dept: 'Admin', cat: 'other', type: 'High Cost', price: 18000 },
];

async function seedPrices() {
    const t = await sequelize.transaction();
    let inserted = 0, skipped = 0;

    try {
        console.log('🚨 Seeding Nchanga North General Hospital Price List (2021)...\n');

        let counters = { Physiotherapy: 1, Radiology: 1, General: 1, OPD: 1, Maternity: 1, Theatre: 1, Kitchen: 1, Admin: 1 };

        for (const item of PRICE_LIST) {
            const code = generateCode(item.dept, item.type, counters[item.dept]++);

            // Check if service exists by name & tariffType to prevent huge duplicate lists
            const exists = await Service.findOne({
                where: { serviceName: item.name, tariffType: item.type },
                transaction: t
            });

            if (exists) {
                // optional: update price if it changed
                if (parseFloat(exists.price) !== item.price) {
                    await exists.update({ price: item.price, cashPrice: item.price, schemePrice: item.price, corporatePrice: item.price }, { transaction: t });
                    console.log(`  🔄 Updated: ${item.name} (${item.type}) → K${item.price}`);
                    inserted++;
                } else {
                    skipped++;
                }
                continue;
            }

            await Service.create({
                serviceCode: code,
                serviceName: item.name,
                category: item.cat,
                department: item.dept,
                tariffType: item.type,
                price: item.price,
                cashPrice: item.price,
                corporatePrice: item.price,
                schemePrice: item.price,
                staffPrice: item.price,
                isActive: true
            }, { transaction: t });
            
            console.log(`  ✅ Added: ${code} - ${item.name} (${item.type}) - K${item.price}`);
            inserted++;
        }

        await t.commit();
        console.log(`\n✅ Done. ${inserted} new/updated services, ${skipped} skipped (already correct).`);
        process.exit(0);

    } catch (err) {
        await t.rollback();
        console.error('\n❌ FAILED – transaction rolled back.', err);
        process.exit(1);
    }
}

seedPrices();
