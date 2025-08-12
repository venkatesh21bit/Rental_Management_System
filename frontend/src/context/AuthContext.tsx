'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens, ApiResponse } from '../types';
import { authService } from '../services/authService';
import { tokenService } from '../services/tokenService';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  login: (email: string, password: string, user_type?: 'CUSTOMER' | 'BUSINESS') => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedTokens = tokenService.getTokens();
      if (storedTokens?.access) {
        setTokens(storedTokens);
        
        // Verify token and get user data
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Token might be invalid, try to refresh
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, user_type?: 'CUSTOMER' | 'BUSINESS'): Promise<void> => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password, user_type });
      
      if (response.success && response.data) {
        const { user: userData, tokens: userTokens } = response.data;
        setUser(userData);
        setTokens(userTokens);
        tokenService.setTokens(userTokens);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        const { user: newUser, tokens: userTokens } = response.data;
        setUser(newUser);
        setTokens(userTokens);
        tokenService.setTokens(userTokens);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setTokens(null);
    tokenService.clearTokens();
    
    // Call logout API to invalidate server-side session
    authService.logout().catch(console.error);
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const storedTokens = tokenService.getTokens();
      if (!storedTokens?.refresh) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(storedTokens.refresh);
      
      if (response.success && response.data) {
        const newTokens = {
          access: response.data.access,
          refresh: storedTokens.refresh,
        };
        setTokens(newTokens);
        tokenService.setTokens(newTokens);
        
        // Get updated user data
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
