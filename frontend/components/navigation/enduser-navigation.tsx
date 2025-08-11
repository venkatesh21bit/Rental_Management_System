"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  DollarSign,
  BarChart3,
  User,
  Bell,
  Settings,
  Users,
  Building,
  LogOut,
  Shield
} from "lucide-react"

interface EndUserNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userData: any
  onSignOut: () => void
}

export function EndUserNavigation({ activeTab, setActiveTab, userData, onSignOut }: EndUserNavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "product-management", label: "Product Management", icon: Package },
    { id: "order-management", label: "Order Management", icon: ShoppingBag },
    { id: "customer-management", label: "Customer Management", icon: Users },
    { id: "pricing-management", label: "Pricing Management", icon: DollarSign },
    { id: "delivery-management", label: "Delivery Management", icon: Truck },
    { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart3 }
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-50">
      {/* Logo/Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
        <Building className="h-8 w-8 text-indigo-600" />
        <div>
          <span className="text-xl font-bold text-indigo-600">RentalPro</span>
          <div className="text-xs text-gray-500">End User Dashboard</div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                onClick={() => setActiveTab(item.id)}
                className="w-full justify-start"
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userData.name?.[0] || 'E'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userData.name}</div>
            <div className="text-xs text-gray-500">End User</div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
