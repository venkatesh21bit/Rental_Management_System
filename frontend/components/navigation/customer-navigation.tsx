"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  User,
  Bell,
  Settings,
  LogOut,
  Package,
  Store,
  Users,
  CreditCard,
  FileText,
  Heart
} from "lucide-react"

interface CustomerNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userData: any
  onSignOut: () => void
}

export function CustomerNavigation({ activeTab, setActiveTab, userData, onSignOut }: CustomerNavigationProps) {
  const navItems = [
    { id: "customer-shop", label: "Browse Products", icon: Store },
    { id: "customer-portal", label: "My Account", icon: User },
    { id: "my-rentals", label: "My Rentals", icon: Package },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "support", label: "Support", icon: FileText }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div>
              <span className="text-xl font-bold text-blue-600">RentalPro</span>
              <div className="text-xs text-gray-500">Customer Portal</div>
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
                  {userData.type} member
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
          
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userData.name?.[0] || 'C'}
          </div>
        </div>
      </div>
    </nav>
  )
}
