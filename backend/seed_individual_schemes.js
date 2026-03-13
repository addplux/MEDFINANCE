/**
 * MEDFINANCE360 — Individual Prepaid Schemes Seeder
 * --------------------------------------------------
 * Seeds 24 HIGH COST individual prepaid schemes with:
 *   - Scheme records (schemes table)
 *   - Patient/family member records (patients table)
 *   - Ledger transactions (individual_scheme_ledger table – auto-created)
 *
 * Run: node seed_individual_schemes.js
 */

const { sequelize } = require('./config/database');
const { Scheme, Patient } = require('./models');
const { QueryTypes } = require('sequelize');

// ── helper: parse "DD.MM.YYYY" or "YYYY" or "DD/MM/YYYY" to YYYY-MM-DD ────
function parseDate(raw) {
    if (!raw) return '1900-01-01';
    raw = raw.toString().trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split('.');
        return `${y}-${m}-${d}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split('/');
        return `${y}-${m}-${d}`;
    }
    if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
    // try "DD.MM.YYYY" partial or named formats
    return '1900-01-01';
}

// ── helper: parse transaction date "DD.MM.YY" or "DD.MM.YYYY" or "YYYY" ──
function parseTxDate(raw) {
    if (!raw) return '2025-01-01';
    raw = raw.toString().trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) {
        const [d, m, y] = raw.split('.');
        return `${y}-${m}-${d}`;
    }
    if (/^\d{2}\.\d{2}\.\d{2}$/.test(raw)) {
        const [d, m, y] = raw.split('.');
        return `20${y}-${m}-${d}`;
    }
    if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
    return '2025-01-01';
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const SCHEMES = [

    // 1. FRANK CHIKANGE
    {
        shc: '20110816', name: 'FRANK CHIKANGE', ledger: null,
        address: 'H/N 26 MUSUKU K/SOUTH', phone: '0964721558',
        finalBalance: 1939.75,
        members: [
            { name: 'FRANK CHIKANGE',  dob: '14.04.1949', gender: 'male',   nrc: '165830/52/1', rank: 'principal' },
            { name: 'MARY CHIKANGE',   dob: '27.03.1955', gender: 'female',  nrc: null,          rank: 'spouse'    },
            { name: 'NATASHA CHIKANGE',dob: '26.12.2010', gender: 'female',  nrc: null,          rank: 'child'     },
        ],
        txns: [
            { date: '01.01.2025', desc: 'Balance b/f',              dr: 0,    cr: 0,    bal: 2189.75 },
            { date: '01.01.2025', desc: 'MEMBERSHIP*3',             dr: 300,  cr: 0,    bal: 1889.75 },
            { date: '10.03.2025', desc: 'PAYMENT RCT # 12012880',   dr: 0,    cr: 300,  bal: 2189.75 },
            { date: '27.10.2025', desc: 'consultation',             dr: 250,  cr: 0,    bal: 1939.75 },
        ],
    },

    // 2. NAOMI KUNDA
    {
        shc: '20250301', name: 'NAOMI KUNDA', ledger: null,
        address: null, phone: null, finalBalance: 0,
        members: [],
        txns: [
            { date: '01.03.2025', desc: 'PAYMENT RCT #',            dr: 0,    cr: 2000, bal: 2100 },
            { date: '01.03.2025', desc: 'MEMBERSHIP*1',             dr: 100,  cr: 0,    bal: 2000 },
            { date: '18.03.2025', desc: 'PAYMENT RCT # 12012882',   dr: 0,    cr: 3752, bal: 5752 },
            { date: '18.03.2025', desc: 'Medical bill # 1209',      dr: 5752, cr: 0,    bal: 0    },
        ],
    },

    // 3. EMMANUEL MWILA
    {
        shc: '20161205', name: 'EMMANUEL MWILA', ledger: '102',
        address: null, phone: null, finalBalance: 1250,
        members: [
            { name: "CEPHUS NG'AMBI",  dob: '1959', gender: 'male',   nrc: null, rank: 'dependant' },
            { name: "MONICA NG'AMBI",  dob: '1965', gender: 'female', nrc: null, rank: 'dependant' },
            { name: 'GRENDA MWAPE',    dob: '2002', gender: 'female', nrc: null, rank: 'dependant' },
        ],
        txns: [
            { date: '01.01.2025', desc: 'Balance b/f',              dr: 0,    cr: 0,   bal: 1000 },
            { date: '16.01.2025', desc: 'PAYMENT RCT #12012906',    dr: 0,    cr: 500, bal: 1500 },
            { date: '09.09.2025', desc: 'consultation',             dr: 250,  cr: 0,   bal: 1250 },
        ],
    },

    // 4. MOSES CHILEYA
    {
        shc: '20050620', name: 'MOSES CHILEYA', ledger: '080',
        address: null, phone: null, finalBalance: 2956.45,
        members: [
            { name: 'MOSES CHILEYA',       dob: '08.08.1976', gender: 'male',   nrc: '241967/64/1', rank: 'principal' },
            { name: 'DINA PHIRI CHILEYA',  dob: '1982',       gender: 'female', nrc: null,           rank: 'spouse'    },
            { name: 'GRACE C CHILEYA',     dob: '1998',       gender: 'female', nrc: null,           rank: 'child'     },
            { name: 'MAXWELL C CHILEYA',   dob: '2002',       gender: 'male',   nrc: null,           rank: 'child'     },
            { name: 'ESTHER C CHILEYA',    dob: '2005',       gender: 'female', nrc: null,           rank: 'child'     },
            { name: 'MUSONDA C CHILEYA',   dob: '1900',       gender: 'female', nrc: null,           rank: 'child'     },
            { name: 'ZELLEN C CHILEYA',    dob: '1900',       gender: 'female', nrc: null,           rank: 'child'     },
            { name: 'MOSES C CHILEYA JR',  dob: '1900',       gender: 'male',   nrc: null,           rank: 'child'     },
        ],
        txns: [
            { date: '01.01.2022', desc: 'Bal b/fwd',                        dr: 0,    cr: 0,    bal: 3625.45 },
            { date: '01.01.2022', desc: 'Membership*8',                      dr: 800,  cr: 0,    bal: 2825.45 },
            { date: '28.06.2022', desc: 'Scheme top up 9339212',            dr: 0,    cr: 1000, bal: 3825.45 },
            { date: '08.07.2022', desc: 'medical bill #2112',               dr: 1890, cr: 0,    bal: 1935.45 },
            { date: '17.10.2022', desc: 'drugs',                             dr: 129,  cr: 0,    bal: 1806.45 },
            { date: '26.10.2022', desc: 'Scheme top up 9339248',            dr: 0,    cr: 1500, bal: 3306.45 },
            { date: '01.01.2024', desc: 'Membership*8',                      dr: 800,  cr: 0,    bal: 2506.45 },
            { date: '01.01.2024', desc: 'Scheme top up rct # 10531448',     dr: 0,    cr: 1000, bal: 3506.45 },
            { date: '01.01.2025', desc: 'Membership*8',                      dr: 800,  cr: 0,    bal: 2706.45 },
            { date: '25.07.2025', desc: 'cons',                              dr: 0,    cr: 250,  bal: 2956.45 },
        ],
    },

    // 5. JAMES MWASHA
    {
        shc: '20181205', name: 'JAMES MWASHA', ledger: '102',
        address: null, phone: null, finalBalance: 650,
        members: [
            { name: 'JAMES MWASHA', dob: '1900', gender: 'male', nrc: '199377/31/1', rank: 'principal' },
        ],
        txns: [
            { date: '01.01.2025', desc: 'Balance b/f',            dr: 0,   cr: 0,   bal: 300 },
            { date: '16.01.2025', desc: 'PAYMENT RCT #',          dr: 0,   cr: 350, bal: 650 },
        ],
    },

    // 6. MASAUSO TEMBO
    {
        shc: '20141125', name: 'MASAUSO TEMBO', ledger: '019',
        address: null, phone: '0977-18-17-83', finalBalance: 2384,
        members: [
            { name: 'MASAUSO TEMBO',     dob: '1900', gender: 'male',   nrc: null, rank: 'principal' },
            { name: "MWILA NG'ANDWE",    dob: '1900', gender: 'male',   nrc: null, rank: 'dependant' },
            { name: "DELPHINE NG'ANDWE", dob: '1900', gender: 'female', nrc: null, rank: 'dependant' },
        ],
        txns: [
            { date: '01.01.2022', desc: 'BALANCE B/F',    dr: 0,   cr: 0,   bal: 3584 },
            { date: '01.01.2022', desc: 'membership*3',   dr: 300, cr: 0,   bal: 3284 },
            { date: '01.03.2023', desc: 'membership*3',   dr: 300, cr: 0,   bal: 2984 },
            { date: '01.01.2024', desc: 'membership*3',   dr: 300, cr: 0,   bal: 2684 },
            { date: '01.01.2025', desc: 'membership*3',   dr: 300, cr: 0,   bal: 2384 },
        ],
    },

    // 7. MEENA CHIMEMBE
    {
        shc: '20241102', name: 'MEENA CHIMEMBE', ledger: null,
        address: null, phone: null, finalBalance: 550,
        members: [],
        txns: [
            { date: '11.11.2024', desc: 'Payment RCT#12012827',    dr: 0,    cr: 2100, bal: 2100 },
            { date: '11.11.2024', desc: 'MEMBERSHIP*1',             dr: 100,  cr: 0,    bal: 2000 },
            { date: '12.11.2024', desc: 'Medical bill # 1413',      dr: 1350, cr: 0,    bal: 650  },
            { date: '01.01.2025', desc: 'MEMBERSHIP*1',             dr: 100,  cr: 0,    bal: 550  },
        ],
    },

    // 8. FRED MULILO
    {
        shc: '20180912', name: 'FRED MULILO', ledger: null,
        address: '38 6TH STREET', phone: '0967461900', finalBalance: 405,
        members: [
            { name: 'FRED MULILO',    dob: '1956', gender: 'male',   nrc: null, rank: 'principal' },
            { name: 'BEUTY K MULILO', dob: '1961', gender: 'female', nrc: null, rank: 'spouse'    },
            { name: 'MICHAEL MULILO', dob: '1982', gender: 'male',   nrc: null, rank: 'child'     },
            { name: 'ESTHER MUMPELE', dob: '1946', gender: 'female', nrc: null, rank: 'dependant' },
        ],
        txns: [
            { date: '01.02.2021', desc: 'Bal b/fwd',                         dr: 0,    cr: 0,   bal: 3855 },
            { date: '01.02.2021', desc: 'membership *4',                      dr: 400,  cr: 0,   bal: 3455 },
            { date: '15.02.2021', desc: 'medical bill',                       dr: 1700, cr: 0,   bal: 1755 },
            { date: '15.02.2021', desc: 'Payment rct # 8678053',             dr: 0,    cr: 300, bal: 2055 },
            { date: '01.01.2022', desc: 'membership *4',                      dr: 400,  cr: 0,   bal: 1655 },
            { date: '01.01.2023', desc: 'membership *4',                      dr: 400,  cr: 0,   bal: 1255 },
            { date: '01.01.2024', desc: 'membership *4',                      dr: 400,  cr: 0,   bal: 855  },
            { date: '01.01.2025', desc: 'membership *3',                      dr: 300,  cr: 0,   bal: 555  },
            { date: '16.05.2025', desc: 'cons',                               dr: 150,  cr: 0,   bal: 405  },
        ],
    },

    // 9. JUSTIN MASUMBA
    {
        shc: '20250501', name: 'JUSTIN MASUMBA', ledger: null,
        address: 'H/N 1021 KANJARA RD RIVERSIDE', phone: null, finalBalance: -2665,
        members: [
            { name: 'JUSTIN MASUMBA',   dob: '1900', gender: 'male',   nrc: null,          rank: 'principal' },
            { name: 'RABECCA MAMBWE',   dob: '1900', gender: 'female', nrc: '316124/64/1', rank: 'dependant' },
        ],
        txns: [
            { date: '19.05.2025', desc: 'Payment rct # 12012923',   dr: 0,    cr: 2100, bal: 2100  },
            { date: '19.05.2025', desc: 'membership *1',             dr: 100,  cr: 0,    bal: 2000  },
            { date: '19.05.2025', desc: 'Payment rct # 12012920',   dr: 0,    cr: 250,  bal: 2250  },
            { date: '30.08.2025', desc: 'Medical bill',              dr: 4915, cr: 0,    bal: -2665 },
        ],
    },

    // 10. BEUTY NDALAMETA
    {
        shc: '20250502', name: 'BEUTY NDALAMETA', ledger: null,
        address: 'H/N 2291 OFF FRANCIS MUKUKA STAGE 2 LULAMBA', phone: null, finalBalance: 1900,
        members: [
            { name: 'BEUTY NDALAMETA', dob: '1993', gender: 'female', nrc: '320728/64/1', rank: 'principal' },
        ],
        txns: [
            { date: '28.05.2025', desc: 'Payment rct # 12012926',   dr: 0,   cr: 2100, bal: 2100 },
            { date: '28.05.2025', desc: 'membership *1',             dr: 100, cr: 0,    bal: 2000 },
            { date: '01.01.2026', desc: 'membership *1',             dr: 100, cr: 0,    bal: 1900 },
        ],
    },

    // 11. SIMON CHANDA
    {
        shc: '20230201', name: 'SIMON CHANDA', ledger: null,
        address: null, phone: null, finalBalance: 4600,
        members: [],
        txns: [
            { date: '21.01.2024', desc: 'Payment rct # 10012790',               dr: 0,   cr: 4000, bal: 4000 },
            { date: '21.01.2024', desc: 'membership*1',                          dr: 100, cr: 0,    bal: 3900 },
            { date: '01.01.2025', desc: 'membership*1',                          dr: 100, cr: 0,    bal: 3800 },
            { date: '29.01.2025', desc: 'Topup Payment rct # 12012857',         dr: 0,   cr: 500,  bal: 4300 },
            { date: '05.06.2025', desc: 'Payment rct # 12012933',               dr: 0,   cr: 300,  bal: 4600 },
        ],
    },

    // 12. MUSONDA CHILESHE
    {
        shc: '20250601', name: 'MUSONDA CHILESHE', ledger: null,
        address: null, phone: null, finalBalance: 3667,
        members: [],
        txns: [
            { date: '01.01.2025', desc: 'balance b/f',               dr: 0,    cr: 0,    bal: 2900 },
            { date: '24.06.2025', desc: 'Payment rct # 12012938',    dr: 0,    cr: 2100, bal: 5000 },
            { date: '24.06.2025', desc: 'membership*1',              dr: 100,  cr: 0,    bal: 4900 },
            { date: '27.06.2025', desc: 'Medical bill',              dr: 1233, cr: 0,    bal: 3667 },
        ],
    },

    // 13. JOSEPH MWANSA
    {
        shc: '20220405', name: 'JOSEPH MWANSA', ledger: '88',
        address: null, phone: '0971880033', finalBalance: -620,
        members: [
            { name: 'MWANSA JOSEPH',        dob: '1986', gender: 'male',   nrc: '293372/66/1', rank: 'principal' },
            { name: 'SUWILANJI NANYANGWE',   dob: '1993', gender: 'female', nrc: null,          rank: 'spouse'    },
            { name: 'ALISHA NSEBA',          dob: '2018', gender: 'female', nrc: null,          rank: 'child'     },
            { name: 'ANALIA NSEBA',          dob: '2020', gender: 'female', nrc: null,          rank: 'child'     },
        ],
        txns: [
            { date: '20.07.2025', desc: 'BALANCE B/F',           dr: 0,   cr: 0,   bal: 550  },
            { date: '20.07.2025', desc: 'MEMBERSHIP X 4',        dr: 400, cr: 0,   bal: 150  },
            { date: '20.07.2025', desc: 'Consultation',           dr: 250, cr: 0,   bal: -100 },
            { date: '20.07.2025', desc: 'Drugs',                  dr: 120, cr: 0,   bal: -220 },
            { date: '06.03.2026', desc: 'MEMBERSHIP *4',          dr: 400, cr: 0,   bal: -620 },
        ],
    },

    // 14. VIOLET JERE
    {
        shc: '20250704', name: 'VIOLET JERE', ledger: null,
        address: 'H/N 1884/2 KASUMBALESA', phone: '0977189721', finalBalance: 5000,
        members: [
            { name: 'VIOLET JERE', dob: '1900', gender: 'female', nrc: '280096/63/1', rank: 'principal' },
        ],
        txns: [
            { date: '23.07.2025', desc: 'PAYMENT RCT#12012951',    dr: 0,    cr: 2100, bal: 2100 },
            { date: '23.07.2025', desc: 'MEMBERSHIP X 1',          dr: 100,  cr: 0,    bal: 2000 },
            { date: '25.07.2025', desc: 'PAYMENT RCT#12012953',    dr: 0,    cr: 3000, bal: 5000 },
        ],
    },

    // 15. RUTH MULENGA
    {
        shc: '20250801A', name: 'RUTH MULENGA', ledger: null,
        address: 'H/N299 ABB KASOMPE', phone: '0964183020', finalBalance: 3000,
        members: [
            { name: 'RUTH MULENGA',    dob: '09.08.1980', gender: 'female', nrc: '346063/61/1', rank: 'principal' },
            { name: 'MALAN KALEYA',    dob: '21.09.1974', gender: 'male',   nrc: null,           rank: 'spouse'    },
            { name: 'MARTHA KALEYA',   dob: '28.07.2005', gender: 'female', nrc: null,           rank: 'child'     },
            { name: 'TAONGA KALEYA',   dob: '13.04.2005', gender: 'male',   nrc: null,           rank: 'child'     },
            { name: 'GIBSON KALEYA',   dob: '02.03.2009', gender: 'male',   nrc: null,           rank: 'child'     },
            { name: 'JOSEPH KALEYA',   dob: '16.06.2015', gender: 'male',   nrc: null,           rank: 'child'     },
            { name: 'MALAN K JUNIOR',  dob: '22.09.2020', gender: 'male',   nrc: null,           rank: 'child'     },
        ],
        txns: [
            { date: '05.08.2025', desc: 'PAYMENT RCT#12012955',   dr: 0,   cr: 3700, bal: 3700 },
            { date: '05.08.2025', desc: 'MEMBERSHIP X 7',         dr: 700, cr: 0,    bal: 3000 },
        ],
    },

    // 16. MUTOMBO TSHABANYA (SHC 20250801 – duplicate, use suffix B)
    {
        shc: '20250801B', name: 'MUTOMBO TSHABANYA', ledger: null,
        address: 'H/N 795 KAFULAFUTA R/SIDE', phone: '0977294143', finalBalance: 2000,
        members: [
            { name: 'MUTOMBO TSHABANYA', dob: '20.01.1950', gender: 'male', nrc: '157875/63/1', rank: 'principal' },
        ],
        txns: [
            { date: '18.08.2025', desc: 'PAYMENT RCT#12012962',   dr: 0,   cr: 2100, bal: 2100 },
            { date: '18.08.2025', desc: 'MEMBERSHIP X 1',         dr: 100, cr: 0,    bal: 2000 },
        ],
    },

    // 17. NJANJI MUMBA
    {
        shc: '20250806', name: 'NJANJI MUMBA', ledger: null,
        address: null, phone: null, finalBalance: 3250,
        members: [],
        txns: [
            { date: '28.08.2025', desc: 'BALANCE B/F',              dr: 0,   cr: 0,    bal: 1500 },
            { date: '28.08.2025', desc: 'PAYMENT RCT#12012968',     dr: 0,   cr: 2100, bal: 3600 },
            { date: '20.07.2025', desc: 'MEMBERSHIP X 1',           dr: 100, cr: 0,    bal: 3500 },
            { date: '01.09.2025', desc: 'Review',                   dr: 250, cr: 0,    bal: 3250 },
        ],
    },

    // 18. KELVIN KALIMA
    {
        shc: '20250807', name: 'KELVIN KALIMA', ledger: null,
        address: null, phone: null, finalBalance: -2720,
        members: [
            { name: 'MAUREEN KUNDA', dob: '1900', gender: 'female', nrc: '260422/68/1', rank: 'dependant' },
        ],
        txns: [
            { date: '28.08.2025', desc: 'PAYMENT RCT#12012967',   dr: 0,    cr: 2100, bal: 2100  },
            { date: '28.08.2025', desc: 'MEMBERSHIP X 1',         dr: 100,  cr: 0,    bal: 2000  },
            { date: '01.08.2025', desc: 'Medical bill # 4332',    dr: 4720, cr: 0,    bal: -2720 },
        ],
    },

    // 19. LOVENESS NAMWALE
    {
        shc: '20140306', name: 'LOVENESS NAMWALE', ledger: null,
        address: 'H/N 795 KAFULAFUTA R/SIDE', phone: '0977294143', finalBalance: 1495,
        members: [
            { name: 'LOVENESS NAMWALE', dob: '1900', gender: 'female', nrc: '157875/63/1', rank: 'principal' },
        ],
        txns: [
            { date: '18.05.2025', desc: 'PAYMENT RCT#12012962',   dr: 0,   cr: 2100, bal: 2100 },
            { date: '18.05.2025', desc: 'MEMBERSHIP X 1',         dr: 100, cr: 0,    bal: 2000 },
            { date: '18.05.2025', desc: 'Entry 505',               dr: 505, cr: 0,    bal: 1495 },
        ],
    },

    // 20. ANNIE MUSONDA
    {
        shc: '20020410A', name: 'ANNIE MUSONDA', ledger: '53',
        address: null, phone: null, finalBalance: -5403,
        members: [],
        txns: [
            { date: '01.01.2025', desc: 'Bal b/fwd',                        dr: 0,    cr: 0,    bal: 0     },
            { date: '28.11.2025', desc: 'MEMBERSHIP*8',                      dr: 0,    cr: 0,    bal: 0     },
            { date: '17.11.2025', desc: 'Payment RCT# 2528018',             dr: 0,    cr: 2500, bal: 2500  },
            { date: '26.11.2025', desc: 'Medical bill # 1927',              dr: 2994, cr: 0,    bal: -494  },
            { date: '02.12.2025', desc: 'Medical bill # 1934',              dr: 2590, cr: 0,    bal: -3084 },
            { date: '03.12.2025', desc: 'Entry 4819',                        dr: 4819, cr: 2500, bal: -5403 },
        ],
    },

    // 21. CHIFWEMBE WILLIAM (SHC 20020410 – duplicate, suffix B)
    {
        shc: '20020410B', name: 'CHIFWEMBE WILLIAM', ledger: '54',
        address: null, phone: null, finalBalance: -3440,
        members: [],
        txns: [
            { date: '26.11.2025', desc: 'Bal b/fwd',              dr: 0,    cr: 0,    bal: 0     },
            { date: '26.11.2025', desc: 'MEMBERSHIP*1',            dr: 0,    cr: 0,    bal: 0     },
            { date: '26.11.2025', desc: 'Payment RCT# 2528014',   dr: 0,    cr: 2600, bal: 2600  },
            { date: '26.11.2025', desc: 'Medical bill # 1933',    dr: 6040, cr: 0,    bal: -3440 },
        ],
    },

    // 22. ALPHA MWELELWA MUKWEMBA
    {
        shc: '20251203', name: 'ALPHA MWELELWA MUKWEMBA', ledger: null,
        address: null, phone: null, finalBalance: 2000,
        members: [
            { name: 'ALPHA MWELELWA MUKWEMBA', dob: '1900', gender: 'male', nrc: '371978/64/1', rank: 'principal' },
        ],
        txns: [
            { date: '05.11.2025', desc: 'PAYMENT RCT#2528020',   dr: 0,   cr: 2100, bal: 2100 },
            { date: '05.11.2025', desc: 'MEMBERSHIP X 1',        dr: 100, cr: 0,    bal: 2000 },
        ],
    },

    // 23. RABBECCA CHALWE
    {
        shc: '20251204', name: 'RABBECCA CHALWE', ledger: null,
        address: null, phone: null, finalBalance: 1574,
        members: [],
        txns: [
            { date: '22.12.2025', desc: 'PAYMENT RCT#2529415',   dr: 0,   cr: 2100, bal: 2100 },
            { date: '22.12.2025', desc: 'MEMBERSHIP X 1',        dr: 100, cr: 0,    bal: 2000 },
            { date: '23.12.2025', desc: 'Drugs',                  dr: 426, cr: 0,    bal: 1574 },
        ],
    },

    // 24. MUKELA PHIRI
    {
        shc: '20260103', name: 'MUKELA PHIRI', ledger: null,
        address: null, phone: '0971880033', finalBalance: 2000,
        members: [
            { name: 'MUKELA PHIRI', dob: '1900', gender: 'male', nrc: '268568/66/1', rank: 'principal' },
        ],
        txns: [
            { date: '06.01.2026', desc: 'PAYMENT RCT# 2528035',  dr: 0,   cr: 2100, bal: 2100 },
            { date: '06.01.2026', desc: 'MEMBERSHIP X 1',        dr: 100, cr: 0,    bal: 2000 },
        ],
    },

];

// ─────────────────────────────────────────────────────────────────────────────
// SEEDER
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
    const t = await sequelize.transaction();
    let totalSchemes = 0, totalMembers = 0, totalTxns = 0;
    const conflicts = [];

    try {
        // 0. Ensure individual_scheme_ledger table exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS individual_scheme_ledger (
                id          SERIAL PRIMARY KEY,
                scheme_id   INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
                tx_date     DATE,
                description VARCHAR(255),
                dr          DECIMAL(12,2) DEFAULT 0,
                cr          DECIMAL(12,2) DEFAULT 0,
                balance     DECIMAL(12,2),
                created_at  TIMESTAMP DEFAULT NOW()
            );
        `, { transaction: t });

        for (const s of SCHEMES) {
            // ── 1. Create / find scheme ──────────────────────────────────────
            const [scheme, created] = await Scheme.findOrCreate({
                where: { schemeCode: s.shc },
                defaults: {
                    schemeCode:        s.shc,
                    schemeName:        s.name,
                    schemeType:        'other',
                    billingCycle:      'annually',
                    pricingModel:      'standard',
                    contactPerson:     s.name,
                    phone:             s.phone || null,
                    status:            'active',
                    outstandingBalance: s.finalBalance < 0 ? Math.abs(s.finalBalance) : 0,
                    creditLimit:        0,
                    notes:             JSON.stringify({
                        category: 'HIGH COST',
                        ledger:   s.ledger,
                        address:  s.address,
                        finalBalance: s.finalBalance,
                    }),
                },
                transaction: t,
            });

            if (!created) conflicts.push(`Scheme ${s.shc} (${s.name}) already existed – skipped.`);
            totalSchemes++;

            // ── 2. Insert family members as Patients ─────────────────────────
            for (let i = 0; i < s.members.length; i++) {
                const m = s.members[i];
                const fullName = m.name.trim().toUpperCase().split(' ');
                const lastName  = fullName.pop() || 'UNKNOWN';
                const firstName = fullName.join(' ') || lastName;
                const dob       = parseDate(m.dob);
                const ptNum     = `${s.shc}-${String(i + 1).padStart(2, '0')}`;

                const existing = await Patient.findOne({ where: { patientNumber: ptNum }, transaction: t });
                if (existing) {
                    conflicts.push(`Patient ${ptNum} (${m.name}) already exists – skipped.`);
                    continue;
                }

                await Patient.create({
                    patientNumber:  ptNum,
                    firstName:      firstName,
                    lastName:       lastName,
                    dateOfBirth:    dob,
                    gender:         m.gender,
                    nrc:            m.nrc || null,
                    paymentMethod:  'private_prepaid',
                    costCategory:   'high_cost',
                    schemeId:       scheme.id,
                    policyNumber:   s.shc,
                    memberRank:     m.rank,
                    memberSuffix:   i + 1,
                    memberStatus:   'active',
                    balance:        i === 0 ? s.finalBalance : 0,
                }, { transaction: t });

                totalMembers++;
            }

            // Principal-only record when no members listed
            if (s.members.length === 0) {
                const ptNum = `${s.shc}-00`;
                const existing = await Patient.findOne({ where: { patientNumber: ptNum }, transaction: t });
                if (!existing) {
                    const parts = s.name.trim().toUpperCase().split(' ');
                    const lastName  = parts.pop() || 'UNKNOWN';
                    const firstName = parts.join(' ') || lastName;
                    await Patient.create({
                        patientNumber:  ptNum,
                        firstName:      firstName,
                        lastName:       lastName,
                        dateOfBirth:    '1900-01-01',
                        gender:         'other',
                        paymentMethod:  'private_prepaid',
                        costCategory:   'high_cost',
                        schemeId:       scheme.id,
                        policyNumber:   s.shc,
                        memberRank:     'principal',
                        memberSuffix:   1,
                        memberStatus:   'active',
                        balance:        s.finalBalance,
                    }, { transaction: t });
                    totalMembers++;
                }
            }

            // ── 3. Insert ledger transactions ───────────────────────────────
            for (const tx of s.txns) {
                await sequelize.query(`
                    INSERT INTO individual_scheme_ledger
                        (scheme_id, tx_date, description, dr, cr, balance)
                    VALUES (:sid, :dt, :desc, :dr, :cr, :bal)
                `, {
                    replacements: {
                        sid:  scheme.id,
                        dt:   parseTxDate(tx.date),
                        desc: tx.desc,
                        dr:   tx.dr   || 0,
                        cr:   tx.cr   || 0,
                        bal:  tx.bal  || 0,
                    },
                    type: QueryTypes.INSERT,
                    transaction: t,
                });
                totalTxns++;
            }
        }

        await t.commit();

        console.log('\n✅ Seeding complete!');
        console.log(`   Schemes inserted/found : ${totalSchemes}`);
        console.log(`   Family members inserted: ${totalMembers}`);
        console.log(`   Transactions inserted  : ${totalTxns}`);

        if (conflicts.length) {
            console.log('\n⚠️  Conflicts / duplicates:');
            conflicts.forEach(c => console.log('   -', c));
        } else {
            console.log('\n   No conflicts or duplicates detected.');
        }

        process.exit(0);
    } catch (err) {
        await t.rollback();
        console.error('\n❌ SEEDING FAILED – rolled back.');
        console.error(err);
        process.exit(1);
    }
}

seed();
