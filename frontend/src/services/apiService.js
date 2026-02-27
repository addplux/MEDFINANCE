import api from './apiClient';

// Authentication
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    getPublicOrgInfo: () => api.get('/auth/info'),
    // Admin approval
    getPendingUsers: () => api.get('/auth/pending-users'),
    approveUser: (id, data) => api.put(`/auth/approve/${id}`, data),
    rejectUser: (id, data) => api.put(`/auth/reject/${id}`, data),
};

// Notifications
export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    getCount: () => api.get('/notifications/count'),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
};


// Patients
export const patientAPI = {
    getAll: (params) => api.get('/patients', { params }),
    getById: (id) => api.get(`/patients/${id}`),
    create: (data) => api.post('/patients', data),
    update: (id, data) => api.put(`/patients/${id}`, data),
    delete: (id) => api.delete(`/patients/${id}`),
    merge: (data) => api.post('/patients/merge', data),
    getVisitHistory: (id) => api.get(`/patients/${id}/visit-history`),
    topup: (id, amount) => api.post(`/patients/${id}/topup`, { amount }),
    uploadPrepaidLedger: (formData) => api.post('/patients/upload-prepaid-ledger', formData),
};

// Prepaid Plans
export const prepaidPlanAPI = {
    getAll: () => api.get('/prepaid-plans'),
    getById: (id) => api.get(`/prepaid-plans/${id}`),
    create: (data) => api.post('/prepaid-plans', data),
    update: (id, data) => api.put(`/prepaid-plans/${id}`, data),
    delete: (id) => api.delete(`/prepaid-plans/${id}`),
};

// Visits
export const visitAPI = {
    getAll: (params) => api.get('/visits', { params }),
    getById: (id) => api.get(`/visits/${id}`),
    create: (data) => api.post('/visits', data),
    update: (id, data) => api.put(`/visits/${id}`, data),
    discharge: (id) => api.post(`/visits/${id}/discharge`),
    getMovements: (id) => api.get(`/visits/${id}/movements`),
    logMovement: (patientId, data) => api.post('/patient-movements', { patientId, ...data }),
};

// Billing
export const billingAPI = {
    opd: {
        getAll: (params) => api.get('/billing/opd', { params }),
        getById: (id) => api.get(`/billing/opd/${id}`),
        create: (data) => api.post('/billing/opd', data),
        update: (id, data) => api.put(`/billing/opd/${id}`, data),
        delete: (id) => api.delete(`/billing/opd/${id}`),
    },
    ipd: {
        getAll: (params) => api.get('/billing/ipd', { params }),
        getById: (id) => api.get(`/billing/ipd/${id}`),
        create: (data) => api.post('/billing/ipd', data),
        update: (id, data) => api.put(`/billing/ipd/${id}`, data),
        delete: (id) => api.delete(`/billing/ipd/${id}`),
    },
    pharmacy: {
        getAll: (params) => api.get('/billing/pharmacy', { params }),
        getById: (id) => api.get(`/billing/pharmacy/${id}`),
        create: (data) => api.post('/billing/pharmacy', data),
        update: (id, data) => api.put(`/billing/pharmacy/${id}`, data),
        delete: (id) => api.delete(`/billing/pharmacy/${id}`),
    },
    patient: {
        getBalance: (id) => api.get(`/billing/patient/${id}/balance`),
        getStatement: (id) => api.get(`/billing/patient/${id}/statement`),
        getUnpaidBills: (id) => api.get(`/billing/patient/${id}/unpaid`),
        getPendingQueue: () => api.get('/billing/pending-queue')
    }
};

