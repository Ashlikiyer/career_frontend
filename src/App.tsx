import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import SidebarLayout from "./components/SidebarLayout";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <SidebarLayout>
              <Homepage />
            </SidebarLayout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/assessment"
          element={
            <SidebarLayout>
              <Assessment />
            </SidebarLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <SidebarLayout>
              <Dashboard />
            </SidebarLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
