'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TruckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HeartIcon,
  CreditCardIcon,
  DocumentTextIcon,
  BellIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  variant: 'customer' | 'end-user';
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

const customerNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: HomeIcon },
  { name: 'Browse Products', href: '/customer/browse', icon: BuildingStorefrontIcon },
  { name: 'My Orders', href: '/customer/orders', icon: ClipboardDocumentListIcon },
  { name: 'Wishlist', href: '/customer/wishlist', icon: HeartIcon, badge: 5 },
  { name: 'Delivery Tracking', href: '/customer/deliveries', icon: TruckIcon },
  { name: 'Payment History', href: '/customer/payments', icon: CreditCardIcon },
  { name: 'Invoices', href: '/customer/invoices', icon: DocumentTextIcon },
  { name: 'Notifications', href: '/customer/notifications', icon: BellIcon, badge: 3 },
  { name: 'Profile Settings', href: '/customer/profile', icon: Cog6ToothIcon },
];

const endUserNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/end-user/dashboard', icon: HomeIcon },
  { name: 'Product Management', href: '/end-user/products', icon: ArchiveBoxIcon },
  { name: 'Order Management', href: '/end-user/orders', icon: ClipboardDocumentListIcon, badge: 12 },
  { name: 'Customer Management', href: '/end-user/customers', icon: UserGroupIcon },
  { name: 'Delivery Management', href: '/end-user/deliveries', icon: TruckIcon },
  { name: 'Inventory Control', href: '/end-user/inventory', icon: TagIcon },
  { name: 'Pricing & Discounts', href: '/end-user/pricing', icon: TagIcon },
  { name: 'Scheduling', href: '/end-user/schedule', icon: CalendarIcon },
  { name: 'Reports & Analytics', href: '/end-user/reports', icon: ChartBarIcon },
  { name: 'System Settings', href: '/end-user/settings', icon: Cog6ToothIcon },
];

export default function Sidebar({ variant }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = variant === 'customer' ? customerNavItems : endUserNavItems;

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="h-full flex flex-col">
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="flex-shrink-0 h-5 w-5" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 font-medium mb-2">
                {variant === 'customer' ? 'Need Help?' : 'System Status'}
              </p>
              <Link
                href={variant === 'customer' ? '/customer/support' : '/end-user/support'}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {variant === 'customer' ? 'Contact Support' : 'System Health'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
