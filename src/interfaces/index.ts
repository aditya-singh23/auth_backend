// User Interfaces
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  provider?: 'local' | 'google';
  profilePicture?: string;
  emailVerified?: boolean;
  resetOTP?: string;
  otpCreatedAt?: Date;
  otpExpiresAt?: Date;
  passwordUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  provider?: 'local' | 'google';
  profilePicture?: string;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordUpdatedAt?: Date;
}

// Authentication Interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: SafeUser;
    token: string;
  };
  errors?: string[];
}

// JWT Interfaces
export interface JWTPayload {
  userId: number;
  email: string;
  provider?: 'local' | 'google';
}

export interface JWTOptions {
  expiresIn: string;
}

// API Response Interfaces
export interface ApiResponse<T = Record<string, string | number | boolean> | string | number> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// OTP Interfaces
export interface OTPVerificationResult {
  valid: boolean;
  message: string;
}

export interface EmailResult {
  success: boolean;
  otp?: string;
  messageId?: string;
  error?: string;
}

// OAuth Interfaces
export interface GoogleProfile {
  id: string;
  emails?: Array<{ value: string }>;
  displayName: string;
  photos?: Array<{ value: string }>;
}

export interface OAuthUser {
  id: number;
  name: string;
  email: string;
  googleId?: string;
  provider: 'local' | 'google';
  profilePicture?: string;
  emailVerified: boolean;
  createdAt: Date;
}

// Request Extensions
export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

// Validation Interfaces
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Database Interfaces
export interface DatabaseConfig {
  url: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  provider?: 'local' | 'google';
  profilePicture?: string;
  emailVerified?: boolean;
}

// Email Interfaces
export interface EmailConfig {
  service: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user?: string;
    pass?: string;
  };
}

export interface EmailOptions {
  from: {
    name: string;
    address: string;
  };
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Environment Interfaces
export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  SESSION_SECRET: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  EMAIL_SERVICE?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_SECURE?: boolean;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
}

// Middleware Interfaces
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

// Error Interfaces
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
}

// Swagger/OpenAPI Interfaces
export interface SwaggerConfig {
  title: string;
  version: string;
  description: string;
  servers: Array<{
    url: string;
    description: string;
  }>;
}

// Utility Type Helpers
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};
export type Required<T> = {
  [P in keyof T]-?: T[P];
};
