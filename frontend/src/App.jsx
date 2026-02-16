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

// Ledger
import ChartOfAccounts from './pages/ledger/ChartOfAccounts';

// Cash & Bank
import Payments from './pages/cash/Payments';

// Budgets
import Budgets from './pages/budgets/Budgets';

// Assets
import Assets from './pages/assets/Assets';

// Receivables
import CorporateAccounts from './pages/receivables/CorporateAccounts';
import Schemes from './pages/receivables/Schemes';

// Reports
import Reports from './pages/reports/Reports';

// Setup
import Setup from './pages/setup/Setup';
import ServiceForm from './pages/setup/ServiceForm';
import UserForm from './pages/setup/UserForm';
import DepartmentForm from './pages/setup/DepartmentForm';
import PayrollMedical from './pages/payroll/PayrollMedical';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

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
      <AuthProvider>
        <Router>
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
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/billing/opd" element={<OPDBilling />} />
                      <Route path="/billing/opd/new" element={<CreateOPDBill />} />
                      <Route path="/patients" element={<Patients />} />
                      <Route path="/patients/new" element={<CreatePatient />} />
                      <Route path="/nhima/eligibility" element={<EligibilityCheck />} />
                      <Route path="/nhima/submission" element={<ClaimsSubmission />} />
                      <Route path="/nhima/tracking" element={<ClaimsTracking />} />
                      <Route path="/nhima/reconciliation" element={<Reconciliation />} />
                      <Route path="/receivables/nhima" element={<NHIMAClaims />} />
                      <Route path="/receivables/corporate" element={<CorporateAccounts />} />
                      <Route path="/receivables/schemes" element={<Schemes />} />
                      <Route path="/payables/suppliers" element={<Suppliers />} />
                      <Route path="/ledger/accounts" element={<ChartOfAccounts />} />
                      <Route path="/cash/payments" element={<Payments />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/assets" element={<Assets />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="setup/services/new" element={<ServiceForm />} />
                      <Route path="setup/services/:id/edit" element={<ServiceForm />} />
                      <Route path="setup/users/new" element={<UserForm />} />
                      <Route path="setup/users/:id/edit" element={<UserForm />} />
                      <Route path="setup/departments/new" element={<DepartmentForm />} />
                      <Route path="setup/departments/:id/edit" element={<DepartmentForm />} />
                      <Route path="payroll/medical" element={<PayrollMedical />} />
                      <Route path="setup" element={<Setup />} />
                      {/* More routes will be added in next phases */}
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