// Receivables
export const receivablesAPI = {
    corporate: {
        getAll: (params) => api.get('/receivables/corporate', { params }),
        getById: (id) => api.get(`/receivables/corporate/${id}`),
        create: (data) => api.post('/receivables/corporate', data),
        update: (id, data) => api.put(`/receivables/corporate/${id}`, data),
        delete: (id) => api.delete(`/receivables/corporate/${id}`),
    },
    schemes: {
        getAll: (params) => api.get('/receivables/schemes', { params }),
        getById: (id) => api.get(`/receivables/schemes/${id}`),
        create: (data) => api.post('/receivables/schemes', data),
        update: (id, data) => api.put(`/receivables/schemes/${id}`, data),
        delete: (id) => api.delete(`/receivables/schemes/${id}`),
        // Invoicing
        generateInvoice: (data) => api.post('/receivables/schemes/invoices/generate', data),
        getInvoices: (schemeId) => api.get(`/receivables/schemes/${schemeId}/invoices`),
        getInvoiceDetails: (invoiceId) => api.get(`/receivables/schemes/invoices/${invoiceId}`),
        sendInvoice: (invoiceId, data) => api.post(`/receivables/schemes/invoices/${invoiceId}/send`, data),
        getMembers: (schemeId) => api.get(`/receivables/schemes/${schemeId}/members`),
        importMembers: (schemeId, formData) => api.post(`/receivables/schemes/${schemeId}/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
        updateMemberStatus: (schemeId, patientId, status) => api.put(`/receivables/schemes/${schemeId}/members/${patientId}/status`, { status }),
    },
};

// Payables
export const payablesAPI = {
    suppliers: {
        getAll: (params) => api.get('/payables/suppliers', { params }),
        getById: (id) => api.get(`/payables/suppliers/${id}`),
        create: (data) => api.post('/payables/suppliers', data),
        update: (id, data) => api.put(`/payables/suppliers/${id}`, data),
        delete: (id) => api.delete(`/payables/suppliers/${id}`),
    },
    invoices: {
        getAll: (params) => api.get('/payables/invoices', { params }),
        getById: (id) => api.get(`/payables/invoices/${id}`),
        create: (data) => api.post('/payables/invoices', data),
        update: (id, data) => api.put(`/payables/invoices/${id}`, data),
        delete: (id) => api.delete(`/payables/invoices/${id}`),
    },
    vouchers: {
        getAll: (params) => api.get('/payables/vouchers', { params }),
        getById: (id) => api.get(`/payables/vouchers/${id}`),
        create: (data) => api.post('/payables/vouchers', data),
        update: (id, data) => api.put(`/payables/vouchers/${id}`, data),
        delete: (id) => api.delete(`/payables/vouchers/${id}`),
    },
};

// Ledger
export const ledgerAPI = {
    accounts: {
        getAll: (params) => api.get('/ledger/accounts', { params }),
        getById: (id) => api.get(`/ledger/accounts/${id}`),
        create: (data) => api.post('/ledger/accounts', data),
        update: (id, data) => api.put(`/ledger/accounts/${id}`, data),
        delete: (id) => api.delete(`/ledger/accounts/${id}`),
    },
    journals: {
        getAll: (params) => api.get('/ledger/journals', { params }),
        getById: (id) => api.get(`/ledger/journals/${id}`),
        create: (data) => api.post('/ledger/journals', data),
        update: (id, data) => api.put(`/ledger/journals/${id}`, data),
        delete: (id) => api.delete(`/ledger/journals/${id}`),
    },
    trialBalance: (params) => api.get('/ledger/trial-balance', { params }),
    financialStatements: (params) => api.get('/ledger/financial-statements', { params }),
};

export const cashAPI = {
    payments: {
        getAll: (params) => api.get('/cash/payments', { params }),
        getById: (id) => api.get(`/cash/payments/${id}`),
        getReceipt: (id) => api.get(`/cash/payments/${id}/receipt`),
        create: (data) => api.post('/cash/payments', data),
        update: (id, data) => api.put(`/cash/payments/${id}`, data),
        delete: (id) => api.delete(`/cash/payments/${id}`),
    },
    bankAccounts: {
        getAll: (params) => api.get('/cash/bank-accounts', { params }),
        getById: (id) => api.get(`/cash/bank-accounts/${id}`),
        create: (data) => api.post('/cash/bank-accounts', data),
        update: (id, data) => api.put(`/cash/bank-accounts/${id}`, data),
        delete: (id) => api.delete(`/cash/bank-accounts/${id}`),
    },
    reconciliation: {
        getAll: (params) => api.get('/cash/reconciliation', { params }),
        create: (data) => api.post('/cash/reconciliation', data),
    },
};

// Budgets
export const budgetAPI = {
    getAll: (params) => api.get('/budgets', { params }),
    getById: (id) => api.get(`/budgets/${id}`),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    delete: (id) => api.delete(`/budgets/${id}`),
    variance: (id) => api.get(`/budgets/${id}/variance`),
};

// Funds
export const fundAPI = {
    getAll: (params) => api.get('/funds', { params }),
    getById: (id) => api.get(`/funds/${id}`),
    create: (data) => api.post('/funds', data),
    update: (id, data) => api.put(`/funds/${id}`, data),
    delete: (id) => api.delete(`/funds/${id}`),
    transactions: {
        getAll: (id, params) => api.get(`/funds/${id}/transactions`, { params }),
        create: (id, data) => api.post(`/funds/${id}/transactions`, data)
    }
};


// Reports
export const reportsAPI = {
    revenue: (params) => api.get('/reports/revenue', { params }),
    cashflow: (params) => api.get('/reports/cashflow', { params }),
    profitability: (params) => api.get('/reports/profitability', { params }),
    billingSummary: (params) => api.get('/reports/billing-summary', { params }),
    debtorAgeing: (params) => api.get('/reports/debtor-ageing', { params }),
};

// Setup
export const setupAPI = {
    services: {
        getAll: (params) => api.get('/setup/services', { params }),
        getById: (id) => api.get(`/setup/services/${id}`),
        create: (data) => api.post('/setup/services', data),
        update: (id, data) => api.put(`/setup/services/${id}`, data),
        delete: (id) => api.delete(`/setup/services/${id}`),
    },
    users: {
        getAll: (params) => api.get('/setup/users', { params }),
        getById: (id) => api.get(`/setup/users/${id}`),
        create: (data) => api.post('/setup/users', data),
        update: (id, data) => api.put(`/setup/users/${id}`, data),
        delete: (id) => api.delete(`/setup/users/${id}`),
    },
    departments: {
        getAll: (params) => api.get('/setup/departments', { params }),
        getById: (id) => api.get(`/setup/departments/${id}`),
        create: (data) => api.post('/setup/departments', data),
        update: (id, data) => api.put(`/setup/departments/${id}`, data),
        delete: (id) => api.delete(`/setup/departments/${id}`),
    },
    organization: {
        get: () => api.get('/setup/organization'),
        update: (data) => api.put('/setup/organization', data),
    },
};

// System Logs
export const systemLogsAPI = {
    getAll: () => api.get('/system-logs'),
    wipe: () => api.delete('/system-logs/wipe'),
    resolve: (id) => api.patch(`/system-logs/${id}/resolve`)
};

// Payroll Medical
export const payrollAPI = {
    getDeductions: (params) => api.get('/payroll/deductions', { params }),
    getStaffBalances: () => api.get('/payroll/balances'),
    createDeduction: (data) => api.post('/payroll/deductions', data),
    updateStatus: (id, status) => api.put(`/payroll/deductions/${id}`, { status }),
};

// Pharmacy
export const pharmacyAPI = {
    inventory: {
        getAll: (params) => api.get('/pharmacy', { params }),
        create: (data) => api.post('/pharmacy', data),
        update: (id, data) => api.put(`/pharmacy/${id}`, data)
    },
    grn: {
        receive: (data) => api.post('/pharmacy/grn', data)
    },
    batches: {
        getByMedication: (medicationId) => api.get(`/pharmacy/batch/${medicationId}`)
    },
    dispense: (data) => api.post('/pharmacy/dispense', data)
};

// Lab
export const labAPI = {
    tests: {
        getAll: (params) => api.get('/lab/tests', { params }),
        create: (data) => api.post('/lab/tests', data),
        update: (id, data) => api.put(`/lab/tests/${id}`, data)
    },
    requests: {
        getAll: (params) => api.get('/lab/requests', { params }),
        create: (data) => api.post('/lab/requests', data),
        updateStatus: (id, status) => api.patch(`/lab/requests/${id}/status`, { status })
    },
    results: {
        enter: (data) => api.post('/lab/results', data)
    }
};

// Radiology
export const radiologyAPI = {
    requests: {
        getAll: (params) => api.get('/radiology/requests', { params }),
        create: (data) => api.post('/radiology/requests', data),
    },
};

// Theatre Billing
export const theatreAPI = {
    bills: {
        create: (data) => api.post('/theatre/bills', data),
        getAll: (params) => api.get('/theatre/bills', { params }),
        getById: (id) => api.get(`/theatre/bills/${id}`),
        update: (id, data) => api.put(`/theatre/bills/${id}`, data),
        delete: (id) => api.delete(`/theatre/bills/${id}`),
        completeOperation: (id) => api.put(`/theatre/bills/${id}/complete`)
    },
    revenue: () => api.get('/theatre/revenue')
};

// Maternity Billing
export const maternityAPI = {
    bills: {
        create: (data) => api.post('/maternity/bills', data),
        getAll: (params) => api.get('/maternity/bills', { params }),
        getById: (id) => api.get(`/maternity/bills/${id}`),
        update: (id, data) => api.put(`/maternity/bills/${id}`, data),
        delete: (id) => api.delete(`/maternity/bills/${id}`)
    },
    revenue: () => api.get('/maternity/revenue'),
    statistics: () => api.get('/maternity/statistics')
};

// Specialist Clinic Billing
export const specialistClinicAPI = {
    bills: {
        create: (data) => api.post('/specialist-clinics/bills', data),
        getAll: (params) => api.get('/specialist-clinics/bills', { params }),
        getById: (id) => api.get(`/specialist-clinics/bills/${id}`),
        update: (id, data) => api.put(`/specialist-clinics/bills/${id}`, data),
        delete: (id) => api.delete(`/specialist-clinics/bills/${id}`)
    },
    revenue: () => api.get('/specialist-clinics/revenue'),
    statistics: () => api.get('/specialist-clinics/statistics')
};

// Dashboard
export const dashboardAPI = {
    getOverview: () => api.get('/dashboard/overview'),
    getRecentActivities: () => api.get('/dashboard/recent-activities'),
    getRevenueChart: () => api.get('/dashboard/revenue-chart'),
};

// Utilisation
export const utilisationAPI = {
    getReport: () => api.get('/utilisation/report'),
};
