"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/utils/auth_fn";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    company_name: "",
    customer_type: "individual",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setMessage("");

  // Ensure all required fields are filled
  if (!formData.username || !formData.first_name || !formData.email || !formData.password || !formData.password_confirm || 
      !formData.phone || !formData.address || !formData.city || !formData.state || !formData.postal_code) {
    setError("All required fields must be filled.");
    return;
  }

  // Check password length
  if (formData.password.length < 8) {
    setError("Password must be at least 8 characters long.");
    return;
  }

  // Check if passwords match
  if (formData.password !== formData.password_confirm) {
    setError("Passwords do not match.");
    return;
  }

  try {
    setIsLoading(true);
    setMessage("Creating your account...");
    
    const requestData = {
      username: formData.username,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name || "",
      password: formData.password,
      password_confirm: formData.password_confirm,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      country: formData.country,
      company_name: formData.company_name || "",
      customer_type: formData.customer_type,
    };

    console.log("Sending registration request:", requestData);

    let data;
    let response;

    try {
      // Try to call the real API
      response = await fetch(`${API_URL}/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      data = await response.json();
      console.log("Registration response:", { status: response.status, data });
    } catch (apiError) {
      console.error("API error:", apiError);
      throw new Error("Unable to connect to server. Please try again later.");
    }

    if (response.ok) {
      // Handle successful registration
      if (data.success && data.data && data.data.token) {
        localStorage.setItem("access_token", data.data.token);
        localStorage.setItem("refresh_token", data.data.refresh_token);
        
        setMessage("Account created successfully! Redirecting...");
        
        // Redirect based on customer type
        setTimeout(() => {
          setIsLoading(false);
          if (formData.customer_type === "corporate") {
            router.replace("/manufacturer/company?first=true");
          } else {
            router.replace("/retailer"); // Default redirect for individual customers
          }
        }, 1500);
      } else {
        setError("Registration successful but token not received. Please try logging in.");
      }
    } else {
      // Handle error responses
      setMessage("");
      setIsLoading(false);
      
      if (data.error && data.error.details) {
        // Handle detailed validation errors
        const details = data.error.details;
        const errorMessages: string[] = [];
        
        // Collect all field errors
        Object.keys(details).forEach(field => {
          if (Array.isArray(details[field])) {
            details[field].forEach((msg: string) => {
              errorMessages.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`);
            });
          } else {
            errorMessages.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${details[field]}`);
          }
        });
        
        setError(errorMessages.join(". "));
      } else if (data.error && data.error.message) {
        setError(data.error.message);
      } else if (data.detail) {
        setError(data.detail);
      } else if (data.message) {
        setError(data.message);
      } else {
        // Handle common HTTP status codes
        switch (response.status) {
          case 400:
            setError("Invalid data provided. Please check your input and try again.");
            break;
          case 409:
            setError("Username or email already exists. Please choose different ones.");
            break;
          case 500:
            setError("Server error occurred. Please try again later.");
            break;
          default:
            setError(`Registration failed with status ${response.status}. Please try again.`);
        }
      }
    }
  } catch (err) {
    setMessage("");
    setIsLoading(false);
    console.error("Registration error:", err);
    
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    
    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      setError("Network error: Unable to connect to server. Please check your internet connection and try again.");
    } else {
      setError(errorMessage);
    }
  }
};

  return (
    <div className={cn("flex flex-col gap-6 items-center justify-center min-h-screen bg-black p-4")}>
      <Card className="bg-gray-900 text-white border border-gray-700 w-full max-w-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Join our rental management platform
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    type="text"
                    placeholder="Enter your first name"
                    required
                    className="bg-gray-800 text-white border border-gray-600"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    placeholder="Enter your last name"
                    className="bg-gray-800 text-white border border-gray-600"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Create a unique username"
                  required
                  className="bg-gray-800 text-white border border-gray-600"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  className="bg-gray-800 text-white border border-gray-600"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  required
                  className="bg-gray-800 text-white border border-gray-600"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password (min 8 chars)"
                    required
                    className="bg-gray-800 text-white border border-gray-600"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password_confirm">Confirm Password *</Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    placeholder="Confirm your password"
                    required
                    className="bg-gray-800 text-white border border-gray-600"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter your full address"
                  required
                  className="bg-gray-800 text-white border border-gray-600"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="City"
                    required
                    className="bg-gray-800 text-white border border-gray-600"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="State"
                    required
                    className="bg-gray-800 text-white border border-gray-600"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    type="text"
                    placeholder="Postal Code"
                    required
                    className="bg-gray-800 text-white border border-gray-600"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Country"
                  className="bg-gray-800 text-white border border-gray-600"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>

              {/* Customer Type */}
              <div className="grid gap-2">
                <Label htmlFor="customer_type">Customer Type</Label>
                <select
                  id="customer_type"
                  name="customer_type"
                  className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2"
                  value={formData.customer_type}
                  onChange={handleInputChange}
                >
                  <option value="individual">Individual</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              {/* Company Name (conditional) */}
              {formData.customer_type === "corporate" && (
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="Enter company name"
                    className="bg-gray-800 text-white border border-gray-600"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
            
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/authentication"
                className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
              >
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpPage;