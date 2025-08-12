"use client"

import { useState } from "react"
import { SignIn } from "@/components/auth/signin"
import { SignUp } from "@/components/auth/signup"
import { CustomerPlatform } from "@/components/platforms/customer-platform"
import { EndUserPlatform } from "@/components/platforms/enduser-platform"

export default function RentalManagementSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'customer' | 'end-user' | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [showSignUp, setShowSignUp] = useState(false)

  const handleSignIn = (type: 'customer' | 'end-user', data: any) => {
    setUserType(type)
    setUserData(data)
    setIsAuthenticated(true)
    setShowSignUp(false)
  }

  const handleSignUp = (type: 'customer' | 'end-user', data: any) => {
    setUserType(type)
    setUserData(data)
    setIsAuthenticated(true)
    setShowSignUp(false)
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
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
