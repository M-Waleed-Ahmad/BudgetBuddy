import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/login'
import Dashboard from './pages/users/dashboard'
import BudgetManagementPage from './pages/users/budgetManagement'
import SettingsPage from './pages/users/profile'
function App() {
  // Removed unused state variables

  // Removed unused categories array
  return (
      <>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/budget-management" element={<BudgetManagementPage />} /> {/* Redirect to login by default */}
          {/* Add more routes as needed */}
        </Routes>
        </Router>

        {/* <Dashboard /> */}
      </>
  )
}
export default App
