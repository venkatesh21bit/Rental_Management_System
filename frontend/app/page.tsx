"use client"

import { useState, useEffect } from "react"
import { SignIn } from "@/components/auth/signin"
import { SignUp } from "@/components/auth/signup"
import { CustomerPlatform } from "@/components/platforms/customer-platform"
import { EndUserPlatform } from "@/components/platforms/enduser-platform"
import { useAuth } from "@/hooks/use-api"

export default function RentalManagementSystem() {
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [showSignUp, setShowSignUp] = useState(false)

  // Update user data when authentication state changes
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user: !!user, isLoading })
  }, [isAuthenticated, user, isLoading])

  const handleSignIn = (type: 'customer' | 'end-user', data: any) => {
    console.log('handleSignIn called but not needed - useAuth handles state')
    setShowSignUp(false)
  }

  const handleSignUp = (type: 'customer' | 'end-user', data: any) => {
    console.log('handleSignUp called but not needed - useAuth handles state') 
    setShowSignUp(false)
  }

  const handleSignOut = async () => {
    await logout()
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
  if (isAuthenticated && user) {
    // Default to customer platform for now - you can enhance this based on user.profile.role
    return <CustomerPlatform userData={user} onSignOut={handleSignOut} />
  }

  // Fallback
  return <SignIn onSignIn={handleSignIn} onShowSignUp={handleShowSignUp} />
}
