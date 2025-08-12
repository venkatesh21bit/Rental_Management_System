'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Button from '../../components/ui/Button';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  ShoppingCartIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  variant?: 'customer' | 'end-user' | 'public';
}

export default function Header({ variant = 'public' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const customerNavLinks = [
    { href: '/customer/dashboard', label: 'Dashboard' },
    { href: '/customer/browse', label: 'Browse Products' },
    { href: '/customer/orders', label: 'My Orders' },
    { href: '/customer/wishlist', label: 'Wishlist' },
  ];

  const endUserNavLinks = [
    { href: '/end-user/dashboard', label: 'Dashboard' },
    { href: '/end-user/products', label: 'Products' },
    { href: '/end-user/orders', label: 'Orders' },
    { href: '/end-user/customers', label: 'Customers' },
    { href: '/end-user/deliveries', label: 'Deliveries' },
    { href: '/end-user/reports', label: 'Reports' },
  ];

  const getNavLinks = () => {
    switch (variant) {
      case 'customer':
        return customerNavLinks;
      case 'end-user':
        return endUserNavLinks;
      default:
        return [];
    }
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RentalMS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {variant !== 'public' && (
            <nav className="hidden md:flex space-x-8">
              {getNavLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Search Bar (for customer) */}
          {variant === 'customer' && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Cart (customer only) */}
                {variant === 'customer' && (
                  <Link href="/customer/cart" className="relative p-2 text-gray-600 hover:text-blue-600">
                    <ShoppingCartIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      3
                    </span>
                  </Link>
                )}

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-blue-600">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="hidden md:inline text-sm font-medium">
                      {user.first_name || user.email}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href={`/${variant}/profile`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {variant !== 'public' && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-blue-600"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && variant !== 'public' && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {getNavLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
