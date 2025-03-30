
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, BarChart2, History, Layers, LogOut } from 'lucide-react';
import { logout } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
    navigate('/login');
  };
  
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-ios-background">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Time Savor</h1>
        <button 
          onClick={handleLogout}
          className="text-ios-gray flex items-center text-sm"
        >
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </button>
      </header>
      <main className="flex-grow overflow-y-auto p-4">
        {children}
      </main>
      <nav className="ios-card flex justify-around py-2 px-4 bg-white">
        <Link 
          to="/" 
          className={`p-2 flex flex-col items-center ${isActive('/') ? 'text-ios-blue' : 'text-ios-gray'}`}
        >
          <Clock className="h-6 w-6" />
          <span className="text-xs mt-1">Timer</span>
        </Link>
        <Link 
          to="/habits" 
          className={`p-2 flex flex-col items-center ${isActive('/habits') ? 'text-ios-blue' : 'text-ios-gray'}`}
        >
          <Layers className="h-6 w-6" />
          <span className="text-xs mt-1">Habits</span>
        </Link>
        <Link 
          to="/stats" 
          className={`p-2 flex flex-col items-center ${isActive('/stats') ? 'text-ios-blue' : 'text-ios-gray'}`}
        >
          <BarChart2 className="h-6 w-6" />
          <span className="text-xs mt-1">Stats</span>
        </Link>
        <Link 
          to="/history" 
          className={`p-2 flex flex-col items-center ${isActive('/history') ? 'text-ios-blue' : 'text-ios-gray'}`}
        >
          <History className="h-6 w-6" />
          <span className="text-xs mt-1">History</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
