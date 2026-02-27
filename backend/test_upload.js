const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');
const patientController = require('./controllers/patientController');

async function testUpload() {
    console.log('Generating excel file...');
    const ws_name = "Sheet1";
    const ws_data = [
        ["HIGH COST LEDGERS FOR SCHEME MEMBERS"],
        [""],
        ["SCH. NO. 20180707"],
        ["JOHN DOE"],
        ["BALANCE", "", "5000.00"],
        [""],
        ["SCH. NO. 20190815"],
        ["JANE SMITH"],
        ["BALANCE", "", "-100.00"]
    ];
    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, ws_name);
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    console.log('Connecting to DB...');
    await sequelize.authenticate();

    console.log('Calling uploadPrepaidLedger...');
    const req = {
        file: { buffer: buf, originalname: 'test.xlsx' },
        body: { schemeId: '' }
    };
    const res = {
        status: function (s) {
            this.statusCode = s;
            return this;
        },
        json: function (j) {
            console.log('Response Status:', this.statusCode);
            console.log('Response Body:', j);
        }
    };

    try {
        await patientController.uploadPrepaidLedger(req, res);
    } catch (e) {
        console.error('Uncaught Error:', e);
    }

    await sequelize.close();
}

testUpload();
