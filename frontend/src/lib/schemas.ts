/**
 * Zod validation schemas
 * Centralized validation schemas for forms and API data
 */

import { z } from 'zod';

/**
 * Email validation schema
 * Ensures proper email format
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

/**
 * Password validation schema
 * Minimum 8 characters, at least one uppercase, one lowercase, and one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form schema
 * Includes password confirmation validation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Email verification schema
 * 4-digit code validation
 */
export const emailVerificationSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .min(4, 'Code must be 4 digits')
    .max(4, 'Code must be 4 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;