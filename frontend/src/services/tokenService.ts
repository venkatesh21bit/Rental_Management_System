import { AuthTokens } from '../types';

const TOKEN_KEY = 'rental_auth_tokens';
const USER_KEY = 'rental_user_data';

class TokenService {
  // Get tokens from localStorage
  getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const tokens = localStorage.getItem(TOKEN_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  // Set tokens in localStorage
  setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  }

  // Clear tokens from localStorage
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Get access token
  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.access || null;
  }

  // Get refresh token
  getRefreshToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.refresh || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    return !!tokens?.access;
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Get token payload
  getTokenPayload(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Check if access token needs refresh
  shouldRefreshToken(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    const payload = this.getTokenPayload(accessToken);
    if (!payload) return false;

    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    
    // Refresh if token expires in less than 5 minutes
    return timeUntilExpiry < 300;
  }

  // Store user data
  setUserData(userData: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  }

  // Get user data
  getUserData(): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Clear all stored data
  clearAll(): void {
    this.clearTokens();
  }
}

export const tokenService = new TokenService();
export default tokenService;
