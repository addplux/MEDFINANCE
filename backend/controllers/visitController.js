const { Visit, Patient, Scheme, Vitals, PatientMovement, Department, Admission, Bed, Ward, User, OPDBill, PharmacyBill, LabBill, Service, LabTest, LabRequest, LabResult, RadiologyBill, Medication, PharmacyBatch, sequelize } = require('../models');
const { Op } = require('sequelize');

// Create a new outpatient visit
const createVisit = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            patientId,
            visitType,
            schemeId,
            departmentId,
            assignedDepartment,
            assignedDoctorId,
            serviceId,
            priority,
            reasonForVisit,
            notes,
            admissionDate,
            initialVitals,
            registryFee
        } = req.body;

        const existingActiveVisit = await Visit.findOne({
            where: { patientId, status: 'active' },
            include: [{ model: Patient, as: 'patient' }, { model: Department, as: 'department' }],
            transaction: t
        });

        if (existingActiveVisit) {
            await t.commit();
            return res.status(200).json(existingActiveVisit);
        }

        const patient = await Patient.findByPk(patientId, { transaction: t });
        if (!patient) {
            await t.rollback();
            return res.status(404).json({ error: 'Patient not found' });
        }

        const isBypass = patient.referralType === 'bypass';
        const isReferral = patient.referralType === 'referral';

        let initialQueueStatus = isBypass ? 'pending_cashier' : 'waiting_doctor';
        if (isReferral) initialQueueStatus = 'pending_authorization';

        const newRegistryFee = isBypass ? Number(registryFee || 0) : 0;
        const newRegistryFeeStatus = (isBypass && newRegistryFee > 0) ? 'pending' : 'waived';

        const count = await Visit.count({ transaction: t });
        const visitNumber = `VIS${String(count + 1).padStart(6, '0')}`;

        const visit = await Visit.create({
            visitNumber,
            patientId,
            visitType,
            schemeId,
            departmentId,
            assignedDepartment,
            assignedDoctorId,
            priority,
            reasonForVisit,
            notes,
            admissionDate: admissionDate || new Date(),
            status: 'active',
            queueStatus: initialQueueStatus,
            registryFee: newRegistryFee,
            registryFeeStatus: newRegistryFeeStatus,
            admittedById: req.user.id
        }, { transaction: t });

        if (serviceId) {
            // Handle Pharmacy medications specifically if assigned to Pharmacy
            if (assignedDepartment === 'Pharmacy') {
                const medication = await Medication.findByPk(serviceId, { transaction: t });
                if (medication) {
                    // Find oldest batch with stock
                    const batch = await PharmacyBatch.findOne({
                        where: {
                            medicationId: medication.id,
                            quantityOnHand: { [Op.gt]: 0 },
                            expiryDate: { [Op.gt]: new Date() }
                        },
                        order: [['expiryDate', 'ASC']],
                        transaction: t
                    });

                    if (batch) {
                        const billCount = await PharmacyBill.count({ transaction: t });
                        const billNum = `PHARM${String(billCount + 1).padStart(6, '0')}`;

                        let billPaymentStatus = 'unpaid';
                        if (patient.paymentMethod !== 'cash' && patient.paymentMethod !== 'private prepaid') {
                            billPaymentStatus = 'claimed';
                        }

                        await PharmacyBill.create({
                            billNumber: billNum,
                            patientId,
                            visitId: visit.id,
                            medicationId: medication.id,
                            batchId: batch.id,
                            quantity: 1,
                            unitPrice: parseFloat(batch.sellingPrice || 0),
                            totalAmount: parseFloat(batch.sellingPrice || 0),
                            netAmount: parseFloat(batch.sellingPrice || 0),
                            status: 'pending',
                            paymentStatus: billPaymentStatus,
                            notes: `Initial Prescribed: ${medication.name}`,
                            createdBy: req.user.id
                        }, { transaction: t });
                    }
                }
            } else if (assignedDepartment === 'Laboratory') {
                const test = await LabTest.findByPk(serviceId, { transaction: t });
                if (test) {
                    const labReqCount = await LabRequest.count({ transaction: t });
                    const requestNumber = `LAB${String(labReqCount + 1).padStart(6, '0')}`;

                    let billPaymentStatus = 'unpaid';
                    if (patient.paymentMethod !== 'cash' && patient.paymentMethod !== 'private prepaid') {
                        billPaymentStatus = 'claimed';
                    }

                    const isExempted = (patient.ageGroup === 'under_5' || patient.ageGroup === 'above_65' || patient.paymentMethod === 'exempted' || patient.paymentMethod === 'foc');
                    const finalPrice = isExempted ? 0 : parseFloat(test.price || 0);

                    // 1. Create Lab Request
                    const request = await LabRequest.create({
                        requestNumber,
                        patientId,
                        requestedBy: req.user.id,
                        priority: 'routine',
                        status: 'requested',
                        totalAmount: finalPrice,
                        paymentStatus: (billPaymentStatus === 'claimed' || finalPrice === 0) ? 'paid' : 'unpaid'
                    }, { transaction: t });

                    // 2. Create Lab Result (placeholder)
                    await LabResult.create({
                        labRequestId: request.id,
                        testId: test.id,
                        resultValue: '',
                        isAbnormal: false
                    }, { transaction: t });

                    // 3. Create Lab Bill
                    const labBillCount = await LabBill.count({ transaction: t });
                    const billNumber = `LB${String(labBillCount + 1).padStart(6, '0')}`;

                    await LabBill.create({
                        billNumber,
                        patientId,
                        testName: test.name,
                        testCode: test.code,
                        amount: finalPrice,
                        netAmount: finalPrice,
                        status: 'pending',
                        paymentStatus: billPaymentStatus,
                        createdBy: req.user.id
                    }, { transaction: t });
                }
            } else if (assignedDepartment === 'Radiology') {
                const service = await Service.findByPk(serviceId, { transaction: t });
                if (service) {
                    const radBillCount = await RadiologyBill.count({ transaction: t });
                    const billNumber = `RAD${String(radBillCount + 1).padStart(6, '0')}`;

                    let billPaymentStatus = 'unpaid';
                    if (patient.paymentMethod !== 'cash' && patient.paymentMethod !== 'private prepaid') {
                        billPaymentStatus = 'claimed';
                    }

                    const isExempted = (patient.ageGroup === 'under_5' || patient.ageGroup === 'above_65' || patient.paymentMethod === 'exempted' || patient.paymentMethod === 'foc');
                    let finalPrice = isExempted ? 0 : parseFloat(service.cashPrice || service.price || 0);
                    if (patient.paymentMethod === 'corporate') finalPrice = isExempted ? 0 : parseFloat(service.corporatePrice || service.price || 0);
                    else if (patient.paymentMethod === 'scheme') finalPrice = isExempted ? 0 : parseFloat(service.schemePrice || service.price || 0);
                    else if (patient.paymentMethod === 'staff') finalPrice = isExempted ? 0 : parseFloat(service.staffPrice || service.price || 0);

                    await RadiologyBill.create({
                        billNumber,
                        patientId,
                        visitId: visit.id,
                        scanType: service.serviceName,
                        scanCode: service.serviceCode || service.code,
                        amount: finalPrice,
                        netAmount: finalPrice,
                        status: 'pending',
                        paymentStatus: billPaymentStatus,
                        billDate: new Date(),
                        createdBy: req.user.id
                    }, { transaction: t });
                }
            } else {
                const service = await Service.findByPk(serviceId, { transaction: t });
                if (service) {
                    let finalPrice = parseFloat(service.cashPrice || service.price || 0);
                    if (patient.paymentMethod === 'corporate') finalPrice = parseFloat(service.corporatePrice || service.price || 0);
                    else if (patient.paymentMethod === 'scheme') finalPrice = parseFloat(service.schemePrice || service.price || 0);
                    else if (patient.paymentMethod === 'staff') finalPrice = parseFloat(service.staffPrice || service.price || 0);

                    const countOpd = await OPDBill.count({ transaction: t });
                    const billNum = `OPD${String(countOpd + 1).padStart(6, '0')}`;

                    let billPaymentStatus = 'unpaid';
                    if (patient.paymentMethod !== 'cash' && patient.paymentMethod !== 'private prepaid') {
                        billPaymentStatus = 'claimed';
                    }

                    await OPDBill.create({
                        billNumber: billNum,
                        patientId,
                        visitId: visit.id,
                        serviceId: service.id,
                        quantity: 1,
                        unitPrice: finalPrice,
                        totalAmount: finalPrice,
                        netAmount: finalPrice,
                        billDate: new Date(),
                        status: billPaymentStatus === 'claimed' ? 'paid' : 'pending',
                        paymentStatus: billPaymentStatus,
                        notes: `Initial Visit Consultation: ${service.serviceName}`,
                        createdBy: req.user.id
                    }, { transaction: t });
                }
            }
        }

        if (initialVitals) {
            await Vitals.create({
                ...initialVitals,
                visitId: visit.id,
                patientId,
                recordedBy: req.user.id
            }, { transaction: t });
        }

        let deptName = assignedDepartment || 'Unknown Department';
        if (departmentId) {
            const dept = await Department.findByPk(departmentId, { transaction: t });
            if (dept) deptName = dept.departmentName;
        }

        await PatientMovement.create({
            patientId,
            fromDepartment: 'Admission',
            toDepartment: deptName,
            notes: 'Initial Triage/Consultation',
            movementDate: new Date(),
            admittedBy: req.user.id
        }, { transaction: t });

        await t.commit();

        const fullVisit = await Visit.findByPk(visit.id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: Department, as: 'department' }
            ]
        });

        res.status(201).json(fullVisit);
    } catch (error) {
        if (typeof t !== 'undefined' && !t.finished) {
            await t.rollback();
        }
        console.error('Create visit error:', error);
        res.status(500).json({ error: 'Failed to create visit' });
    }
};

