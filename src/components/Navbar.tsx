
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bitcoin, Menu, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/crypto/${searchValue.toLowerCase()}`);
      setSearchValue('');
    }
  };
  
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Bitcoin className="h-6 w-6 text-primary" />
          <Link to="/" className="font-semibold text-lg">
            CryptoBeacon
          </Link>
        </div>
        
        {!isMobile && (
          <div className="flex-1 ml-4">
            <form onSubmit={handleSearch} className="max-w-sm">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cryptocurrencies..."
                  className="w-full rounded-full pl-8 bg-muted/40"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </form>
          </div>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          <Link to="/market">
            <Button variant="ghost" size="sm">
              Market
            </Button>
          </Link>
          <Link to="/portfolio">
            <Button variant="ghost" size="sm">
              Portfolio
            </Button>
          </Link>
          <ThemeToggle />
          {isMobile ? (
            <Button size="icon" variant="ghost" onClick={() => {
              const searchField = document.createElement('input');
              searchField.type = 'text';
              searchField.placeholder = 'Search crypto...';
              searchField.className = 'p-2 border rounded';
              searchField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                  const value = searchField.value;
                  if (value.trim()) {
                    navigate(`/crypto/${value.toLowerCase()}`);
                  }
                  document.body.removeChild(searchField);
                }
              });
              searchField.style.position = 'absolute';
              searchField.style.top = '60px';
              searchField.style.left = '0';
              searchField.style.right = '0';
              searchField.style.margin = '0 auto';
              searchField.style.width = '90%';
              searchField.style.zIndex = '100';
              document.body.appendChild(searchField);
              searchField.focus();
            }}>
              <Search className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="default" size="sm">
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
