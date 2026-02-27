const rows = [
    ["SCH. NO. 20180707", "ACTIVE", "JOHN DOE", "MALE", "3870"],
    ["Medical bill #298", "99,999,999.99"],
    ["physio", "240"],
    ["30/4/2019", "3820"],
    ["LABS TEST NKANZA", "1000"],
    ["ACCOUNT CLOSED CLIENT IS WITH NHIMA", "2001"],
    ["TOP UP RCT # 6067434", "9999"],
    ["NUMBER OF MEMBERS", "789"],
    ["3. SUSEN CHUNGU", "500"], // VALID NAME with number
    ["1. MUSONDA MWAPE FEBBY", "2315"], // VALID NAME with number
    ["6.MARGARET PHIRI", "1678"], // VALID NAME with number
    ["CEA", "3940"],
    ["PASTOR DENSON MUSHITALA", "20010120"], // VALID NAME
    ["Unknown", "956"],
    ["STATUS", "1665"],
    ["not collected", "2018"],
    ["CELL 0966011512", "3870"],
    ["4344 CHIKOLA LOOP AREA", "1993"],
    ["154 DAGAMASKJOID RIVERSIDE", "2440"],
    ["PRUDENCE KALUNGA", "2634.87"], // VALID NAME
    ["CELL NO.0964183760", "4150"],
    ["scan", "4080"],
    ["10.10.9", "4935"]
];

const garbageKeywords = [
    'BAL B/F', 'BALANCE', 'MEMBERSHIP', 'CONSULTATION', 'PHARMACY', 'LABORATORY', 'X-RAY',
    'CASH', 'PAYMENT', 'RECEIPT', 'DRUGS', 'B/F', 'BROUGHT FORWARD', 'CLIENTS', 'DETAILS',
    'LEDGER', 'DATE', 'MEDICAL', 'BILL', 'CONS', 'DRGUG', 'ADDRESS', 'ADD:', 'PHYSIO',
    'LABS', 'TEST', 'REVIEW', 'RTD', 'NKANZA', 'ACCOUNT', 'CLOSED', 'NHIMA', 'TOP UP', 'TOP',
    'UP', 'RCT', 'BAL', 'REMARKS', 'NUMBER', 'MEMBERS', 'MEMBER', 'UNKNOWN', 'STATUS', 'CEA',
    'COLLECTED', 'NOT COLLECTED', 'CELL', 'SCAN', 'AREA', 'RIVERSIDE', 'DAGAMASKJOID', 'CHIKOLA'
];
const statusKeywords = ['ACTIVE', 'SUSPENDED', 'CLOSED', 'DECEASED', 'INACTIVE'];
const genderKeywords = ['MALE', 'FEMALE'];

for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.map(c => String(c || '').trim()).filter(c => c);

    let pendingName = null;

    const candidateTextCells = cells.filter(c => {
        const cleanC = c.replace(/,/g, '');
        const isNum = !isNaN(Number(cleanC));
        const isDate = /^\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}$/.test(c);
        return !isNum && !isDate;
    });

    if (candidateTextCells.length > 0) {
        for (const candidate of candidateTextCells) {
            const candidateUpper = candidate.toUpperCase();

            // Check against garbage keywords
            const words = candidateUpper.split(/[\s_-]+/);
            const isGarbage = words.some(w => garbageKeywords.includes(w)) || garbageKeywords.some(kw => candidateUpper.includes(kw));

            const isSchemeNo = candidateUpper.includes('SCH');
            const isStatus = statusKeywords.includes(candidateUpper);
            const isGender = genderKeywords.includes(candidateUpper);

            // Exclude if it has 5 or more sequential digits (like phone numbers, account numbers, IP addresses)
            // But allow leading numbering like "1. MUSONDA" or "10. NAME"
            // Let's strip out leading numbers (e.g. "1. ", "10.", "3 ") before checking digit density
            const textWithoutListNumbers = candidateUpper.replace(/^\d+[\.\s]+/, '');
            const hasTooManyDigits = /\d{5,}/.test(textWithoutListNumbers) || /^\d+\.\d+\.\d+/.test(textWithoutListNumbers);

            // Exclude single word abbreviations that are 3 chars or less unless it is a known name prefix, or just exclude anything 3 chars and under if it doesn't look like a real name.
            // But wait, candidate.length > 2 handles that generally, unless it is "CEA". We already put CEA in garbage.

            if (!isGarbage && !isSchemeNo && !isStatus && !isGender && !candidateUpper.includes('HIGH COST') && !candidateUpper.includes('LOW COST') && candidateUpper.length > 2) {
                if (!/#\d+/.test(candidateUpper) && !/BILL/.test(candidateUpper) && !hasTooManyDigits) {
                    pendingName = candidate;
                    break;
                }
            }
        }
    }

    console.log(`Row ${i} (${row[0]}): Extracted -> ${pendingName}`);
}
