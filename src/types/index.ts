/**
 * Custom TypeScript Types
 * Additional type definitions for the application
 */

// Environment types
export type NodeEnvironment = 'development' | 'production' | 'test';

// Authentication provider types
export type AuthProvider = 'local' | 'google';

// User role types (for future role-based access control)
export type UserRole = 'user' | 'admin' | 'moderator';

// API response status types
export type ApiStatus = 'success' | 'error' | 'warning' | 'info';

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request context types
export interface RequestContext {
  userId?: number;
  userEmail?: string;
  userRole?: UserRole;
  requestId: string;
  timestamp: Date;
}

// Email template types
export type EmailTemplate =
  | 'welcome'
  | 'password-reset'
  | 'email-verification'
  | 'account-locked'
  | 'login-alert';

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Database query types
export interface QueryOptions {
  select?: string[];
  where?: Record<string, string | number | boolean | Date | null>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: string[];
  limit?: number;
  offset?: number;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: string | number | boolean;
}

// JWT payload extension
export interface ExtendedJWTPayload {
  userId: number;
  email: string;
  provider: AuthProvider;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

// Express Request extension for typed user
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }

    interface User {
      id: number;
      email: string;
      name: string;
      provider: AuthProvider | null;
      role?: UserRole;
      profilePicture?: string;
      emailVerified?: boolean;
      createdAt?: string;
      updatedAt?: string;
    }
  }
}
