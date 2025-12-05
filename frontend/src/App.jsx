import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import LandingPage from './pages/LandingPage';
import ContactUsPage from './pages/contactUs';
import Dashboard from './pages/users/dashboard';
import BudgetManagementPage from './pages/users/budgetManagement';
import ExpenseManagementPage from './pages/users/expenseManagement';
import SettingsPage from './pages/users/profile';
import FamilyBudgetingPage from './pages/users/FamilyBudgetingPage';
import NotificationsPage from './pages/users/NotificationsPage';
import CashFlowPage from './pages/users/CashFlowPage';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import FaqsPage from './pages/FaqsPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import ContactPage from './pages/ContactPage';
import HelpCenterPage from './pages/HelpCenterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import UserBlogs from './pages/users/UserBlogs';
import BillingSuccess from './pages/BillingSuccess.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  return (
    <>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancel" element={<PricingPage />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget-management"
            element={
              <ProtectedRoute>
                <BudgetManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expense-management"
            element={
              <ProtectedRoute>
                <ExpenseManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashflow"
            element={
              <ProtectedRoute>
                <CashFlowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-blogs"
            element={
              <ProtectedRoute>
                <UserBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared-budgeting"
            element={
              <ProtectedRoute>
                <FamilyBudgetingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Default Route: Redirect based on login */}
          <Route
            path="/home"
            element={
              localStorage.getItem('token')
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* Catch-all for unmatched routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </>
  );
}

export default App;
