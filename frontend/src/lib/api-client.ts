/**
 * API Client with automatic token refresh
 * Handles authentication, token refresh, and error handling
 */

import type { ApiErrorResponse, ApiResponse } from '@/types/api';
import { isTokenExpired } from './utils';

/**
 * Custom error class for API errors
 * Provides structured error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API client configuration
 * Base URL and timeout settings
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Token management
 * Access token is stored in memory (not localStorage)
 * Refresh token is stored in HttpOnly cookie by the backend
 */
let accessToken: string | null = null;

/**
 * Sets the access token in memory
 * Called after login or token refresh
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Gets the current access token
 * Returns null if no token is set
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Refreshes the access token using the refresh token cookie
 * This is called automatically when the access token expires
 */
async function refreshAccessToken(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Important: includes HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Refresh failed - clear token and throw error
      setAccessToken(null);
      throw new ApiError('Failed to refresh token', response.status);
    }

    const data: ApiResponse<{ accessToken: string }> = await response.json();
    const newToken = data.data.accessToken;

    // Update token in memory
    setAccessToken(newToken);
    return newToken;
  } catch (error) {
    setAccessToken(null);
    throw error;
  }
}

/**
 * Flag to prevent multiple simultaneous refresh requests
 * Ensures only one refresh happens at a time
 */
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Makes an authenticated request with automatic token refresh
 * If token is expired, automatically refreshes before retrying
 */
async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  // If no token, proceed without authorization header
  // The API will return 401 if authentication is required
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always include cookies for refresh token
  };

  let response = await fetch(url, requestOptions);

  // If 401 and we have a token, it might be expired - try to refresh
  if (response.status === 401 && token) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Handle token refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      try {
        // Wait for refresh to complete
        const newToken = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        // Retry original request with new token
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...requestOptions,
          headers,
        });
      } catch (refreshError) {
        // Refresh failed - clear token and throw
        isRefreshing = false;
        refreshPromise = null;
        setAccessToken(null);
        throw new ApiError('Session expired. Please log in again.', 401);
      }
    } else {
      // Token exists but server returned 401 - invalid token or unauthorized
      setAccessToken(null);
      throw new ApiError('Unauthorized', 401);
    }
  }

  // Handle non-OK responses
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorCode: string | undefined;
    let errors: Record<string, string[]> | undefined;

    try {
      const errorData: any = await response.json();

      // ✅ FastAPI: { detail: "..." } ou { detail: [...] } (validation 422)
      if (typeof errorData?.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        // 422 validation errors
        const first = errorData.detail[0];
        errorMessage = first?.msg || 'Invalid request';
      }
      // ✅ Ton format éventuel: { message, code, errors }
      else if (typeof errorData?.message === 'string') {
        errorMessage = errorData.message;
      }
      // ✅ Ton wrapper éventuel: { data: { message } }
      else if (typeof errorData?.data?.message === 'string') {
        errorMessage = errorData.data.message;
      } else {
        errorMessage = response.statusText || errorMessage;
      }

      errorCode = errorData?.code;
      errors = errorData?.errors;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Bonus UX: message plus clair pour le login
    if (response.status === 401 && errorMessage.toLowerCase().includes('invalid credentials')) {
      errorMessage = 'Email ou mot de passe incorrect.';
    }

    throw new ApiError(errorMessage, response.status, errorCode, errors);
  }


  return response.json();
}

/**
 * Creates a fetch request with timeout
 * Prevents requests from hanging indefinitely
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

/**
 * Main API client function
 * Wrapper around fetch with automatic token refresh and error handling
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    // Use authenticated fetch for all requests
    return await authenticatedFetch<T>(url, {
      ...options,
      method: options.method || 'GET',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors, timeouts, etc.
    if (error instanceof Error) {
      throw new ApiError(error.message, 0);
    }

    throw new ApiError('An unexpected error occurred', 0);
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};