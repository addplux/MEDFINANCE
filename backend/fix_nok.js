/**
 * Backfill: set next-of-kin fields on principal patients from family data.
 * Run: node fix_nok.js
 */
const { Patient } = require('./models');

const NOK_MAP = [
    // shc,            principalPtNum,    nokName,               nokPhone,        nokRel
    ['20110816',   '20110816-01',   'MARY CHIKANGE',          null,            'Spouse'   ],
    ['20050620',   '20050620-01',   'DINA PHIRI CHILEYA',     null,            'Spouse'   ],
    ['20141125',   '20141125-01',   "MWILA NG'ANDWE",         '0977-18-17-83', 'Family'   ],
    ['20180912',   '20180912-01',   'BEUTY K MULILO',         '0967461900',    'Spouse'   ],
    ['20250501',   '20250501-01',   'RABECCA MAMBWE',         null,            'Mother'   ],
    ['20220405',   '20220405-01',   'SUWILANJI NANYANGWE',    '0971880033',    'Spouse'   ],
    ['20250801A',  '20250801A-01',  'MALAN KALEYA',           '0964183020',    'Spouse'   ],
    ['20250807',   '20250807-01',   'MAUREEN KUNDA',          null,            'Mother'   ],
    // Schemes where the primary client is the only/principal patient
    ['20161205',   '20161205-01',   "CEPHUS NG'AMBI",         null,            'Family'   ],
];

async function fix() {
    let updated = 0;
    for (const [, ptNum, nokName, nokPhone, nokRel] of NOK_MAP) {
        const patient = await Patient.findOne({ where: { patientNumber: ptNum } });
        if (!patient) { console.log(`⚠️  Not found: ${ptNum}`); continue; }
        await patient.update({
            emergencyContact:      nokName,
            emergencyPhone:        nokPhone || null,
            nextOfKinRelationship: nokRel,
        });
        console.log(`✅ Updated ${ptNum} (${patient.firstName} ${patient.lastName}) → NOK: ${nokName}`);
        updated++;
    }
    console.log(`\nDone. ${updated} patient records updated.`);
    process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
