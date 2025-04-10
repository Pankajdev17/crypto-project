import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Bitcoin,
  Home,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
  },
  {
    title: 'Market',
    href: '/market',
    icon: BarChart3,
  },
  {
    title: 'Portfolio',
    href: '/portfolio',
    icon: Wallet,
  },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };
  
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r bg-sidebar text-sidebar-foreground',
        'transform transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Bitcoin className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">CryptoBeacon</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => onClose()}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive(link.href) && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.title}
            </Link>
          ))}
        </nav>
        
        <div className="mt-4 px-2">
          <h3 className="px-4 text-xs font-medium text-sidebar-foreground/60 uppercase">Trending</h3>
          <div className="mt-2 grid gap-1">
            <Link
              to="/crypto/bitcoin"
              onClick={() => onClose()}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Bitcoin className="h-5 w-5" />
              Bitcoin
            </Link>
            <Link
              to="/crypto/ethereum"
              onClick={() => onClose()}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L5 12L12 16L19 12L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 13L12 17L19 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 18L12 22L19 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ethereum
            </Link>
            <Link
              to="/crypto/solana"
              onClick={() => onClose()}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 6H19L5 18H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Solana
            </Link>
          </div>
        </div>
      </ScrollArea>
      
      <div className="mt-auto py-4 px-2">
        <Link
          to="/settings"
          onClick={() => onClose()}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
