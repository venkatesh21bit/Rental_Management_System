'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  User,
  ShoppingCart,
  Bell,
  Search,
  Heart,
  Package,
  FileText
} from 'lucide-react';

interface HeaderProps {
  variant?: 'customer' | 'end-user' | 'public';
}

export const Header = ({ variant = 'public' }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const customerNavLinks = [
    { name: 'Dashboard', href: '/customer/dashboard', icon: Package },
    { name: 'Browse Products', href: '/customer/browse', icon: Search },
    { name: 'My Orders', href: '/customer/orders', icon: FileText },
    { name: 'Wishlist', href: '/customer/wishlist', icon: Heart },
  ];

  const endUserNavLinks = [
    { name: 'Admin Dashboard', href: '/admin', icon: Package },
    { name: 'Manage Products', href: '/admin/products', icon: Search },
    { name: 'Orders & Rentals', href: '/admin/orders', icon: FileText },
    { name: 'Customers', href: '/admin/customers', icon: User },
    { name: 'Reports', href: '/admin/reports', icon: Bell },
  ];

  const getNavigationLinks = () => {
    if (!isAuthenticated) return endUserNavLinks;
    
    switch (variant) {
      case 'customer':
        return customerNavLinks;
      case 'end-user':
        return endUserNavLinks;
      default:
        return endUserNavLinks;
    }
  };

  const navLinks = getNavigationLinks();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">RentEase</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {user?.first_name || 'User'}
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 invisible group-hover:visible">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
              
              {/* Mobile auth buttons */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center px-3">
                      <User className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {user?.first_name || 'User'}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Link
                        href="/profile"
                        className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Link
                      href="/auth/login"
                      className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