const getAllVisits = async (req, res) => {
    try {
        const { status, queueStatus, departmentId, assignedDepartment, search, visitType } = req.query;
        const where = {};
        if (status) where.status = status;
        if (queueStatus) where.queueStatus = queueStatus;
        if (departmentId) where.departmentId = departmentId;
        if (assignedDepartment) where.assignedDepartment = assignedDepartment;
        if (visitType) where.visitType = visitType;

        const patientInclude = { model: Patient, as: 'patient' };
        if (search) {
            patientInclude.where = {
                [Op.or]: [
                    { firstName: { [Op.iLike]: `%${search}%` } },
                    { lastName: { [Op.iLike]: `%${search}%` } },
                    { patientNumber: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const { count, rows: visits } = await Visit.findAndCountAll({
            where,
            include: [
                patientInclude,
                { model: Scheme, as: 'scheme' },
                { model: Department, as: 'department' }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json({ visits, total: count });
    } catch (error) {
        console.error('Get visits error:', error);
        res.status(500).json({ error: 'Failed to get visits' });
    }
};

const getVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id, {
            include: [
                { model: Patient, as: 'patient' },
                { model: Department, as: 'department' },
                { model: User, as: 'assignedDoctor' },
                { model: Vitals, as: 'vitals' }
            ]
        });

        if (!visit) {
            return res.status(404).json({ error: 'Visit not found' });
        }

        const [opdBills, pharmacyBills, labBills, radioBills] = await Promise.all([
            OPDBill.findAll({ where: { visitId: visit.id } }),
            PharmacyBill.findAll({ where: { visitId: visit.id } }),
            LabBill.findAll({ where: { visitId: visit.id } }),
            RadiologyBill.findAll({ where: { visitId: visit.id } })
        ]);

        const totalToPay = [...opdBills, ...pharmacyBills, ...labBills, ...radioBills]
            .reduce((sum, b) => sum + parseFloat(b.netAmount || 0), 0);
        
        const totalPaid = [...opdBills, ...pharmacyBills, ...labBills, ...radioBills]
            .filter(b => b.paymentStatus === 'paid' || b.paymentStatus === 'claimed')
            .reduce((sum, b) => sum + parseFloat(b.netAmount || 0), 0);

        const visitData = visit.toJSON();
        visitData.admissions = await Admission.findAll({
            where: { patientId: visit.patientId },
            include: [{ model: Bed, as: 'bed', include: [{ model: Ward, as: 'ward' }] }],
            order: [['admissionDate', 'DESC']]
        });
        
        visitData.billingSummary = {
            totalAmount: totalToPay.toFixed(2),
            paidAmount: totalPaid.toFixed(2),
            balance: (totalToPay - totalPaid).toFixed(2),
            status: totalToPay > 0 && totalPaid >= totalToPay ? 'paid' : (totalToPay > 0 ? 'pending' : 'none')
        };

        visitData.assignedItems = opdBills.map(b => ({ id: b.id, name: b.notes, type: 'Service' }));

        res.json(visitData);
    } catch (error) {
        console.error('Get visit error:', error);
        res.status(500).json({ error: 'Failed to get visit' });
    }
};

const getDepartmentQueue = async (req, res) => {
    try {
        const { department } = req.query;
        const where = { 
            status: 'active',
            [Op.or]: [
                { assignedDepartment: department || 'Pharmacy' },
                { queueStatus: department === 'Theatre' ? 'waiting_theatre' : 'waiting_doctor' }
            ]
        };

        if (department === 'Pharmacy') {
            where[Op.or].push({ queueStatus: 'waiting_lab' });
            where[Op.or].push({ queueStatus: 'waiting_radiology' });
            where[Op.or].push({ queueStatus: 'pending_results' });
        }

        const visits = await Visit.findAll({
            where,
            include: [
                { model: Patient, as: 'patient' },
                { model: Department, as: 'department' }
            ],
            order: [['updatedAt', 'DESC']]
        });
        res.json(visits);
    } catch (error) {
        console.error('Department queue error:', error);
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
};

const updateVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });

        const { departmentId, assignedDepartment, queueStatus, priority, status, notes } = req.body;
        const oldDept = visit.departmentId;

        if (departmentId && departmentId !== oldDept) {
            let fromDeptName = 'Unknown';
            let toDeptName = 'Unknown';

            if (oldDept) {
                const oldD = await Department.findByPk(oldDept);
                if (oldD) fromDeptName = oldD.departmentName;
            }
            if (departmentId) {
                const newD = await Department.findByPk(departmentId);
                if (newD) toDeptName = newD.departmentName;
            }

            await PatientMovement.create({
                patientId: visit.patientId,
                fromDepartment: fromDeptName,
                toDepartment: toDeptName,
                notes: 'Department Transfer',
                movementDate: new Date(),
                admittedBy: req.user.id
            });
            visit.departmentId = departmentId;
        }

        if (queueStatus) visit.queueStatus = queueStatus;
        if (priority) visit.priority = priority;
        if (status) visit.status = status;
        if (assignedDepartment) visit.assignedDepartment = assignedDepartment;
        if (notes) visit.notes = notes;

        await visit.save();

        if (['pending_results', 'waiting_lab', 'waiting_radiology', 'waiting_doctor'].includes(visit.queueStatus)) {
            try {
                const bills = await OPDBill.findAll({
                    where: { visitId: visit.id },
                    include: [{ model: Service, as: 'service' }]
                });

                const labBills = bills.filter(b => b.service?.category === 'laboratory');
                const radBills = bills.filter(b => b.service?.category === 'radiology');

                if (labBills.length > 0) {
                    const codes = labBills.map(b => b.service.serviceCode);
                    const tests = await LabTest.findAll({ where: { code: codes } });

                    if (tests.length > 0) {
                        const existing = await LabRequest.findOne({ where: { patientId: visit.patientId, status: 'requested' } });
                        if (!existing) {
                            const count = await LabRequest.count();
                            const requestNumber = `LAB${String(count + 1).padStart(6, '0')}`;
                            const request = await LabRequest.create({
                                requestNumber,
                                patientId: visit.patientId,
                                requestedBy: req.user.id,
                                status: 'requested',
                                totalAmount: tests.reduce((sum, t) => sum + parseFloat(t.price || 0), 0),
                                paymentStatus: bills[0].paymentStatus
                            });

                            await Promise.all(tests.map(t => LabResult.create({
                                labRequestId: request.id,
                                testId: t.id,
                                resultValue: ''
                            })));
                        }
                    }
                }

                if (radBills.length > 0) {
                    await Promise.all(radBills.map(async b => {
                        const existing = await RadiologyBill.findOne({ where: { patientId: visit.patientId, scanCode: b.service.serviceCode } });
                        if (!existing) {
                            const count = await RadiologyBill.count();
                            const billNumber = `RB${String(count + 1).padStart(6, '0')}`;
                            await RadiologyBill.create({
                                billNumber,
                                patientId: visit.patientId,
                                scanType: b.service.serviceName,
                                scanCode: b.service.serviceCode,
                                amount: b.totalAmount,
                                netAmount: b.totalAmount,
                                createdBy: req.user.id
                            });
                        }
                    }));
                }
            } catch (autoErr) {
                console.error('Failed to auto-generate requests:', autoErr);
            }
        }

        res.json(visit);
    } catch (error) {
        console.error('Update visit error:', error);
        res.status(500).json({ error: 'Failed to update visit' });
    }
};

const dischargeVisit = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });
        visit.status = 'discharged';
        visit.dischargeDate = new Date();
        await visit.save();
        res.json({ message: 'Visit closed successfully' });
    } catch (error) {
        console.error('Discharge visit error:', error);
        res.status(500).json({ error: 'Failed to close visit' });
    }
};

