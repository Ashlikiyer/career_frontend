import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/DashboardNew";
import AdminDashboard from "./pages/AdminDashboard";
import StudentProgress from "./pages/StudentProgress";
import SidebarLayout from "./components/SidebarLayout";
import { ToastProvider } from "./components/ui/Toast";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { SplashScreen } from "./components/SplashScreen";

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
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Only show splash screen when running as installed PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setShowSplash(true);
    }
  }, []);

  return (
    <ToastProvider>
      {/* Splash Screen - Only shows for installed PWA */}
      {showSplash && (
        <SplashScreen 
          onFinish={() => setShowSplash(false)}
          minDisplayTime={2500}
        />
      )}

      <BrowserRouter>
      <Routes>
        {/* Public route - Homepage (no sidebar, has its own navbar) */}
        <Route path="/" element={<Homepage />} />

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
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <AdminDashboard />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <StudentProgress />
              </SidebarLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      
      {/* PWA Install Prompt - shows on all pages */}
      <PWAInstallPrompt />
    </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
