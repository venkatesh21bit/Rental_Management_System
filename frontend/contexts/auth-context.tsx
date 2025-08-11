'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '../hooks/use-toast';
import { apiService, User, AuthResponse, RegisterData, LoginData } from '@/lib/api-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, uid: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Verify token is still valid by fetching profile
          try {
            const profile = await apiService.profile.getMe();
            setUser(profile);
          } catch (error) {
            // Token is invalid, clear auth data
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      const response = await apiService.auth.login(data);
      
      // Handle the actual API response structure
      // API returns { user, token, refresh_token }
      const { user, token, refresh_token } = response;
      
      // Store tokens and user data
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      toast({ title: "Success", description: "Successfully logged in!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Login failed" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await apiService.auth.register(data);
      
      // Handle the actual API response structure
      // API returns { user, token, refresh_token }
      const { user, token, refresh_token } = response;
      
      // Store tokens and user data
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      toast({ title: "Success", description: "Account created successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Registration failed" });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    toast({ title: "Success", description: "Successfully logged out" });
  };

  const forgotPassword = async (email: string) => {
    try {
      await apiService.auth.forgotPassword(email);
      toast({ title: "Success", description: "Password reset email sent! Check your inbox." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reset email" });
      throw error;
    }
  };

  const resetPassword = async (token: string, uid: string, newPassword: string) => {
    try {
      await apiService.auth.resetPassword({ token, uid, new_password: newPassword });
      toast({ title: "Success", description: "Password reset successfully! You can now log in." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Password reset failed" });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
