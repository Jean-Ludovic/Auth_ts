/**
 * API response types
 * Standard response structures for API calls
 */

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}