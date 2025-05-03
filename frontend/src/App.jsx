import React from 'react'; // Removed useState as it's not used here
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/users/dashboard';
import BudgetManagementPage from './pages/users/budgetManagement';
import ExpenseManagementPage from './pages/users/expenseManagement';
import SettingsPage from './pages/users/profile';
import FamilyBudgetingPage from './pages/users/FamilyBudgetingPage';
import NotificationsPage from './pages/users/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute'; // Import the wrapper

import { Toaster } from 'react-hot-toast';

import './App.css'; // Import your CSS file

function App() {
  // This simulation is generally better handled within FamilyBudgetingPage itself
  const fetchedUserRoleForThisPlan = 'admin';

  return (
      <> {/* Use Fragment shorthand */}
        <Router>
        <Toaster position="top-center" reverseOrder={false} />

          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

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
              path="/shared-budgeting"
              element={
                <ProtectedRoute>
                  {/* Pass props as needed, role handling is internal now */}
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

             {/* Default Route */}
             {/* Option 1: Redirect '/' to '/dashboard' if logged in, else '/login' */}
             <Route
                path="/"
                element={
                    localStorage.getItem('token')
                    ? <Navigate to="/dashboard" replace />
                    : <Navigate to="/login" replace />
                }
             />

             {/* Option 2: Always redirect '/' to '/login' (simpler if login handles redirect) */}
             {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}


             {/* Catch-all for unmatched routes (Optional) */}
             <Route path="*" element={<Navigate to="/" replace />} />
             {/* Or show a 404 page */}
             {/* <Route path="*" element={<NotFoundPage />} /> */}

          </Routes>
        </Router>
      </>
  );
}

export default App;