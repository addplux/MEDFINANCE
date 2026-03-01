/**
 * Author: Lubuto Chabusha
 * Developed: 2026
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LandingPage from './pages/LandingPage';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Billing
import OPDBilling from './pages/billing/OPDBilling';
import CreateOPDBill from './pages/billing/CreateOPDBill';

// Patients
import Patients from './pages/patients/Patients';
import CreatePatient from './pages/patients/CreatePatient';
import EditPatient from './pages/patients/EditPatient';
import MergePatients from './pages/patients/MergePatients';
import PatientView from './pages/patients/PatientView';
import PatientVisitHistory from './pages/patients/PatientVisitHistory';

// Visits
import Visits from './pages/visits/Visits';
import CreateVisit from './pages/visits/CreateVisit';
import VisitDetail from './pages/visits/VisitDetail';

// Receivables


// Scheme Manager - Private Prepaid
import MembershipRegistration from './pages/schemes/private/MembershipRegistration';
import PlanSelection from './pages/schemes/private/PlanSelection';
import StartEndDate from './pages/schemes/private/StartEndDate';
import ServiceCoverage from './pages/schemes/private/ServiceCoverage';
import UtilisationTracking from './pages/schemes/private/UtilisationTracking';

// Scheme Manager - Corporate
import CorporateMemberManagement from './pages/schemes/corporate/CorporateMemberManagement';
import CreditLimit from './pages/schemes/corporate/CreditLimit';
import PaymentTerms from './pages/schemes/corporate/PaymentTerms';
import MonthlyBilling from './pages/schemes/corporate/MonthlyBilling';

// Payables
import Suppliers from './pages/payables/Suppliers';
import SupplierForm from './pages/payables/SupplierForm';

// Ledger
import ChartOfAccounts from './pages/ledger/ChartOfAccounts';
import AccountForm from './pages/ledger/AccountForm';
import JournalEntries from './pages/ledger/JournalEntries';
import JournalEntryForm from './pages/ledger/JournalEntryForm';
import TrialBalance from './pages/ledger/TrialBalance';


// Funds
import Funds from './pages/funds/Funds';
import FundForm from './pages/funds/FundForm';
import FundDetail from './pages/funds/FundDetail';

// Receivables
import CorporateAccounts from './pages/receivables/CorporateAccounts';
import CorporateAccountForm from './pages/receivables/CorporateAccountForm';
import Schemes from './pages/receivables/Schemes';
import SchemeForm from './pages/receivables/SchemeForm';
import SchemeDetails from './pages/receivables/SchemeDetails';
import SchemeInvoices from './pages/receivables/SchemeInvoices';
import InvoiceView from './pages/receivables/InvoiceView';
import FamilyLedger from './pages/receivables/FamilyLedger';
import DebtorAgeing from './pages/receivables/DebtorAgeing';

// Reports
import Reports from './pages/reports/Reports';

import Setup from './pages/setup/Setup';
import ServiceForm from './pages/setup/ServiceForm';
import ServicesList from './pages/setup/ServicesList';
import UserForm from './pages/setup/UserForm';
import UserRoles from './pages/setup/UserRoles';
import DepartmentForm from './pages/setup/DepartmentForm';
import PayrollMedical from './pages/payroll/PayrollMedical';
import SystemLogs from './pages/setup/SystemLogs';

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

// Radiology
import RadiologyDashboard from './pages/radiology/RadiologyDashboard';
import RadiologyRequestForm from './pages/radiology/RadiologyRequestForm';

// Theatre
import TheatreBilling from './pages/theatre/TheatreBilling';
import TheatreBillForm from './pages/theatre/TheatreBillForm';

// Maternity
import MaternityBilling from './pages/maternity/MaternityBilling';
import MaternityBillForm from './pages/maternity/MaternityBillForm';

// Specialist Clinics
import SpecialistClinics from './pages/specialist/SpecialistClinics';
import SpecialistClinicForm from './pages/specialist/SpecialistClinicForm';

// Shared Components
import DepartmentDashboard from './pages/shared/DepartmentDashboard';

// Admin
import PendingApprovals from './pages/setup/PendingApprovals';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Offline Support
import { OfflineProvider } from './context/OfflineContext';
import OfflineBanner from './components/ui/OfflineBanner';

// Protected Route Component — checks authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based Route Guard — redirects if user doesn't have the required role
const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();

  const SUPER = ['superintendent', 'admin'];

  // Superintendent and admin always get through
  if (SUPER.includes(user?.role)) return children;

  // If no role restriction, allow
  if (!roles || roles.length === 0) return children;

  // Check if user's role is in the allowed list
  if (roles.includes(user?.role)) return children;

  // Otherwise show access denied
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
      <p className="text-white/40 mb-6 max-w-sm">
        Your role (<span className="text-white/70 font-semibold">{user?.role?.replace('_', ' ')}</span>) does not have permission to view this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
      >
        Go Back
      </button>
    </div>
  );
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
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />

              {/* Protected Routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        {/* ── Dashboard — all roles ───────────────────────────────────── */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="dashboard" element={<Dashboard />} />

                        {/* ── Patients & Visits — clinical + cashier ──────────────────── */}
                        <Route path="patients" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><Patients /></RoleRoute>} />
                        <Route path="patients/new" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><CreatePatient /></RoleRoute>} />
                        <Route path="patients/merge" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><MergePatients /></RoleRoute>} />
                        <Route path="patients/:id" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><PatientView /></RoleRoute>} />
                        <Route path="patients/:id/edit" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><EditPatient /></RoleRoute>} />
                        <Route path="patients/:id/history" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><PatientVisitHistory /></RoleRoute>} />

                        <Route path="visits" element={<RoleRoute roles={['doctor', 'nurse']}><Visits /></RoleRoute>} />
                        <Route path="visits/new" element={<RoleRoute roles={['doctor', 'nurse']}><CreateVisit /></RoleRoute>} />
                        <Route path="visits/:id" element={<RoleRoute roles={['doctor', 'nurse']}><VisitDetail /></RoleRoute>} />

                        {/* ── OPD Billing ─────────────────────────────────────────────── */}
                        <Route path="billing/opd" element={<RoleRoute roles={['cashier', 'accountant']}><OPDBilling /></RoleRoute>} />
                        <Route path="billing/opd/new" element={<RoleRoute roles={['cashier', 'accountant']}><CreateOPDBill /></RoleRoute>} />

                        {/* ── Scheme Manager — cashier + finance ──────────────────────── */}
                        <Route path="schemes/private/members" element={<RoleRoute roles={['cashier', 'accountant']}><MembershipRegistration /></RoleRoute>} />
                        <Route path="schemes/private/plans" element={<RoleRoute roles={['cashier', 'accountant']}><PlanSelection /></RoleRoute>} />
                        <Route path="schemes/private/duration" element={<RoleRoute roles={['cashier', 'accountant']}><StartEndDate /></RoleRoute>} />
                        <Route path="schemes/private/validation" element={<RoleRoute roles={['cashier', 'accountant']}><ServiceCoverage /></RoleRoute>} />
                        <Route path="schemes/private/tracking" element={<RoleRoute roles={['cashier', 'accountant']}><UtilisationTracking /></RoleRoute>} />

                        <Route path="schemes/corporate/members" element={<RoleRoute roles={['cashier', 'accountant']}><CorporateMemberManagement /></RoleRoute>} />
                        <Route path="schemes/corporate/credit" element={<RoleRoute roles={['cashier', 'accountant']}><CreditLimit /></RoleRoute>} />
                        <Route path="schemes/corporate/terms" element={<RoleRoute roles={['cashier', 'accountant']}><PaymentTerms /></RoleRoute>} />
                        <Route path="schemes/corporate/billing" element={<RoleRoute roles={['cashier', 'accountant']}><MonthlyBilling /></RoleRoute>} />

                        {/* ── Receivables — cashier + finance ─────────────────────────── */}
                        <Route path="receivables/corporate" element={<RoleRoute roles={['cashier', 'accountant']}><CorporateAccounts /></RoleRoute>} />
                        <Route path="receivables/corporate/new" element={<RoleRoute roles={['cashier', 'accountant']}><CorporateAccountForm /></RoleRoute>} />
                        <Route path="receivables/corporate/:id/edit" element={<RoleRoute roles={['cashier', 'accountant']}><CorporateAccountForm /></RoleRoute>} />
                        <Route path="receivables/schemes" element={<RoleRoute roles={['cashier', 'accountant']}><Schemes /></RoleRoute>} />
                        <Route path="receivables/schemes/new" element={<RoleRoute roles={['cashier', 'accountant']}><SchemeForm /></RoleRoute>} />
                        <Route path="receivables/schemes/:id" element={<RoleRoute roles={['cashier', 'accountant']}><SchemeDetails /></RoleRoute>} />
                        <Route path="receivables/schemes/:id/edit" element={<RoleRoute roles={['cashier', 'accountant']}><SchemeForm /></RoleRoute>} />
                        <Route path="receivables/invoices/:id" element={<RoleRoute roles={['cashier', 'accountant']}><InvoiceView /></RoleRoute>} />
                        <Route path="receivables/ledger/:policyNumber" element={<RoleRoute roles={['cashier', 'accountant']}><FamilyLedger /></RoleRoute>} />
                        <Route path="receivables/ageing" element={<RoleRoute roles={['accountant']}><DebtorAgeing /></RoleRoute>} />

                        {/* ── Payables / Ledger / Budgets / Funds — finance only ───────── */}
                        <Route path="payables/suppliers" element={<RoleRoute roles={['accountant']}><Suppliers /></RoleRoute>} />
                        <Route path="payables/suppliers/new" element={<RoleRoute roles={['accountant']}><SupplierForm /></RoleRoute>} />
                        <Route path="payables/suppliers/:id/edit" element={<RoleRoute roles={['accountant']}><SupplierForm /></RoleRoute>} />

                        <Route path="ledger/accounts" element={<RoleRoute roles={['accountant']}><ChartOfAccounts /></RoleRoute>} />
                        <Route path="ledger/accounts/new" element={<RoleRoute roles={['accountant']}><AccountForm /></RoleRoute>} />
                        <Route path="ledger/accounts/:id/edit" element={<RoleRoute roles={['accountant']}><AccountForm /></RoleRoute>} />
                        <Route path="ledger/journal-entries" element={<RoleRoute roles={['accountant']}><JournalEntries /></RoleRoute>} />
                        <Route path="ledger/journal-entries/new" element={<RoleRoute roles={['accountant']}><JournalEntryForm /></RoleRoute>} />
                        <Route path="ledger/trial-balance" element={<RoleRoute roles={['accountant']}><TrialBalance /></RoleRoute>} />

                        <Route path="budgets" element={<RoleRoute roles={['accountant']}><Budgets /></RoleRoute>} />
                        <Route path="budgets/new" element={<RoleRoute roles={['accountant']}><BudgetForm /></RoleRoute>} />
                        <Route path="budgets/:id/edit" element={<RoleRoute roles={['accountant']}><BudgetForm /></RoleRoute>} />
                        <Route path="budgets/analysis" element={<RoleRoute roles={['accountant']}><BudgetAnalysis /></RoleRoute>} />

                        <Route path="funds" element={<RoleRoute roles={['accountant']}><Funds /></RoleRoute>} />
                        <Route path="funds/new" element={<RoleRoute roles={['accountant']}><FundForm /></RoleRoute>} />
                        <Route path="funds/:id/edit" element={<RoleRoute roles={['accountant']}><FundForm /></RoleRoute>} />
                        <Route path="funds/:id" element={<RoleRoute roles={['accountant']}><FundDetail /></RoleRoute>} />

                        <Route path="payroll/medical" element={<RoleRoute roles={['accountant']}><PayrollMedical /></RoleRoute>} />

                        <Route path="reports" element={<RoleRoute roles={['accountant', 'doctor']}><Reports /></RoleRoute>} />

                        {/* ── Cash & Banking — cashier + finance ──────────────────────── */}
                        <Route path="cash/payments" element={<RoleRoute roles={['cashier', 'accountant']}><Payments /></RoleRoute>} />
                        <Route path="cash/payments/new" element={<RoleRoute roles={['cashier', 'accountant']}><PaymentForm /></RoleRoute>} />
                        <Route path="cash/payments/:id/edit" element={<RoleRoute roles={['cashier', 'accountant']}><PaymentForm /></RoleRoute>} />
                        <Route path="cash/shift-report" element={<RoleRoute roles={['cashier', 'accountant']}><ShiftReport /></RoleRoute>} />

                        {/* ── Laboratory — lab techs + clinical ───────────────────────── */}
                        <Route path="lab/dashboard" element={<RoleRoute roles={['lab_technician', 'doctor', 'nurse']}><LabDashboard /></RoleRoute>} />
                        <Route path="lab/tests" element={<RoleRoute roles={['lab_technician', 'doctor', 'nurse']}><LabTests /></RoleRoute>} />
                        <Route path="lab/request" element={<RoleRoute roles={['lab_technician', 'doctor', 'nurse']}><LabRequestForm /></RoleRoute>} />
                        <Route path="lab/results/:id" element={<RoleRoute roles={['lab_technician', 'doctor', 'nurse']}><LabResultEntry /></RoleRoute>} />

                        {/* ── Pharmacy — pharmacist + clinical ────────────────────────── */}
                        <Route path="pharmacy/dashboard" element={<RoleRoute roles={['pharmacist', 'doctor', 'nurse']}><DepartmentDashboard title="Pharmacy" departmentId={2} /></RoleRoute>} />
                        <Route path="pharmacy/inventory" element={<RoleRoute roles={['pharmacist']}><PharmacyInventory /></RoleRoute>} />
                        <Route path="pharmacy/grn" element={<RoleRoute roles={['pharmacist']}><GoodsReceivedNote /></RoleRoute>} />
                        <Route path="pharmacy/dispense" element={<RoleRoute roles={['pharmacist', 'doctor', 'nurse']}><Dispense /></RoleRoute>} />

                        {/* ── Radiology — radiographer + clinical ─────────────────────── */}
                        <Route path="radiology/dashboard" element={<RoleRoute roles={['radiographer', 'doctor', 'nurse']}><RadiologyDashboard /></RoleRoute>} />
                        <Route path="radiology/request" element={<RoleRoute roles={['radiographer', 'doctor', 'nurse']}><RadiologyRequestForm /></RoleRoute>} />

                        {/* ── Clinical Departments — clinical only ─────────────────────── */}
                        <Route path="opd/dashboard" element={<RoleRoute roles={['doctor', 'nurse', 'cashier']}><DepartmentDashboard title="OPD" departmentId={4} /></RoleRoute>} />

                        <Route path="theatre/dashboard" element={<RoleRoute roles={['doctor', 'nurse']}><DepartmentDashboard title="Theatre" departmentId={7} type="theatre" /></RoleRoute>} />
                        <Route path="theatre/billing/new" element={<RoleRoute roles={['doctor', 'nurse']}><TheatreBillForm /></RoleRoute>} />
                        <Route path="theatre/billing/:id/edit" element={<RoleRoute roles={['doctor', 'nurse']}><TheatreBillForm /></RoleRoute>} />

                        <Route path="maternity/billing" element={<RoleRoute roles={['doctor', 'nurse']}><DepartmentDashboard title="Maternity" departmentId={6} type="maternity" /></RoleRoute>} />
                        <Route path="maternity/billing/new" element={<RoleRoute roles={['doctor', 'nurse']}><MaternityBillForm /></RoleRoute>} />
                        <Route path="maternity/billing/:id/edit" element={<RoleRoute roles={['doctor', 'nurse']}><MaternityBillForm /></RoleRoute>} />

                        <Route path="specialist-clinics/billing" element={<RoleRoute roles={['doctor', 'nurse']}><SpecialistClinics /></RoleRoute>} />
                        <Route path="specialist-clinics/billing/new" element={<RoleRoute roles={['doctor', 'nurse']}><SpecialistClinicForm /></RoleRoute>} />
                        <Route path="specialist-clinics/billing/:id/edit" element={<RoleRoute roles={['doctor', 'nurse']}><SpecialistClinicForm /></RoleRoute>} />

                        <Route path="physiology/dashboard" element={<RoleRoute roles={['doctor', 'nurse']}><DepartmentDashboard title="Physiotherapy" departmentId={5} /></RoleRoute>} />
                        <Route path="physiology/billing/new" element={<RoleRoute roles={['doctor', 'nurse']}><SpecialistClinicForm defaultClinicType="Physiotherapy" /></RoleRoute>} />

                        <Route path="dental/dashboard" element={<RoleRoute roles={['doctor', 'nurse']}><DepartmentDashboard title="Dental" departmentId={6} /></RoleRoute>} />
                        <Route path="dental/billing/new" element={<RoleRoute roles={['doctor', 'nurse']}><SpecialistClinicForm defaultClinicType="Dental" /></RoleRoute>} />

                        {/* ── Setup — superintendent + admin only ─────────────────────── */}
                        <Route path="setup" element={<RoleRoute roles={[]}><Setup /></RoleRoute>} />
                        <Route path="setup/services" element={<RoleRoute roles={[]}><ServicesList /></RoleRoute>} />
                        <Route path="setup/services/new" element={<RoleRoute roles={[]}><ServiceForm /></RoleRoute>} />
                        <Route path="setup/services/:id/edit" element={<RoleRoute roles={[]}><ServiceForm /></RoleRoute>} />
                        <Route path="setup/users/new" element={<RoleRoute roles={[]}><UserForm /></RoleRoute>} />
                        <Route path="setup/users/:id/edit" element={<RoleRoute roles={[]}><UserForm /></RoleRoute>} />
                        <Route path="setup/roles" element={<RoleRoute roles={[]}><UserRoles /></RoleRoute>} />
                        <Route path="setup/departments/new" element={<RoleRoute roles={[]}><DepartmentForm /></RoleRoute>} />
                        <Route path="setup/departments/:id/edit" element={<RoleRoute roles={[]}><DepartmentForm /></RoleRoute>} />
                        <Route path="setup/audit-logs" element={<RoleRoute roles={[]}><SystemLogs /></RoleRoute>} />
                        <Route path="setup/pending-approvals" element={<RoleRoute roles={[]}><PendingApprovals /></RoleRoute>} />

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
