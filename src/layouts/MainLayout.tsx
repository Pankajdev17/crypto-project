
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/hooks/use-toast';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  // Close sidebar on route change (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar-wrapper');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);
  
  // Handle network connection status
  useEffect(() => {
    const handleOnline = () => {
      toast({
        title: "You're online",
        description: "Your connection has been restored",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      toast({
        title: "You're offline",
        description: "Please check your internet connection",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  return (
    <div className="min-h-screen flex bg-background theme-transition">
      <div id="sidebar-wrapper">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      <div className="flex-1 flex flex-col md:ml-72">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 p-3 xs:p-4 md:p-6 pb-16 overflow-x-hidden">
          <div className="responsive-container">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </div>
        
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/50 md:hidden transition-opacity duration-200 ease-in-out"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MainLayout;
