// import React from 'react'; // Removed useState as it's not used here
// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import Login from './pages/login';
// import Dashboard from './pages/users/dashboard';
// import BudgetManagementPage from './pages/users/budgetManagement';
// import ExpenseManagementPage from './pages/users/expenseManagement';
// import SettingsPage from './pages/users/profile';
// import FamilyBudgetingPage from './pages/users/FamilyBudgetingPage';
// import NotificationsPage from './pages/users/NotificationsPage';
// import ProtectedRoute from './components/ProtectedRoute'; // Import the wrapper
// import Login from './pages/login'
// import Dashboard from './pages/users/dashboard'
// import Navbar from './components/navbar1';
// import Footer from './components/footer1';

import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/users/dashboard";
import BudgetManagementPage from "./pages/users/budgetManagement";
import ExpenseManagementPage from "./pages/users/expenseManagement";
import SettingsPage from "./pages/users/profile";
import FamilyBudgetingPage from "./pages/users/FamilyBudgetingPage";
import NotificationsPage from "./pages/users/NotificationsPage";

import ProtectedRoute from "./components/ProtectedRoute";
import landingpage from "./pages/landingpage";

function App() {
  return (
      <>
      {/* {<Login /> } */}
      {<landingpage/>}

      {/* <Dashboard /> */}
      </>
      
  )
}

export default App;
