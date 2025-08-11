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
    { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart3 },
    { id: "end-user-portal", label: "Admin Portal", icon: Shield }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Building className="h-8 w-8 text-indigo-600" />
            <div>
              <span className="text-xl font-bold text-indigo-600">RentalPro</span>
              <div className="text-xs text-gray-500">Admin Dashboard</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(item.id)}
                  className="relative"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-medium">{userData.name}</div>
              <div className="text-xs text-gray-500">
                <Badge variant="secondary" className="text-xs">
                  {userData.role} • {userData.employeeId}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
          
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userData.name?.[0] || 'A'}
          </div>
        </div>
      </div>
    </nav>
  )
}