const getVisitMovements = async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });
        const endBound = visit.dischargeDate || new Date();
        const movements = await PatientMovement.findAll({
            where: {
                patientId: visit.patientId,
                movementDate: { [Op.gte]: visit.admissionDate, [Op.lte]: endBound }
            },
            include: [{ model: User, as: 'admitter', attributes: ['firstName', 'lastName'] }],
            order: [['movementDate', 'DESC']]
        });
        res.json(movements);
    } catch (error) {
        console.error('Get movements error:', error);
        res.status(500).json({ error: 'Failed to get movements' });
    }
};

const updateQueueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { queueStatus } = req.body;
        const visit = await Visit.findByPk(id);
        if (!visit) return res.status(404).json({ error: 'Visit not found' });
        visit.queueStatus = queueStatus;
        await visit.save();
        res.json(visit);
    } catch (error) {
        console.error('Update queue status error:', error);
        res.status(500).json({ error: 'Failed to update queue status' });
    }
};

const createConsultationVisit = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { patientId, departmentId, assignedDepartment, reasonForVisit, serviceId } = req.body;
        if (!patientId) {
            await t.rollback();
            return res.status(400).json({ error: 'patientId is required' });
        }
        const existingActiveVisit = await Visit.findOne({
            where: { patientId, status: 'active' },
            transaction: t
        });
        if (existingActiveVisit) {
            await t.rollback();
            const fullVisit = await Visit.findByPk(existingActiveVisit.id, {
                include: [{ model: Patient, as: 'patient' }, { model: Department, as: 'department' }]
            });
            return res.status(200).json({ visit: fullVisit, queueStatus: existingActiveVisit.queueStatus });
        }
        const patient = await Patient.findByPk(patientId, { transaction: t });
        const prepayMethods = ['private prepaid', 'private_prepaid', 'corporate', 'scheme', 'staff'];
        const isPrepaid = prepayMethods.includes(patient.paymentMethod);
        let initialQueueStatus = isPrepaid ? 'waiting_doctor' : 'pending_cashier';
        const count = await Visit.count({ transaction: t });
        const visitNumber = `VIS${String(count + 1).padStart(6, '0')}`;
        const visit = await Visit.create({
            visitNumber, patientId, visitType: 'opd', departmentId, assignedDepartment, reasonForVisit,
            admissionDate: new Date(), status: 'active', queueStatus: initialQueueStatus, admittedById: req.user.id
        }, { transaction: t });
        await t.commit();
        res.status(201).json({ visit, queueStatus: initialQueueStatus });
    } catch (error) {
        await t.rollback();
        console.error('Create consultation visit error:', error);
        res.status(500).json({ error: 'Failed to create consultation visit' });
    }
};

module.exports = {
    createVisit,
    createConsultationVisit,
    getAllVisits,
    getVisit,
    updateVisit,
    dischargeVisit,
    getVisitMovements,
    updateQueueStatus,
    getDepartmentQueue
};
