import api from './apiClient';

// Authentication
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    getPublicOrgInfo: () => api.get('/auth/info'),
};

// Patients
export const patientAPI = {
    getAll: (params) => api.get('/patients', { params }),
    getById: (id) => api.get(`/patients/${id}`),
    create: (data) => api.post('/patients', data),
    update: (id, data) => api.put(`/patients/${id}`, data),
    delete: (id) => api.delete(`/patients/${id}`),
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
};

// Receivables
export const receivablesAPI = {
    nhima: {
        getAll: (params) => api.get('/receivables/nhima', { params }),
        getById: (id) => api.get(`/receivables/nhima/${id}`),
        create: (data) => api.post('/receivables/nhima', data),
        update: (id, data) => api.put(`/receivables/nhima/${id}`, data),
        delete: (id) => api.delete(`/receivables/nhima/${id}`),
    },
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

// Cash & Bank
export const cashAPI = {
    payments: {
        getAll: (params) => api.get('/cash/payments', { params }),
        getById: (id) => api.get(`/cash/payments/${id}`),
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

// Assets
export const assetAPI = {
    getAll: (params) => api.get('/assets', { params }),
    getById: (id) => api.get(`/assets/${id}`),
    create: (data) => api.post('/assets', data),
    update: (id, data) => api.put(`/assets/${id}`, data),
    delete: (id) => api.delete(`/assets/${id}`),
    depreciation: (id) => api.get(`/assets/${id}/depreciation`),
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

// Payroll Medical
export const payrollAPI = {
    getDeductions: (params) => api.get('/payroll/deductions', { params }),
    getStaffBalances: () => api.get('/payroll/balances'),
    createDeduction: (data) => api.post('/payroll/deductions', data),
    updateStatus: (id, status) => api.put(`/payroll/deductions/${id}`, { status }),
};

// Dashboard
export const dashboardAPI = {
    getOverview: () => api.get('/dashboard/overview'),
    getRecentActivities: () => api.get('/dashboard/recent-activities'),
    getRevenueChart: () => api.get('/dashboard/revenue-chart'),
};
