
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, BarChart2, History } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-ios-background">
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
