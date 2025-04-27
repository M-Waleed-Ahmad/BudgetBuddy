import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/login'
import Dashboard from './pages/users/dashboard'
import BudgetManagementPage from './pages/users/budgetManagement'
import ExpenseManagementPage from './pages/users/expenseManagement';
import SettingsPage from './pages/users/profile'
import FamilyBudgetingPage from './pages/users/FamilyBudgetingPage';

function App() {
  // Removed unused state variables
  const fetchedUserRoleForThisPlan = 'admin'; // or 'viewer', 'editor'
  // Removed unused categories array
  return (
      <>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/budget-management" element={<BudgetManagementPage />} /> {/* Redirect to login by default */}
          <Route path="/expense-management" element={<ExpenseManagementPage />} /> {/* Redirect to login by default */}
          <Route path="/shared-budgeting" element={<FamilyBudgetingPage userRole={fetchedUserRoleForThisPlan} /> } /> {/* Redirect to login by default */}
          <Route path="/" element={<Login />} /> {/* Redirect to login by default */}
        </Routes>
        </Router>

        {/* <Dashboard /> */}
      </>
  )
}
export default App
