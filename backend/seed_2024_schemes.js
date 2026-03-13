/**
 * MEDFINANCE360 — 2024 Individual Prepaid Schemes Seeder
 * --------------------------------------------------------
 * Seeds 28 new HIGH COST individual prepaid schemes (32 listed, 4 skipped as duplicates).
 * Run: node seed_2024_schemes.js
 *
 * SKIPPED (already in DB from 2025 seed):
 *   - Frank Chikange      (20110816)
 *   - Moses Chileya       (20050620)
 *   - Emmanuel Mwila      (20161205)
 *   - Meena Chimembe      (20241102)
 *
 * SHC CONFLICTS:
 *   - Mary Tandeo: original SHC 20141125 conflicts with Masauso Tembo → stored as 20141125B
 *   - Simon Chanda 2024: SHC 20220534 (different from 2025 file's 20230201) → treated as new
 */

const { sequelize } = require('./config/database');
const { Scheme, Patient } = require('./models');
const { QueryTypes } = require('sequelize');

function parseDate(raw) {
    if (!raw) return '1900-01-01';
    raw = raw.toString().trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) { const [d,m,y]=raw.split('.'); return `${y}-${m}-${d}`; }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) { const [d,m,y]=raw.split('/'); return `${y}-${m}-${d}`; }
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(raw))  { const [d,m,y]=raw.split('/'); return `20${y}-${m}-${d}`; }
    if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
    return '1900-01-01';
}

function parseTxDate(raw) {
    if (!raw) return '2024-01-01';
    raw = raw.toString().trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) { const [d,m,y]=raw.split('.'); return `${y}-${m}-${d}`; }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) { const [d,m,y]=raw.split('/'); return `${y}-${m}-${d}`; }
    if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;
    if (/^\d{5}$/.test(raw)) { // excel serial: approx 1900-01-01 epoch
        const d = new Date((parseInt(raw) - 25569) * 86400 * 1000);
        return d.toISOString().split('T')[0];
    }
    return '2024-01-01';
}

