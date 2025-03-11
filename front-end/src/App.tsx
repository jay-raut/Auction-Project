import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Layout from "./components/Layout"
import Signup from "./pages/Signup"
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position='top-right' />
    </>
  )
}

export default App
