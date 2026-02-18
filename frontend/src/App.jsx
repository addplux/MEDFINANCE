/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Pages
import Login from './pages/auth/Login';
import LandingPage from './pages/LandingPage';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Billing
import OPDBilling from './pages/billing/OPDBilling';
import CreateOPDBill from './pages/billing/CreateOPDBill';

// Patients
import Patients from './pages/patients/Patients';
import CreatePatient from './pages/patients/CreatePatient';

// Receivables
import NHIMAClaims from './pages/receivables/NHIMAClaims';

// NHIMA
import EligibilityCheck from './pages/nhima/EligibilityCheck';
import ClaimsSubmission from './pages/nhima/ClaimsSubmission';
import ClaimsTracking from './pages/nhima/ClaimsTracking';
import Reconciliation from './pages/nhima/Reconciliation';

// Payables
import Suppliers from './pages/payables/Suppliers';
import SupplierForm from './pages/payables/SupplierForm';

// Ledger
import ChartOfAccounts from './pages/ledger/ChartOfAccounts';

// Assets
import Assets from './pages/assets/Assets';
import AssetForm from './pages/assets/AssetForm';

// Funds
import Funds from './pages/funds/Funds';
import FundForm from './pages/funds/FundForm';

// Receivables
import CorporateAccounts from './pages/receivables/CorporateAccounts';
import CorporateAccountForm from './pages/receivables/CorporateAccountForm';
import Schemes from './pages/receivables/Schemes';
import SchemeForm from './pages/receivables/SchemeForm';
import DebtorAgeing from './pages/receivables/DebtorAgeing';

// Reports
import Reports from './pages/reports/Reports';

// Setup
import Setup from './pages/setup/Setup';
import ServiceForm from './pages/setup/ServiceForm';
import ServicesList from './pages/setup/ServicesList';
import UserForm from './pages/setup/UserForm';
import UserRoles from './pages/setup/UserRoles';
import DepartmentForm from './pages/setup/DepartmentForm';
import PayrollMedical from './pages/payroll/PayrollMedical';

// Cash
import Payments from './pages/cash/Payments';
import PaymentForm from './pages/cash/PaymentForm';
import ShiftReport from './pages/cash/ShiftReport';

// Budgets
import Budgets from './pages/budgets/Budgets';
import BudgetForm from './pages/budgets/BudgetForm';
import BudgetAnalysis from './pages/budgets/BudgetAnalysis';

// Pharmacy
import PharmacyInventory from './pages/pharmacy/PharmacyInventory';
import GoodsReceivedNote from './pages/pharmacy/GoodsReceivedNote';
import Dispense from './pages/pharmacy/Dispense';

// Lab
import LabDashboard from './pages/lab/LabDashboard';
import LabTests from './pages/lab/LabTests';
import LabRequestForm from './pages/lab/LabRequestForm';
import LabResultEntry from './pages/lab/LabResultEntry';

// Theatre
import TheatreBilling from './pages/theatre/TheatreBilling';
import TheatreBillForm from './pages/theatre/TheatreBillForm';

// Maternity
import MaternityBilling from './pages/maternity/MaternityBilling';
import MaternityBillForm from './pages/maternity/MaternityBillForm';

