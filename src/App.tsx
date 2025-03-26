import { BrowserRouter, Routes, Route } from "react-router-dom"
import Homepage from "./pages/Homepage"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Assessment from "./pages/Assessment"
import Results from "./pages/Results"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="assessment" element={<Assessment />} />
        <Route path="results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App