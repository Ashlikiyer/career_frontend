import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Cookies } from "react-cookie";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { logoutUser } from "../../services/dataService";

const Navbar = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authToken = cookies.get("authToken");
    setIsAuthenticated(!!authToken);
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div>
      <nav className="bg-[#111827] p-4 flex justify-between items-center">
        <div className="flex space-x-20 flex-grow justify-center">
          <Link to="/" className="text-white hover:text-white">
            HOME
          </Link>
          <Link
            to="/assessment"
            className={`text-white hover:text-white ${
              !isAuthenticated ? "pointer-events-none opacity-50" : ""
            }`}
            onClick={(e) => !isAuthenticated && e.preventDefault()}
          >
            ASSESSMENT
          </Link>
          <Link
            to="/dashboard"
            className={`text-white hover:text-white ${
              !isAuthenticated ? "pointer-events-none opacity-50" : ""
            }`}
            onClick={(e) => !isAuthenticated && e.preventDefault()}
          >
            DASHBOARD
          </Link>
        </div>
        <div className="relative flex items-center">
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full bg-gray-700 w-10 h-10 p-0 flex items-center justify-center text-white"
                >
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-[#1F2937] border-gray-600 text-gray-200">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-white hover:bg-red-600 focus:bg-red-600 rounded"
                    >
                      Log out
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1F2937] border-gray-700 text-gray-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This will log you out of your account and redirect you to the login page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-600 text-gray-200 hover:bg-gray-500">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-500 text-white"
                      >
                        Log out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;