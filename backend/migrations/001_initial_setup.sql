-- MEDFINANCE360 Database Migration Script
-- Run this in Supabase SQL Editor to create all tables and seed initial data

-- ============================================
-- PART 1: CREATE TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS "Departments" (
    id SERIAL PRIMARY KEY,
    "departmentCode" VARCHAR(50) UNIQUE NOT NULL,
    "departmentName" VARCHAR(255) NOT NULL,
    "managerId" INTEGER REFERENCES "Users"(id),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS "Services" (
    id SERIAL PRIMARY KEY,
    "serviceCode" VARCHAR(50) UNIQUE NOT NULL,
    "serviceName" VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE IF NOT EXISTS "Patients" (
    id SERIAL PRIMARY KEY,
    "patientNumber" VARCHAR(50) UNIQUE NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "dateOfBirth" DATE,
    gender VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    "nhimaNumber" VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OPD Bills Table
CREATE TABLE IF NOT EXISTS "OPDBills" (
    id SERIAL PRIMARY KEY,
    "billNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    "serviceId" INTEGER REFERENCES "Services"(id),
    quantity INTEGER DEFAULT 1,
    "unitPrice" DECIMAL(10, 2) NOT NULL,
    "grossAmount" DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    "netAmount" DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "billDate" DATE NOT NULL,
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IPD Bills Table
CREATE TABLE IF NOT EXISTS "IPDBills" (
    id SERIAL PRIMARY KEY,
    "billNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    "admissionDate" DATE NOT NULL,
    "dischargeDate" DATE,
    "roomCharges" DECIMAL(10, 2) DEFAULT 0,
    "consultationFees" DECIMAL(10, 2) DEFAULT 0,
    "medicationCosts" DECIMAL(10, 2) DEFAULT 0,
    "procedureCosts" DECIMAL(10, 2) DEFAULT 0,
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacy Bills Table
CREATE TABLE IF NOT EXISTS "PharmacyBills" (
    id SERIAL PRIMARY KEY,
    "billNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "billDate" DATE NOT NULL,
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab Bills Table
CREATE TABLE IF NOT EXISTS "LabBills" (
    id SERIAL PRIMARY KEY,
    "billNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "billDate" DATE NOT NULL,
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Radiology Bills Table
CREATE TABLE IF NOT EXISTS "RadiologyBills" (
    id SERIAL PRIMARY KEY,
    "billNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "billDate" DATE NOT NULL,
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NHIMA Claims Table
CREATE TABLE IF NOT EXISTS "NHIMAClaims" (
    id SERIAL PRIMARY KEY,
    "claimNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    "nhimaNumber" VARCHAR(100) NOT NULL,
    "claimAmount" DECIMAL(10, 2) NOT NULL,
    "approvedAmount" DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    "submissionDate" DATE NOT NULL,
    "approvalDate" DATE,
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Corporate Accounts Table
CREATE TABLE IF NOT EXISTS "CorporateAccounts" (
    id SERIAL PRIMARY KEY,
    "accountNumber" VARCHAR(50) UNIQUE NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    "creditLimit" DECIMAL(10, 2) DEFAULT 0,
    "currentBalance" DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Schemes Table
CREATE TABLE IF NOT EXISTS "Schemes" (
    id SERIAL PRIMARY KEY,
    "schemeCode" VARCHAR(50) UNIQUE NOT NULL,
    "schemeName" VARCHAR(255) NOT NULL,
    description TEXT,
    "discountPercentage" DECIMAL(5, 2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS "Suppliers" (
    id SERIAL PRIMARY KEY,
    "supplierCode" VARCHAR(50) UNIQUE NOT NULL,
    "supplierName" VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS "Invoices" (
    id SERIAL PRIMARY KEY,
    "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
    "supplierId" INTEGER REFERENCES "Suppliers"(id),
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    "grossAmount" DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    "netAmount" DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Vouchers Table
CREATE TABLE IF NOT EXISTS "PaymentVouchers" (
    id SERIAL PRIMARY KEY,
    "voucherNumber" VARCHAR(50) UNIQUE NOT NULL,
    "invoiceId" INTEGER REFERENCES "Invoices"(id),
    amount DECIMAL(10, 2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "paymentDate" DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "approvedBy" INTEGER REFERENCES "Users"(id),
    notes TEXT,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chart of Accounts Table
CREATE TABLE IF NOT EXISTS "ChartOfAccounts" (
    id SERIAL PRIMARY KEY,
    "accountCode" VARCHAR(50) UNIQUE NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    "accountType" VARCHAR(50) NOT NULL,
    "parentId" INTEGER REFERENCES "ChartOfAccounts"(id),
    balance DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS "JournalEntries" (
    id SERIAL PRIMARY KEY,
    "entryNumber" VARCHAR(50) UNIQUE NOT NULL,
    "entryDate" DATE NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    "postedBy" INTEGER REFERENCES "Users"(id),
    "postedAt" TIMESTAMP WITH TIME ZONE,
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal Lines Table
CREATE TABLE IF NOT EXISTS "JournalLines" (
    id SERIAL PRIMARY KEY,
    "journalEntryId" INTEGER REFERENCES "JournalEntries"(id) ON DELETE CASCADE,
    "accountId" INTEGER REFERENCES "ChartOfAccounts"(id),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS "Payments" (
    id SERIAL PRIMARY KEY,
    "receiptNumber" VARCHAR(50) UNIQUE NOT NULL,
    "patientId" INTEGER REFERENCES "Patients"(id),
    amount DECIMAL(10, 2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "billType" VARCHAR(50),
    "billId" INTEGER,
    "receivedBy" INTEGER REFERENCES "Users"(id),
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS "BankAccounts" (
    id SERIAL PRIMARY KEY,
    "accountNumber" VARCHAR(100) UNIQUE NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    "bankName" VARCHAR(255) NOT NULL,
    "accountType" VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Petty Cash Table
CREATE TABLE IF NOT EXISTS "PettyCash" (
    id SERIAL PRIMARY KEY,
    "voucherNumber" VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    purpose TEXT NOT NULL,
    "requestedBy" INTEGER REFERENCES "Users"(id),
    "approvedBy" INTEGER REFERENCES "Users"(id),
    status VARCHAR(50) DEFAULT 'pending',
    "requestDate" DATE NOT NULL,
    "approvalDate" DATE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS "Budgets" (
    id SERIAL PRIMARY KEY,
    "departmentId" INTEGER REFERENCES "Departments"(id),
    "fiscalYear" VARCHAR(10) NOT NULL,
    "budgetAmount" DECIMAL(15, 2) NOT NULL,
    "actualSpent" DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    "approvedBy" INTEGER REFERENCES "Users"(id),
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assets Table
CREATE TABLE IF NOT EXISTS "Assets" (
    id SERIAL PRIMARY KEY,
    "assetTag" VARCHAR(50) UNIQUE NOT NULL,
    "assetName" VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    "departmentId" INTEGER REFERENCES "Departments"(id),
    "purchaseDate" DATE NOT NULL,
    "purchasePrice" DECIMAL(15, 2) NOT NULL,
    "usefulLife" INTEGER NOT NULL,
    "salvageValue" DECIMAL(15, 2) DEFAULT 0,
    "annualDepreciation" DECIMAL(15, 2) DEFAULT 0,
    "accumulatedDepreciation" DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    description TEXT,
    supplier VARCHAR(255),
    "serialNumber" VARCHAR(100),
    location VARCHAR(255),
    "createdBy" INTEGER REFERENCES "Users"(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS "AuditLogs" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "Users"(id),
    action VARCHAR(100) NOT NULL,
    "tableName" VARCHAR(100),
    "recordId" INTEGER,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 2: SEED INITIAL DATA
-- ============================================

-- Insert Admin User (password: Admin@123 - hashed with bcrypt)
INSERT INTO "Users" (username, email, password, role, "firstName", "lastName") VALUES
('admin', 'admin@medfinance360.com', '$2b$10$YourHashedPasswordHere', 'admin', 'System', 'Administrator'),
('accountant', 'accountant@medfinance360.com', '$2b$10$YourHashedPasswordHere', 'accountant', 'John', 'Accountant'),
('billing', 'billing@medfinance360.com', '$2b$10$YourHashedPasswordHere', 'billing_staff', 'Jane', 'Billing')
ON CONFLICT (email) DO NOTHING;

-- Insert Departments
INSERT INTO "Departments" ("departmentCode", "departmentName", description) VALUES
('OPD', 'Outpatient Department', 'General outpatient services'),
('IPD', 'Inpatient Department', 'Inpatient ward services'),
('PHARM', 'Pharmacy', 'Medication dispensing'),
('LAB', 'Laboratory', 'Diagnostic testing'),
('RAD', 'Radiology', 'Imaging services'),
('ADMIN', 'Administration', 'Administrative functions')
ON CONFLICT ("departmentCode") DO NOTHING;

-- Insert Services
INSERT INTO "Services" ("serviceCode", "serviceName", category, department, price) VALUES
('OPD001', 'General Consultation', 'opd', 'OPD', 150.00),
('OPD002', 'Specialist Consultation', 'opd', 'OPD', 300.00),
('LAB001', 'Full Blood Count', 'laboratory', 'LAB', 80.00),
('LAB002', 'Malaria Test', 'laboratory', 'LAB', 50.00),
('RAD001', 'X-Ray Chest', 'radiology', 'RAD', 200.00),
('PHARM001', 'Medication Dispensing', 'pharmacy', 'PHARM', 0.00)
ON CONFLICT ("serviceCode") DO NOTHING;

-- Insert Chart of Accounts
INSERT INTO "ChartOfAccounts" ("accountCode", "accountName", "accountType", description) VALUES
('1000', 'Assets', 'asset', 'All assets'),
('1100', 'Current Assets', 'asset', 'Current assets'),
('1110', 'Cash', 'asset', 'Cash on hand'),
('1120', 'Bank Accounts', 'asset', 'Bank balances'),
('1200', 'Accounts Receivable', 'asset', 'Money owed to us'),
('2000', 'Liabilities', 'liability', 'All liabilities'),
('2100', 'Current Liabilities', 'liability', 'Current liabilities'),
('2110', 'Accounts Payable', 'liability', 'Money we owe'),
('3000', 'Equity', 'equity', 'Owner equity'),
('4000', 'Revenue', 'revenue', 'All revenue'),
('4100', 'Patient Services Revenue', 'revenue', 'Revenue from patient services'),
('5000', 'Expenses', 'expense', 'All expenses'),
('5100', 'Operating Expenses', 'expense', 'Day-to-day expenses')
ON CONFLICT ("accountCode") DO NOTHING;

-- Success message
SELECT 'Database migration completed successfully! All tables created and initial data seeded.' AS status;
