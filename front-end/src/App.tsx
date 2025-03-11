import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Layout from "./components/Layout"
import Signup from "./pages/Signup"
import Catalogue from './pages/Catalogue'
import { Toaster } from 'sonner'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userLoggedIn = localStorage.getItem('isAuthenticated');
    if (userLoggedIn === 'true') {
      setIsAuthenticated(true)
    }
    else {
      setIsAuthenticated(false)
    }
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={isAuthenticated ? <Catalogue /> : <Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/catalogue" element={<Catalogue />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position='top-right' />
    </>
  )
}

export default App
