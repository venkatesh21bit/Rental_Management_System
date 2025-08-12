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
import { API_URL } from "@/utils/auth_fn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome } from "lucide-react";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("enduser");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔄 Attempting login with API URL:", API_URL);
      
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      });

      console.log("🔄 Fetch response status:", response.status);

      // Check if it's a CORS error
      if (response.type === 'opaque' || response.type === 'opaqueredirect') {
        throw new Error('CORS_ERROR');
      }

      const data = await response.json();
      console.log("🟢 API Response:", data);

      if (!response.ok) {
        console.error("❌ Login failed:", data);
        setError(data.error?.message || data.detail || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      if (data.success && data.data && data.data.token) {
        console.log("✅ Login Successful!");
        localStorage.setItem("access_token", data.data.token);
        localStorage.setItem("refresh_token", data.data.refresh_token);
        
        setSuccessMessage("Login successful! Redirecting...");
        setError(""); // Clear any existing errors
        
        // Fetch user's company
        try {
          const companyRes = await fetch(`${API_URL}/company/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.data.token}`,
            },
          });
          if (companyRes.ok) {
            const companies = await companyRes.json();
            // If only one company, store its id
            if (Array.isArray(companies) && companies.length > 0) {
              localStorage.setItem("company_id", companies[0].id);
            }
          }
        } catch (companyError) {
          console.warn("Could not fetch company data:", companyError);
        }

        setTimeout(() => {
          if (role === "enduser") {
            router.replace("/end-user");
          } else if (role === "customer") {
            router.replace("/retailer");
          }
        }, 1500);
      } else {
        console.error("❌ Unexpected response format:", data);
        setError("Unexpected error. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("🚨 Fetch Error:", err);
      setIsLoading(false);
      
      if (err instanceof Error && err.message === 'CORS_ERROR') {
        setError("CORS error: The server is not allowing requests from this origin. Please contact support.");
      } else if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to server. This might be a CORS issue or network problem. Please try again.");
      } else {
        setError("Server error occurred. Please try again.");
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-black text-white border border-white-300 w-full md:w-96">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription className="text-gray-400 border-b border-gray-600 pb-2">
            Enter your email below to login to your account
          </CardDescription>
          <div className="bg-green-900/20 border border-green-600 rounded-md p-2 mt-2">
            <p className="text-green-400 text-xs text-center">
              🌐 Connected to: Production Server
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="bg-gray-900 text-white border border-gray-700"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm text-blue-400 underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="bg-gray-900 text-white border-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Select Role</Label>
                <select
                  id="role"
                  className="bg-gray-900 text-white border border-gray-700 p-2 rounded"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="enduser">End User Group</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                Login with Google
                <Chrome className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/authentication/signup"
                className="text-blue-400 underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
