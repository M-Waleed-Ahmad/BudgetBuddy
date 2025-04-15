import { useState } from 'react'

import Navbar from './components/navbar'
import Login from './pages/login';


function App() {
  const [count, setCount] = useState(0)

  return (
      <>
        <Login />
      </>
  )
}
export default App