// Specialist Clinics
import SpecialistClinics from './pages/specialist/SpecialistClinics';
import SpecialistClinicForm from './pages/specialist/SpecialistClinicForm';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Offline Support
import { OfflineProvider } from './context/OfflineContext';
import OfflineBanner from './components/ui/OfflineBanner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ToastProvider>
      <OfflineProvider>
        <AuthProvider>
          <Router>
            <OfflineBanner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />

              {/* Protected Routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="billing/opd" element={<OPDBilling />} />
                        <Route path="billing/opd/new" element={<CreateOPDBill />} />
                        <Route path="patients" element={<Patients />} />
                        <Route path="patients/new" element={<CreatePatient />} />
                        <Route path="nhima/eligibility" element={<EligibilityCheck />} />
                        <Route path="nhima/submission" element={<ClaimsSubmission />} />
                        <Route path="nhima/tracking" element={<ClaimsTracking />} />
                        <Route path="nhima/reconciliation" element={<Reconciliation />} />
                        <Route path="receivables/nhima" element={<NHIMAClaims />} />
                        <Route path="receivables/corporate" element={<CorporateAccounts />} />
                        <Route path="receivables/corporate/new" element={<CorporateAccountForm />} />
                        <Route path="receivables/corporate/:id/edit" element={<CorporateAccountForm />} />
                        <Route path="receivables/schemes" element={<Schemes />} />
                        <Route path="receivables/schemes/new" element={<SchemeForm />} />
                        <Route path="receivables/schemes/:id/edit" element={<SchemeForm />} />
                        <Route path="receivables/ageing" element={<DebtorAgeing />} />

                        <Route path="payables/suppliers" element={<Suppliers />} />
                        <Route path="payables/suppliers/new" element={<SupplierForm />} />
                        <Route path="payables/suppliers/:id/edit" element={<SupplierForm />} />

                        <Route path="ledger/accounts" element={<ChartOfAccounts />} />

                        <Route path="cash/payments" element={<Payments />} />
                        <Route path="cash/payments/new" element={<PaymentForm />} />
                        <Route path="cash/payments/:id/edit" element={<PaymentForm />} />
                        <Route path="cash/shift-report" element={<ShiftReport />} />

                        <Route path="budgets" element={<Budgets />} />
                        <Route path="budgets/new" element={<BudgetForm />} />
                        <Route path="budgets/:id/edit" element={<BudgetForm />} />
                        <Route path="budgets/analysis" element={<BudgetAnalysis />} />

                        <Route path="funds" element={<Funds />} />
                        <Route path="funds/new" element={<FundForm />} />
                        <Route path="funds/:id/edit" element={<FundForm />} />
                        <Route path="funds/:id" element={<Funds />} />

                        <Route path="assets" element={<Assets />} />
                        <Route path="assets/new" element={<AssetForm />} />
                        <Route path="assets/:id/edit" element={<AssetForm />} />

                        <Route path="reports" element={<Reports />} />

                        <Route path="setup/services" element={<ServicesList />} />
                        <Route path="setup/services/new" element={<ServiceForm />} />
                        <Route path="setup/services/:id/edit" element={<ServiceForm />} />
                        <Route path="setup/users/new" element={<UserForm />} />
                        <Route path="setup/users/:id/edit" element={<UserForm />} />
                        <Route path="setup/roles" element={<UserRoles />} />
                        <Route path="setup/departments/new" element={<DepartmentForm />} />
                        <Route path="setup/departments/:id/edit" element={<DepartmentForm />} />

                        <Route path="payroll/medical" element={<PayrollMedical />} />

                        <Route path="pharmacy/inventory" element={<PharmacyInventory />} />
                        <Route path="pharmacy/grn" element={<GoodsReceivedNote />} />
                        <Route path="pharmacy/dispense" element={<Dispense />} />

                        <Route path="lab/dashboard" element={<LabDashboard />} />
                        <Route path="lab/tests" element={<LabTests />} />
                        <Route path="lab/request" element={<LabRequestForm />} />
                        <Route path="lab/results/:id" element={<LabResultEntry />} />

                        <Route path="theatre/billing" element={<TheatreBilling />} />
                        <Route path="theatre/billing/new" element={<TheatreBillForm />} />
                        <Route path="theatre/billing/:id/edit" element={<TheatreBillForm />} />

                        <Route path="maternity/billing" element={<MaternityBilling />} />
                        <Route path="maternity/billing/new" element={<MaternityBillForm />} />
                        <Route path="maternity/billing/:id/edit" element={<MaternityBillForm />} />

                        <Route path="specialist-clinics/billing" element={<SpecialistClinics />} />
                        <Route path="specialist-clinics/billing/new" element={<SpecialistClinicForm />} />
                        <Route path="specialist-clinics/billing/:id/edit" element={<SpecialistClinicForm />} />

                        <Route path="setup" element={<Setup />} />
                        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </OfflineProvider>
    </ToastProvider>
  );
}

export default App;
