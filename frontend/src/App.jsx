import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/login'
import Dashboard from './pages/users/dashboard'
function App() {
  // Removed unused state variables

  // Removed unused categories array
  return (
      <>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        </Router>

        {/* <Dashboard /> */}
      </>
  )
}
export default App
