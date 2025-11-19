import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import SidebarLayout from "./components/SidebarLayout";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const cookies = new Cookies();
  const authToken = cookies.get("authToken");

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Homepage */}
        <Route
          path="/"
          element={
            <SidebarLayout>
              <Homepage />
            </SidebarLayout>
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes - require login */}
        <Route
          path="/assessment"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <Assessment />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <Dashboard />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
