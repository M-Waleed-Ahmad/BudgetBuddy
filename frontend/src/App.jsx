import { useState } from 'react'

import Login from './pages/login'
import Dashboard from './pages/users/dashboard'
function App() {
  const [count, setCount] = useState(0)

  const categories=[
    { name: "Food", allocated: 5000, spent: 4200 },
    { name: "Transport", allocated: 4000, spent: 3500 },
    { name: "Entertainment", allocated: 3000, spent: 2000 },
    { name: "Utilities", allocated: 2500, spent: 1800 },
    { name: "Shopping", allocated: 4500, spent: 4300 }
  ];
  return (
      <>
        {/* <Login /> */}

        <Dashboard />
      </>
  )
}
export default App
