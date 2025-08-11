"use client"

import { useState } from "react"
import { SignIn } from "@/components/auth/signin"
import { CustomerPlatform } from "@/components/platforms/customer-platform"
import { EndUserPlatform } from "@/components/platforms/enduser-platform"

export default function RentalManagementSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'customer' | 'end-user' | null>(null)
  const [userData, setUserData] = useState<any>(null)

  const handleSignIn = (type: 'customer' | 'end-user', data: any) => {
    setUserType(type)
    setUserData(data)
    setIsAuthenticated(true)
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setUserType(null)
    setUserData(null)
  }

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />
  }

  // Show appropriate platform based on user type
  if (userType === 'customer') {
    return <CustomerPlatform userData={userData} onSignOut={handleSignOut} />
  }

  if (userType === 'end-user') {
    return <EndUserPlatform userData={userData} onSignOut={handleSignOut} />
  }

  // Fallback
  return <SignIn onSignIn={handleSignIn} />
}
