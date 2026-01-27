/**
 * Authentication-related types
 * Centralized type definitions for the authentication system
 */

export interface User {
  id: string;
  email: string;
  username: string;          // ✅ AJOUT
  emailVerified: boolean;
  createdAt: string;

  role?: 'user' | 'admin';   
}


export interface AuthTokens {
  accessToken: string;
  // Refresh token is stored in HttpOnly cookie, not in client memory
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}