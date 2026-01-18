/**
 * Authentication API endpoints
 * API functions for authentication operations
 */

import { api, setAccessToken } from '@/lib/api-client';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  EmailVerificationRequest,
  AuthTokens,
  RefreshTokenResponse,
} from '@/types/auth';
import type { ApiResponse } from '@/types/api';

/**
 * Login endpoint
 * Authenticates user and returns access token
 * Refresh token is set in HttpOnly cookie by backend
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/login', credentials);

  // Store access token in memory
  setAccessToken(response.data.accessToken);

  return response.data;
}

/**
 * Register endpoint
 * Creates a new user account
 * User needs to verify email before full access
 */
export async function register(
  credentials: RegisterCredentials
): Promise<{ message: string; email: string }> {
  const response = await api.post<{ message: string; email: string }>(
    '/auth/register',
    {
      email: credentials.email,
      password: credentials.password,
    }
  );

  return response.data;
}

/**
 * Email verification endpoint
 * Verifies email with 4-digit code
 * Returns access token after successful verification
 */
export async function verifyEmail(
  request: EmailVerificationRequest
): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/auth/verify-email', request);

  // Store access token in memory
  setAccessToken(response.data.accessToken);

  return response.data;
}

/**
 * Get current user endpoint
 * Fetches authenticated user information
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

/**
 * Logout endpoint
 * Invalidates refresh token on server
 * Clears access token from memory
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Even if logout fails, clear local state
    console.error('Logout error:', error);
  } finally {
    // Always clear token, regardless of API response
    setAccessToken(null);
  }
}

/**
 * Refresh token endpoint
 * Called automatically by API client when access token expires
 * This is exported for manual use if needed
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const response = await api.post<RefreshTokenResponse>('/auth/refresh');
  setAccessToken(response.data.accessToken);
  return response.data;
}