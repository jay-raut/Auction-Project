import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'

import { Button } from "@/components/ui/button"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
      <div className="flex flex-col items-center justify-center min-h-svh">
        <Button>Click me</Button>
      </div>
    </>
    
  )
}

export default App
