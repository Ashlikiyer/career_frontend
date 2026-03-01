import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  LogOut,
  LayoutDashboard,
  X,
  Menu,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Cookies } from "react-cookie";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const cookies = new Cookies();
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  // Check if user is admin
  const userRole = cookies.get("userRole");
  const isAdmin = userRole === "admin";

  const handleLogout = () => {
    cookies.remove("authToken");
    cookies.remove("userRole");
    navigate("/login");
  };

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Progress",
      url: "/progress",
      icon: TrendingUp,
    },
    {
      title: "Assessment",
      url: "/assessment",
      icon: FileText,
    },
    // Only show Analytics for admin users
    ...(isAdmin ? [{
      title: "Analytics (Admin)",
      url: "/admin",
      icon: BarChart3,
    }] : []),
  ];

  const handleMenuClick = (url: string) => {
    navigate(url);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Overlay - with fade animation */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
          onClick={() => setMenuOpen(false)}
          style={{
            animation: "fadeIn 0.3s ease-in-out",
          }}
        />
      )}

      {/* Sidebar - with slide animation */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white z-50 shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}
          w-[280px] sm:w-[300px] md:w-[320px] lg:w-[280px]
        `}
        style={{
          boxShadow: menuOpen ? "4px 0 24px rgba(0, 0, 0, 0.15)" : "none",
        }}
      >
        {/* Header - animated */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3 animate-slideInLeft">
            <div className="flex h-12 w-12 items-center justify-center">
              <img
                src="/pathfinder-logo.png"
                alt="PathFinder Logo"
                className="h-12 w-12 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 tracking-tight">
                PathFinder
              </span>
              <span className="text-xs text-blue-600 font-medium">
                Career Navigator
              </span>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Menu Items - with staggered animation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={item.title}
              onClick={() => handleMenuClick(item.url)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left font-medium transition-all duration-200 group
                ${
                  location.pathname === item.url
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:scale-[1.02] hover:shadow-md"
                }
              `}
              style={{
                animation: menuOpen
                  ? `slideInLeft 0.3s ease-out ${index * 0.1}s both`
                  : "none",
              }}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  location.pathname === item.url ? "" : "group-hover:scale-110"
                }`}
              />
              <span className="text-[15px]">{item.title}</span>
              {location.pathname === item.url && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer - Logout with animation - pinned to bottom */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0 mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium hover:scale-[1.02] hover:shadow-md group"
                style={{
                  animation: menuOpen
                    ? "slideInLeft 0.3s ease-out 0.4s both"
                    : "none",
                }}
              >
                <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[15px]">Logout</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-gray-200 text-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  Are you sure you want to log out? You'll need to sign in again
                  to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/95 backdrop-blur-sm px-4 shadow-sm">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find((item) => item.url === location.pathname)
                ?.title || "PathFinder"}
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.4s ease-out;
        }

        /* Smooth scrollbar */
        aside::-webkit-scrollbar {
          width: 6px;
        }

        aside::-webkit-scrollbar-track {
          background: transparent;
        }

        aside::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        aside::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          aside {
            width: 85vw;
            max-width: 320px;
          }
        }
      `}</style>
    </>
  );
};

export default SidebarLayout;
