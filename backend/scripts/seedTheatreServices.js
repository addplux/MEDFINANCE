require('dotenv').config();
const { sequelize } = require('../config/database');
const Service = require('../models/Service');

const theatreServices = [
    { name: 'Caesarean section (C-section)', price: 8000 },
    { name: 'Hernia repair (inguinal, umbilical, etc.)', price: 4500 },
    { name: 'Emergency laparotomy', price: 9000 },
    { name: 'Fracture fixation / manipulation (closed or open reduction)', price: 6000 },
    { name: 'Dilatation and curettage (D&C)', price: 2500 },
    { name: 'Incision and drainage of abscess', price: 1500 },
    { name: 'Appendicectomy', price: 5000 },
    { name: 'Hydrocele repair', price: 3500 },
    { name: 'Tonsillectomy / Adenoidectomy', price: 4000 },
    { name: 'Wound debridement / skin grafting', price: 3000 }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        for (let i = 0; i < theatreServices.length; i++) {
            const svc = theatreServices[i];
            const code = `THT-${String(i + 1).padStart(3, '0')}`;

            const existing = await Service.findOne({ where: { serviceName: svc.name } });
            if (!existing) {
                await Service.create({
                    serviceCode: code,
                    serviceName: svc.name,
                    category: 'other',
                    department: 'Theatre',
                    tariffType: 'Low Cost',
                    price: svc.price,
                    cashPrice: svc.price,
                    corporatePrice: svc.price * 1.2,
                    schemePrice: svc.price * 1.1,
                    staffPrice: svc.price * 0.5,
                    description: 'Surgical procedure',
                    isActive: true
                });
                console.log(`Created: ${svc.name}`);
            } else {
                console.log(`Already exists: ${svc.name}`);
            }
        }
        console.log('Done seeding theatre services');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
