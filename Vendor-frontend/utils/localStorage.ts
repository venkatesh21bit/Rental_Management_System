/**
 * Browser localStorage utility for authentication and app state
 */

// Check if we're in a browser environment
const isClient = typeof window !== 'undefined';

export const authStorage = {
  // Token management
  getToken: (): string | null => {
    if (!isClient) return null;
    return localStorage.getItem('access_token');
  },

  setToken: (token: string): void => {
    if (!isClient) return;
    localStorage.setItem('access_token', token);
  },

  getRefreshToken: (): string | null => {
    if (!isClient) return null;
    return localStorage.getItem('refresh_token');
  },

  setRefreshToken: (token: string): void => {
    if (!isClient) return;
    localStorage.setItem('refresh_token', token);
  },

  // User data management
  getUser: () => {
    if (!isClient) return null;
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  setUser: (userData: any): void => {
    if (!isClient) return;
    localStorage.setItem('user_data', JSON.stringify(userData));
  },

  // Company management
  getCompanyId: (): string | null => {
    if (!isClient) return null;
    return localStorage.getItem('company_id');
  },

  setCompanyId: (companyId: string): void => {
    if (!isClient) return;
    localStorage.setItem('company_id', companyId);
  },

  // Clear all auth data
  clear: (): void => {
    if (!isClient) return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('company_id');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (!isClient) return false;
    const token = localStorage.getItem('access_token');
    return !!token;
  }
};

// Additional utility functions for general localStorage operations
export const storage = {
  get: (key: string): string | null => {
    if (!isClient) return null;
    return localStorage.getItem(key);
  },

  set: (key: string, value: string): void => {
    if (!isClient) return;
    localStorage.setItem(key, value);
  },

  remove: (key: string): void => {
    if (!isClient) return;
    localStorage.removeItem(key);
  },

  clear: (): void => {
    if (!isClient) return;
    localStorage.clear();
  }
};

export default authStorage;
