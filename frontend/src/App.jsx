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
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import AdminBlogs from './pages/admin/AdminBlogs';
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
          <Route path="/billing/success" element={<PricingPage />} />
          <Route path="/billing/cancel" element={<PricingPage />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route
            path="/admin/blogs"
            element={
              <ProtectedRoute>
                <AdminBlogs />
              </ProtectedRoute>
            }
          />

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
