"use client"

import { useState, useEffect } from "react"
import { SignIn } from "@/components/auth/signin"
import { SignUp } from "@/components/auth/signup"
import { CustomerPlatform } from "@/components/platforms/customer-platform"
import { EndUserPlatform } from "@/components/platforms/enduser-platform"
import { useAuth } from "@/hooks/use-api"

export default function RentalManagementSystem() {
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [userType, setUserType] = useState<'customer' | 'end-user' | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [showSignUp, setShowSignUp] = useState(false)

  // Update user data when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserData(user)
      // Default to customer type for now - you can enhance this logic based on user role
      setUserType('customer')
    } else {
      setUserData(null)
      setUserType(null)
    }
  }, [isAuthenticated, user])

  const handleSignIn = (type: 'customer' | 'end-user', data: any) => {
    setUserType(type)
    setUserData(data)
    setShowSignUp(false)
  }

  const handleSignUp = (type: 'customer' | 'end-user', data: any) => {
    setUserType(type)
    setUserData(data)
    setShowSignUp(false)
  }

  const handleSignOut = async () => {
    await logout()
    setUserType(null)
    setUserData(null)
    setShowSignUp(false)
  }

  const handleShowSignUp = () => {
    setShowSignUp(true)
  }

  const handleBackToSignIn = () => {
    setShowSignUp(false)
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-up page if requested
  if (!isAuthenticated && showSignUp) {
    return <SignUp onSignUp={handleSignUp} onBackToSignIn={handleBackToSignIn} />
  }

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} onShowSignUp={handleShowSignUp} />
  }

  // Show appropriate platform based on user type
  if (userType === 'customer') {
    return <CustomerPlatform userData={userData} onSignOut={handleSignOut} />
  }

  if (userType === 'end-user') {
    return <EndUserPlatform userData={userData} onSignOut={handleSignOut} />
  }

  // Fallback
  return <SignIn onSignIn={handleSignIn} onShowSignUp={handleShowSignUp} />
}