// ─────────────────────────────────────────────────────────────────────────────
const SCHEMES = [

// 1. RICHARD MUTONDO
{
  shc:'20210707', name:'RICHARD MUTONDO', ledger:null, address:null, phone:null, finalBalance:626,
  members:[
    {name:'CATHRINE SAKUWAHA',    dob:'12/01/1982', gender:'female', nrc:null, rank:'spouse'   },
    {name:'AGATHA MUTONDO',       dob:'14/08/1998', gender:'female', nrc:null, rank:'child'    },
    {name:'RICHARD MUTONDO JNR',  dob:'23/07/2001', gender:'male',   nrc:null, rank:'child'    },
    {name:'MARTIN MUTONDO',       dob:'06/02/2006', gender:'male',   nrc:null, rank:'child'    },
    {name:'PETIENCE MUTONDO',     dob:'22/01/2011', gender:'female', nrc:null, rank:'child'    },
    {name:'EMMANUEL MUTONDO',     dob:'26/10/2008', gender:'male',   nrc:null, rank:'child'    },
  ],
  txns:[
    {date:'01.01.2022', desc:'BALANCE B/F',                  dr:0,    cr:0,   bal:4400  },
    {date:'01.01.2022', desc:'MEMBERSHIP*7',                 dr:700,  cr:0,   bal:3700  },
    {date:'20.04.2022', desc:'PAYMENT RCT # 9339179',        dr:0,    cr:300, bal:4000  },
    {date:'01.01.2023', desc:'MEMBERSHIP*7',                 dr:700,  cr:0,   bal:3300  },
    {date:'01.01.2023', desc:'medical bill',                 dr:1850, cr:0,   bal:1450  },
    {date:'01.01.2024', desc:'MEMBERSHIP*7',                 dr:700,  cr:0,   bal:750   },
    {date:'28.02.2024', desc:'PAYMENT RCT # 9339179',        dr:0,    cr:500, bal:1250  },
    {date:'01.02.2025', desc:'MEMBERSHIP*7',                 dr:700,  cr:0,   bal:550   },
    {date:'12.02.2025', desc:'PAYMENT RCT # 12012874',       dr:0,    cr:800, bal:1350  },
    {date:'31.01.2025', desc:'cons',                         dr:250,  cr:0,   bal:1100  },
    {date:'31.01.2025', desc:'drugs',                        dr:80,   cr:0,   bal:1020  },
    {date:'05.02.2025', desc:'con',                          dr:250,  cr:0,   bal:770   },
    {date:'05.02.2025', desc:'drugs',                        dr:48,   cr:0,   bal:722   },
    {date:'10.02.2025', desc:'drugs',                        dr:96,   cr:0,   bal:626   },
  ],
},

// 3. CHANSA LUKWESA GRACE (partial transactions – final bal 338)
{
  shc:'20181201', name:'CHANSA LUKWESA GRACE', ledger:null, address:null, phone:null, finalBalance:338,
  members:[
    {name:'GRACE LUKWESA',   dob:'1965', gender:'female', nrc:null, rank:'principal'},
    {name:'MWILA D CHANSA',  dob:'1997', gender:'male',   nrc:null, rank:'child'   },
  ],
  txns:[
    {date:'2020-01-01', desc:'Balance b/f (from 2024 Excel)',  dr:0, cr:0, bal:338},
  ],
},

// 4. GEOFFERY MUSONDA (partial – final bal 3067)
{
  shc:'20201105', name:'GEOFFERY MUSONDA', ledger:null, address:null, phone:null, finalBalance:3067,
  members:[
    {name:'MWILA MASABO MUSONDA',   dob:'1900', gender:'female', nrc:null, rank:'spouse'  },
    {name:'AGNESS YABIKA MUSONDA',  dob:'1900', gender:'female', nrc:null, rank:'child'   },
    {name:'GETRUDE MWILA MUSONDA',  dob:'1900', gender:'female', nrc:null, rank:'child'   },
  ],
  txns:[
    {date:'2020-01-01', desc:'Balance b/f (from 2024 Excel)',  dr:0, cr:0, bal:3067},
  ],
},

// 5. KILLAN MUSONDA (partial – final bal 76)
{
  shc:'20230402', name:'KILLAN MUSONDA', ledger:null, address:null, phone:null, finalBalance:76,
  members:[
    {name:'MUSONDA MAKAYI S', dob:'1979', gender:'female', nrc:null, rank:'spouse'},
    {name:'CLEMENT MUSEKIWA', dob:'2000', gender:'male',   nrc:null, rank:'child' },
    {name:'DANCEN MUSEKIWA',  dob:'2006', gender:'male',   nrc:null, rank:'child' },
    {name:'SELIYA MUSEKIWA',  dob:'2009', gender:'female', nrc:null, rank:'child' },
  ],
  txns:[
    {date:'2023-01-01', desc:'Balance b/f (from 2024 Excel)',  dr:0, cr:0, bal:76},
  ],
},

// 7. LAMECK NSAMBA (partial – final bal 354)
{
  shc:'20151013', name:'LAMECK NSAMBA', ledger:null, address:null, phone:null, finalBalance:354,
  members:[],
  txns:[
    {date:'2021-01-01', desc:'Balance b/f (from 2024 Excel)', dr:0, cr:0, bal:354},
  ],
},

// 8. MARY TANDEO — SHC 20141125 conflicts with Masauso Tembo, stored as 20141125B
{
  shc:'20141125B', name:'MARY TANDEO', ledger:null, address:null, phone:null, finalBalance:2078,
  members:[
    {name:"FORTUNATO NG'ANDWE", dob:'20.06.1944', gender:'male',   nrc:'137492/64/1', rank:'principal'},
    {name:"MWILA NG'ANDWE",     dob:'1900',       gender:'male',   nrc:null,          rank:'dependant'},
    {name:"DELPHINE NG'ANDWE",  dob:'1900',       gender:'female', nrc:null,          rank:'dependant'},
  ],
  txns:[
    {date:'2024-01-01', desc:'Balance b/f (from 2024 Excel)', dr:0, cr:0, bal:2078},
  ],
},

// 9. NYIMBILI KELLIES
{
  shc:'20161105', name:'NYIMBILI KELLIES', ledger:'128', address:null, phone:null, finalBalance:81.5,
  members:[],
  txns:[
    {date:'01.01.2021', desc:'Balance b/f',                                    dr:0,      cr:0,     bal:2429.5 },
    {date:'01.01.2021', desc:'Membership*2',                                   dr:200,    cr:0,     bal:2229.5 },
    {date:'29.10.2021', desc:'Payment rct # 9472120',                          dr:0,      cr:200,   bal:2429.5 },
    {date:'29.10.2021', desc:'cons',                                           dr:250,    cr:0,     bal:4479.5 },
    {date:'29.10.2021', desc:'drugs',                                          dr:250,    cr:0,     bal:4304.5 },
    {date:'31.10.2021', desc:'Payment rct # 9339048',                          dr:0,      cr:175,   bal:5004.5 },
    {date:'02.11.2021', desc:'MEDICAL BILL # 1301',                            dr:261.5,  cr:0,     bal:4743   },
    {date:'03.11.2021', desc:'Payment rct # 9339051',                          dr:0,      cr:4743,  bal:3761.5 },
    {date:'01.01.2022', desc:'Membership*2',                                   dr:200,    cr:0,     bal:3561.5 },
    {date:'09.10.2023', desc:'payment rct # 10531366',                         dr:0,      cr:300,   bal:3861.5 },
    {date:'12.10.2023', desc:'Medical BILL',                                   dr:300,    cr:0,     bal:3561.5 },
    {date:'01.01.2024', desc:'Membership*2',                                   dr:200,    cr:0,     bal:3361.5 },
    {date:'01.01.2024', desc:'cons',                                           dr:200,    cr:0,     bal:311.5  },
    {date:'01.01.2024', desc:'drugs',                                          dr:230,    cr:0,     bal:81.5   },
  ],
},

// 10. MWEWA V.J MULONDA
{
  shc:'20140904', name:'MWEWA V J MULONDA', ledger:'013', address:null, phone:'0969478985', finalBalance:3363.7,
  members:[],
  txns:[
    {date:'01.01.2025', desc:'balance b/f',                           dr:0,    cr:0,    bal:2563.7 },
    {date:'01.01.2025', desc:'MEMBERSHIP*5',                          dr:500,  cr:0,    bal:2063.7 },
    {date:'11.04.2025', desc:'Sch Top up rct 9339170',                dr:0,    cr:2500, bal:4563.7 },
    {date:'11.04.2025', desc:'CONSULTATION',                          dr:1200, cr:0,    bal:3363.7 },
  ],
},

// 11. JESEY KAWAYA / FRIDAH L
{
  shc:'20190105', name:'JESEY KAWAYA', ledger:null, address:null, phone:null, finalBalance:-30,
  members:[
    {name:'FRIDAH L',   dob:'1991', gender:'female', nrc:null, rank:'principal'},
    {name:'KAWAYA J',   dob:'2013', gender:'male',   nrc:null, rank:'child'   },
    {name:'MARY KAWAYA',dob:'2018', gender:'male',   nrc:null, rank:'child'   },
    {name:'JANE KAWAYA',dob:'2022', gender:'female', nrc:null, rank:'child'   },
  ],
  txns:[
    {date:'2019-01-01', desc:'PAYMENT',                          dr:0,    cr:2000, bal:2000  },
    {date:'2019-01-01', desc:'MEMBERSHIP X 1',                   dr:80,   cr:0,    bal:1920  },
    {date:'30.04.2019', desc:'cons',                             dr:80,   cr:0,    bal:1820  },
    {date:'22.09.2019', desc:'PAYMENT RCT',                      dr:0,    cr:100,  bal:1920  },
    {date:'01.01.2022', desc:'MEMBERSHIP X 5',                   dr:500,  cr:0,    bal:3320  },
    {date:'01.01.2022', desc:'DRUGS',                            dr:150,  cr:0,    bal:3170  },
    {date:'01.01.2023', desc:'MEMBERSHIP X 5',                   dr:500,  cr:0,    bal:2670  },
    {date:'01.01.2023', desc:'cons',                             dr:200,  cr:0,    bal:2470  },
    {date:'01.01.2024', desc:'MEMBERSHIP X 5',                   dr:200,  cr:0,    bal:2270  },
    {date:'03.04.2024', desc:'PAYMENT RCT # 10531459',           dr:0,    cr:500,  bal:2770  },
    {date:'09.04.2024', desc:'antenatal booking',                dr:30,   cr:0,    bal:2740  },
    {date:'09.04.2024', desc:'Adjustment – final ledger',        dr:2770, cr:0,    bal:-30   },
  ],
},

// 12. JUDITH KABWE
{
  shc:'20240401', name:'JUDITH KABWE', ledger:null, address:null, phone:null, finalBalance:211,
  members:[],
  txns:[
    {date:'07.04.2024', desc:'PAYMENT',                 dr:0,    cr:2000, bal:2000 },
    {date:'07.04.2024', desc:'MEMBERSHIP X 1',          dr:100,  cr:0,    bal:1900 },
    {date:'07.04.2024', desc:'cons',                    dr:250,  cr:0,    bal:1650 },
    {date:'07.04.2024', desc:'drugs',                   dr:154,  cr:0,    bal:1496 },
    {date:'02.10.2024', desc:'cons',                    dr:250,  cr:0,    bal:1246 },
    {date:'02.10.2024', desc:'DRUGS',                   dr:250,  cr:0,    bal:996  },
    {date:'01.01.2025', desc:'MEMBERSHIP X 5',          dr:340,  cr:0,    bal:656  },
    {date:'01.01.2025', desc:'cons',                    dr:300,  cr:0,    bal:356  },
    {date:'01.01.2025', desc:'drugs',                   dr:145,  cr:0,    bal:211  },
  ],
},

// 13. JUDITH KAPANGA
{
  shc:'20170612', name:'JUDITH KAPANGA', ledger:'101', address:null, phone:null, finalBalance:-131.2,
  members:[],
  txns:[
    {date:'01.01.2020', desc:'Balance b/f',                        dr:0,    cr:0,    bal:2138.8 },
    {date:'01.01.2020', desc:'MEMBERSHIP*2',                       dr:240,  cr:0,    bal:1898.8 },
    {date:'29.06.2020', desc:'PAYMENT RCT # 8092867',              dr:0,    cr:200,  bal:2098.8 },
    {date:'27.07.2020', desc:'CONS',                               dr:150,  cr:0,    bal:1948.8 },
    {date:'24.08.2020', desc:'cons',                               dr:150,  cr:0,    bal:1798.8 },
    {date:'01.01.2021', desc:'MEMBERSHIP*2',                       dr:150,  cr:0,    bal:1648.8 },
    {date:'01.01.2021', desc:'cons',                               dr:200,  cr:0,    bal:1448.8 },
    {date:'01.01.2021', desc:'drugs',                              dr:235,  cr:0,    bal:1213.8 },
    {date:'01.01.2022', desc:'MEMBERSHIP*2',                       dr:200,  cr:0,    bal:1013.8 },
    {date:'01.01.2022', desc:'cons',                               dr:200,  cr:0,    bal:813.8  },
    {date:'01.01.2022', desc:'drugs',                              dr:240,  cr:0,    bal:573.8  },
    {date:'01.01.2023', desc:'MEMBERSHIP*2',                       dr:200,  cr:0,    bal:373.8  },
    {date:'01.01.2023', desc:'cons',                               dr:200,  cr:0,    bal:173.8  },
    {date:'01.01.2023', desc:'drugs',                              dr:105,  cr:0,    bal:68.8   },
    {date:'01.01.2024', desc:'MEMBERSHIP*2',                       dr:200,  cr:0,    bal:-131.2 },
  ],
},

// 15. MWEMBA SICHINGA
{
  shc:'20240501', name:'MWEMBA SICHINGA', ledger:null, address:null, phone:null, finalBalance:105,
  members:[],
  txns:[
    {date:'11.05.2024', desc:'PAYMENT RCT NO 10531474',      dr:0,    cr:2000, bal:2000 },
    {date:'11.05.2024', desc:'MEMBERSHIP X 1',               dr:100,  cr:0,    bal:1900 },
    {date:'15.05.2024', desc:'medical bill',                 dr:1795, cr:0,    bal:105  },
  ],
},

// 16. DERRICK KAPENDA
{
  shc:'20120737', name:'DERRICK KAPENDA', ledger:'022', address:null, phone:null, finalBalance:125.6,
  members:[],
  txns:[
    {date:'01.01.2021', desc:'Bal b/fwd',                    dr:0,    cr:0,    bal:3575.6 },
    {date:'01.01.2021', desc:'Membership *7',                dr:700,  cr:0,    bal:2875.6 },
    {date:'13.01.2021', desc:'CONS',                         dr:250,  cr:0,    bal:2625.6 },
    {date:'01.01.2022', desc:'Membership *6',                dr:600,  cr:0,    bal:2025.6 },
    {date:'04.01.2022', desc:'PAYMENT RCT# 9339103',         dr:0,    cr:1000, bal:3025.6 },
    {date:'01.01.2023', desc:'Membership *7',                dr:700,  cr:0,    bal:2325.6 },
    {date:'01.01.2023', desc:'medical bill',                 dr:1500, cr:0,    bal:825.6  },
    {date:'01.01.2024', desc:'Membership *7',                dr:700,  cr:0,    bal:125.6  },
  ],
},

// 17. NAPOLEON MWEETWA (partial)
{
  shc:'20170729', name:'NAPOLEON MWEETWA', ledger:'224', address:null, phone:'0950495750', finalBalance:1650.2,
  members:[
    {name:'NAPOLEON MWEETWA',   dob:'1964', gender:'male',   nrc:'164849/64/1', rank:'principal'},
    {name:'ANNIMARIA MWEETWA',  dob:'1965', gender:'female', nrc:null,          rank:'spouse'  },
    {name:'LEON MWEETWA',       dob:'2002', gender:'male',   nrc:null,          rank:'child'   },
  ],
  txns:[
    {date:'01.01.2020', desc:'BAL B/F',                      dr:0,    cr:0,    bal:4730.2 },
    {date:'01.01.2020', desc:'MEMBERSHIP *3',                 dr:300,  cr:0,    bal:4430.2 },
    {date:'17.08.2020', desc:'DRUGS',                        dr:23,   cr:0,    bal:4407.2 },
    {date:'07.10.2020', desc:'cons',                         dr:1876, cr:0,    bal:2531.2 },
    {date:'16.11.2020', desc:'medical bill # 785',           dr:150,  cr:0,    bal:2381.2 },
    {date:'01.01.2024', desc:'Balance carried to 2024',      dr:0,    cr:0,    bal:1650.2 },
  ],
},

// 18. GODFREY KAPANSA (partial)
{
  shc:'20200707', name:'GODFREY KAPANSA', ledger:'192', address:null, phone:null, finalBalance:26.5,
  members:[
    {name:'GODFREY KAPANSA', dob:'1960', gender:'male', nrc:null, rank:'principal'},
  ],
  txns:[
    {date:'15.07.2020', desc:'PAYMENT RCT NO.8092894',        dr:0,    cr:2100, bal:2100  },
    {date:'15.07.2020', desc:'MEMBERSHIP*1',                  dr:100,  cr:0,    bal:2000  },
    {date:'20.07.2020', desc:'MEDICAL BILL # 574',            dr:100,  cr:0,    bal:1900  },
    {date:'01.01.2024', desc:'Balance carried to 2024',       dr:0,    cr:0,    bal:26.5  },
  ],
},

// 19. ALICE MUYOMBO (partial)
{
  shc:'20240601', name:'ALICE MUYOMBO', ledger:null, address:null, phone:'0967060619', finalBalance:0,
  members:[
    {name:'ALICE MUYOMBO', dob:'1993', gender:'female', nrc:null, rank:'principal'},
  ],
  txns:[
    {date:'13.06.2024', desc:'PAYMENT RCT NO.10531499',       dr:0,    cr:2100, bal:2100  },
    {date:'13.06.2024', desc:'MEMBERSHIP *1',                 dr:100,  cr:0,    bal:2000  },
    {date:'19.06.2024', desc:'TOP UP RCT# 12012751',          dr:0,    cr:3000, bal:5000  },
    {date:'25.06.2024', desc:'MEDICAL BILL #3453 (net)',       dr:5000, cr:0,    bal:0     },
  ],
},

// 20. DICKSON CHILIMA (partial)
{
  shc:'20220509', name:'DICKSON CHILIMA', ledger:null, address:null, phone:null, finalBalance:-750,
  members:[
    {name:'NATHAN CHILIMA',      dob:'1900', gender:'male', nrc:null, rank:'child'},
    {name:'DICKSON CHILIMA JR',  dob:'1900', gender:'male', nrc:null, rank:'child'},
  ],
  txns:[
    {date:'11.06.2024', desc:'PAYMENT RCT NO.12012662',       dr:0,    cr:2100, bal:2100  },
    {date:'11.06.2024', desc:'MEMBERSHIP *1',                 dr:100,  cr:0,    bal:2000  },
    {date:'19.07.2024', desc:'TOP UP RCT# 12012771',          dr:0,    cr:1000, bal:3000  },
    {date:'19.07.2024', desc:'cons',                          dr:250,  cr:0,    bal:2750  },
    {date:'25.07.2024', desc:'medical bill',                  dr:3500, cr:0,    bal:-750  },
  ],
},

// 21. RITAH MUZOKA
{
  shc:'20240701', name:'RITAH MUZOKA', ledger:null, address:null, phone:'0979241413', finalBalance:-500,
  members:[
    {name:'RITAH MUZOKA', dob:'1962', gender:'female', nrc:null, rank:'principal'},
  ],
  txns:[
    {date:'11.07.2024', desc:'PAYMENT RCT NO.12012763',       dr:0,    cr:2100, bal:2100  },
    {date:'11.07.2024', desc:'MEMBERSHIP *1',                 dr:100,  cr:0,    bal:2000  },
    {date:'15.07.2024', desc:'medical bill',                  dr:2500, cr:0,    bal:-500  },
  ],
},

// 22. TIMOTHY MUSUMUKO
{
  shc:'20240702', name:'TIMOTHY MUSUMUKO', ledger:'192', address:null, phone:null, finalBalance:-300,
  members:[
    {name:'DALISO MUSUMUKO',  dob:'1999', gender:'male',   nrc:null, rank:'child' },
    {name:'VICTOR MUSUMUKO',  dob:'2003', gender:'male',   nrc:null, rank:'child' },
    {name:'BARBRA MUSUMUKO',  dob:'1983', gender:'female', nrc:null, rank:'spouse'},
  ],
  txns:[
    {date:'13.06.2024', desc:'PAYMENT RCT NO.12012765',          dr:0,    cr:2100, bal:2100  },
    {date:'13.06.2024', desc:'MEMBERSHIP*4',                     dr:400,  cr:0,    bal:1700  },
    {date:'17.07.2024', desc:'PAYMENT RCT NO. 12012767',         dr:0,    cr:2758, bal:4458  },
    {date:'17.07.2024', desc:'NURSING CARE',                     dr:800,  cr:0,    bal:3658  },
    {date:'17.07.2024', desc:'HOSPITALISATION',                  dr:2000, cr:0,    bal:1658  },
    {date:'17.07.2024', desc:'LABORATORY EXAMINATION',           dr:200,  cr:0,    bal:1458  },
    {date:'17.07.2024', desc:'MEDICINES',                        dr:358,  cr:0,    bal:1100  },
    {date:'17.07.2024', desc:'DOCTORS ROUND',                    dr:1400, cr:0,    bal:-300  },
  ],
},

// 23. KIANA MULENGA
{
  shc:'20240802', name:'KIANA MULENGA', ledger:'495', address:null, phone:null, finalBalance:-1890,
  members:[],
  txns:[
    {date:'14.08.2024', desc:'Payment rct # 12012785',           dr:0,    cr:2100, bal:2100  },
    {date:'14.08.2024', desc:'MEMBERSHIP*1',                     dr:100,  cr:0,    bal:2000  },
    {date:'17.08.2024', desc:'MEDICAL BILL',                     dr:4290, cr:0,    bal:-2290 },
    {date:'28.08.2024', desc:'Payment rct # 12012788',           dr:0,    cr:4290, bal:2000  },
    {date:'28.08.2024', desc:'REVIEW',                           dr:3890, cr:0,    bal:-1890 },
  ],
},

// 24. MAUREEN BUNDA CHILUFYA
{
  shc:'20240803', name:'MAUREEN BUNDA CHILUFYA', ledger:'495', address:null, phone:null, finalBalance:-31,
  members:[],
  txns:[
    {date:'25.08.2024', desc:'Payment rct # 12012786',           dr:0,    cr:2100, bal:2100  },
    {date:'25.08.2024', desc:'MEMBERSHIP*1',                     dr:100,  cr:0,    bal:2000  },
    {date:'28.08.2024', desc:'TOP UP rct # 12012789',            dr:0,    cr:4000, bal:6000  },
    {date:'30.08.2024', desc:'MEDICAL BILL # 3461',              dr:6031, cr:0,    bal:-31   },
  ],
},

// 25. BWALYA CHISHIMBA KAMBWILI
{
  shc:'20181210', name:'BWALYA CHISHIMBA KAMBWILI', ledger:null, address:null, phone:'0977713025', finalBalance:-1900,
  members:[
    {name:'BWALYA CHISHIMBA KAMBWILI', dob:'26/07/1963', gender:'male', nrc:'20181210', rank:'principal'},
  ],
  txns:[
    {date:'01.01.2024', desc:'Balance b/f',                     dr:0,    cr:0,   bal:600   },
    {date:'01.01.2024', desc:'MEMBERSHIP*1',                    dr:100,  cr:0,   bal:500   },
    {date:'01.01.2024', desc:'Payment RCT#12012822',            dr:0,    cr:500, bal:1000  },
    {date:'04.11.2024', desc:'Medical bill # 1408',             dr:2900, cr:0,   bal:-1900 },
  ],
},

// 27. BRIDGET NAKAONGA (partial transactions)
{
  shc:'20140504', name:'BRIDGET NAKAONGA', ledger:'137', address:null, phone:null, finalBalance:734.9,
  members:[],
  txns:[
    {date:'01.01.2019', desc:'Balance b/f',                    dr:0,    cr:0,   bal:2249.9 },
    {date:'01.01.2019', desc:'Membership*2',                   dr:160,  cr:0,   bal:2089.9 },
    {date:'23.08.2019', desc:'cons',                           dr:50,   cr:0,   bal:2039.9 },
    {date:'11.11.2019', desc:'cons',                           dr:110,  cr:0,   bal:1929.9 },
    {date:'16.12.2019', desc:'cons',                           dr:110,  cr:0,   bal:1819.9 },
    {date:'24.12.2019', desc:'DRUGS',                          dr:85,   cr:0,   bal:1734.9 },
    {date:'01.01.2020', desc:'Membership*2',                   dr:200,  cr:0,   bal:1534.9 },
    {date:'01.01.2021', desc:'Membership*2',                   dr:200,  cr:0,   bal:1334.9 },
    {date:'01.01.2022', desc:'Membership*2',                   dr:200,  cr:0,   bal:1134.9 },
    {date:'01.01.2023', desc:'Membership*2',                   dr:200,  cr:0,   bal:934.9  },
    {date:'01.01.2024', desc:'Membership*2',                   dr:200,  cr:0,   bal:734.9  },
  ],
},

// 28. SIMON CHANDA (2024 – SHC 20220534, different from 2025 file 20230201)
{
  shc:'20220534', name:'SIMON CHANDA (2024)', ledger:null, address:null, phone:null, finalBalance:500,
  members:[],
  txns:[
    {date:'21.01.2024', desc:'Payment rct # 10012790',          dr:0,    cr:4000, bal:4000  },
    {date:'21.01.2024', desc:'membership*1',                    dr:100,  cr:0,    bal:3900  },
    {date:'21.01.2024', desc:'medical bill',                    dr:3500, cr:0,    bal:400   },
    {date:'01.01.2025', desc:'membership*1',                    dr:100,  cr:0,    bal:300   },
    {date:'01.01.2025', desc:'cons',                            dr:250,  cr:0,    bal:50    },
    {date:'29.01.2025', desc:'Payment rct # 12012857',          dr:0,    cr:500,  bal:550   },
    {date:'29.01.2025', desc:'drugs',                           dr:50,   cr:0,    bal:500   },
  ],
},

// 29. MARY KAINDA
{
  shc:'20241202', name:'MARY KAINDA', ledger:null, address:null, phone:null, finalBalance:2050,
  members:[],
  txns:[
    {date:'21.01.2024', desc:'payment rct',                     dr:0,    cr:2100, bal:2100  },
    {date:'21.01.2024', desc:'membership*1',                    dr:100,  cr:0,    bal:2000  },
    {date:'21.01.2024', desc:'cons',                            dr:250,  cr:0,    bal:1750  },
    {date:'21.01.2024', desc:'DRUGS',                           dr:530,  cr:0,    bal:1220  },
    {date:'01.01.2025', desc:'membership*1',                    dr:100,  cr:0,    bal:1120  },
    {date:'02.05.2025', desc:'CONS',                            dr:250,  cr:0,    bal:870   },
    {date:'02.05.2025', desc:'DRUGS',                           dr:320,  cr:0,    bal:550   },
    {date:'02.06.2025', desc:'cons',                            dr:250,  cr:0,    bal:300   },
    {date:'04.08.2025', desc:'DRUGS',                           dr:250,  cr:0,    bal:50    },
    {date:'08.11.2025', desc:'payment rct',                     dr:0,    cr:2000, bal:2050  },
  ],
},

// 30. JEFFREY LUNGU
{
  shc:'20250101', name:'JEFFREY LUNGU', ledger:null, address:null, phone:null, finalBalance:-135,
  members:[],
  txns:[
    {date:'13.01.2025', desc:'payment rct #12012856',           dr:0,    cr:2100, bal:2100  },
    {date:'13.01.2025', desc:'membership*1',                    dr:100,  cr:0,    bal:2000  },
    {date:'13.01.2025', desc:'medical bill',                    dr:1700, cr:0,    bal:300   },
    {date:'13.01.2025', desc:'cons',                            dr:250,  cr:0,    bal:50    },
    {date:'13.01.2025', desc:'drugs',                           dr:185,  cr:0,    bal:-135  },
  ],
},

// 31. AMON CHAMPO
{
  shc:'20040422', name:'AMON CHAMPO', ledger:null, address:null, phone:null, finalBalance:590,
  members:[
    {name:'LISA MUSONDA EUNICE', dob:'1900', gender:'female', nrc:null, rank:'dependant'},
  ],
  txns:[
    {date:'01.02.2024', desc:'Bal b/fwd',                      dr:0,    cr:0,    bal:2850  },
    {date:'01.02.2024', desc:'membership *2',                  dr:200,  cr:0,    bal:2650  },
    {date:'05.08.2025', desc:'cons',                           dr:200,  cr:0,    bal:2450  },
    {date:'05.08.2025', desc:'medical bill',                   dr:1300, cr:0,    bal:1150  },
    {date:'05.08.2025', desc:'drugs',                          dr:360,  cr:0,    bal:790   },
    {date:'05.08.2025', desc:'membership *2',                  dr:200,  cr:0,    bal:590   },
  ],
},

// 32. MUKOSA CHIPWENDE
{
  shc:'20140914', name:'MUKOSA CHIPWENDE', ledger:'117', address:null, phone:null, finalBalance:0,
  members:[
    {name:'MUKOSA CHIPWENDE',  dob:'1900',       gender:'male',   nrc:'368275/67/1', rank:'principal'},
    {name:'WINNIE CHIPWENDE',  dob:'29/08/1981', gender:'female', nrc:null,          rank:'spouse'  },
    {name:'FALECY CHIPWENDE',  dob:'1900',       gender:'male',   nrc:null,          rank:'child'   },
  ],
  txns:[
    {date:'01.01.2022', desc:'Balance b/f',                    dr:0,    cr:0,    bal:3454.6 },
    {date:'01.01.2022', desc:'MEMBERSHIP*2',                   dr:200,  cr:0,    bal:3254.6 },
    {date:'01.01.2023', desc:'MEMBERSHIP*2',                   dr:200,  cr:0,    bal:3054.6 },
    {date:'01.01.2024', desc:'MEMBERSHIP*2',                   dr:200,  cr:0,    bal:2854.6 },
    {date:'01.01.2025', desc:'MEMBERSHIP*2',                   dr:200,  cr:0,    bal:2654.6 },
    {date:'25.02.2025', desc:'PAYMENT RCT# 12012876',          dr:0,    cr:200,  bal:2854.6 },
    {date:'25.02.2025', desc:'CONS',                           dr:150,  cr:0,    bal:2704.6 },
    {date:'21.03.2025', desc:'DRUGS',                          dr:150,  cr:0,    bal:2554.6 },
    {date:'21.03.2025', desc:'bill adjustment',                dr:2554.6, cr:0,  bal:0      },
  ],
},

]; // end SCHEMES

// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
    const t = await sequelize.transaction();
    let totalSchemes=0, totalMembers=0, totalTxns=0;
    const skipped=[], conflicts=[];

    try {
        // Ensure ledger table exists
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
                    notes: JSON.stringify({
                        category:     'HIGH COST',
                        ledger:       s.ledger,
                        address:      s.address,
                        finalBalance: s.finalBalance,
                        source:       '2024 Excel'
                    }),
                },
                transaction: t,
            });

            if (!created) { skipped.push(`${s.shc} (${s.name}) – already existed`); }
            totalSchemes++;

            // Members
            const principalIdx = s.members.length === 0 ? -1 : 0;
            if (s.members.length === 0) {
                // principal-only record
                const ptNum = `${s.shc}-00`;
                const exists = await Patient.findOne({ where: { patientNumber: ptNum }, transaction: t });
                if (!exists) {
                    const parts = s.name.trim().toUpperCase().split(' ');
                    const lastName  = parts.pop() || 'UNKNOWN';
                    const firstName = parts.join(' ') || lastName;
                    await Patient.create({
                        patientNumber: ptNum, firstName, lastName,
                        dateOfBirth: '1900-01-01', gender: 'other',
                        paymentMethod: 'private_prepaid', costCategory: 'high_cost',
                        schemeId: scheme.id, policyNumber: s.shc,
                        memberRank: 'principal', memberSuffix: 1, memberStatus: 'active',
                        balance: s.finalBalance,
                    }, { transaction: t });
                    totalMembers++;
                }
            } else {
                for (let i = 0; i < s.members.length; i++) {
                    const m = s.members[i];
                    const ptNum = `${s.shc}-${String(i+1).padStart(2,'0')}`;
                    const exists = await Patient.findOne({ where: { patientNumber: ptNum }, transaction: t });
                    if (exists) { conflicts.push(`Patient ${ptNum} already exists`); continue; }
                    const parts = m.name.trim().toUpperCase().split(' ');
                    const lastName  = parts.pop() || 'UNKNOWN';
                    const firstName = parts.join(' ') || lastName;
                    await Patient.create({
                        patientNumber: ptNum, firstName, lastName,
                        dateOfBirth: parseDate(m.dob), gender: m.gender,
                        nrc: m.nrc || null,
                        paymentMethod: 'private_prepaid', costCategory: 'high_cost',
                        schemeId: scheme.id, policyNumber: s.shc,
                        memberRank: m.rank, memberSuffix: i+1, memberStatus: 'active',
                        balance: i===0 ? s.finalBalance : 0,
                    }, { transaction: t });
                    totalMembers++;
                }
            }

            // Transactions
            for (const tx of s.txns) {
                await sequelize.query(`
                    INSERT INTO individual_scheme_ledger (scheme_id, tx_date, description, dr, cr, balance)
                    VALUES (:sid, :dt, :desc, :dr, :cr, :bal)
                `, {
                    replacements: {
                        sid: scheme.id, dt: parseTxDate(tx.date),
                        desc: tx.desc, dr: tx.dr||0, cr: tx.cr||0, bal: tx.bal||0,
                    },
                    type: QueryTypes.INSERT, transaction: t,
                });
                totalTxns++;
            }
        }

        await t.commit();
        console.log('\n✅ 2024 Scheme Seeding complete!');
        console.log(`   Schemes processed  : ${totalSchemes}`);
        console.log(`   Members inserted   : ${totalMembers}`);
        console.log(`   Transactions stored: ${totalTxns}`);
        if (skipped.length)   { console.log('\n⚠️  Already existed (skipped creation):'); skipped.forEach(s=>console.log('  -',s)); }
        if (conflicts.length) { console.log('\n⚠️  Patient conflicts:'); conflicts.forEach(c=>console.log('  -',c)); }
        process.exit(0);
    } catch(err) {
        await t.rollback();
        console.error('\n❌ FAILED – rolled back.', err);
        process.exit(1);
    }
}

seed();
