// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Response Messages
export const RESPONSE_MESSAGES = {
  // Success Messages
  SUCCESS: 'Operation completed successfully',
  USER_CREATED: 'Account created successfully!',
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  PASSWORD_RESET_SUCCESS:
    'Password has been reset successfully! You can now login with your new password.',
  OTP_SENT: 'If an account with this email exists, you will receive a password reset OTP shortly.',
  USERS_RETRIEVED: 'Users retrieved successfully',

  // Error Messages
  VALIDATION_ERROR: 'Please check your input',
  INVALID_CREDENTIALS: 'Email or password is wrong',
  USER_EXISTS: 'A user with this email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  ACCESS_DENIED: 'Access denied',
  SERVER_ERROR: 'Something went wrong. Please try again.',

  // OTP Messages
  OTP_INVALID: 'Invalid OTP code. Please check and try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  OTP_NOT_FOUND: 'No OTP found. Please request a new one.',
  OTP_VERIFIED: 'OTP verified successfully',

  // OAuth Messages
  OAUTH_SUCCESS: 'OAuth authentication successful',
  OAUTH_FAILED: 'OAuth authentication failed',
  OAUTH_CALLBACK_FAILED: 'OAuth callback failed',

  // Email Messages
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again.',
  EMAIL_CONFIG_ERROR: 'Email service configuration error',
} as const;

// Validation Constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  OTP_LENGTH: 6,
  OTP_EXPIRATION_MINUTES: 10,
} as const;

// JWT Constants
export const JWT = {
  DEFAULT_EXPIRATION: '24h',
  OAUTH_EXPIRATION: '7d',
  REFRESH_EXPIRATION: '30d',
} as const;

// Database Constants
export const DATABASE = {
  SALT_ROUNDS: 10,
} as const;

// Rate Limiting Constants
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5, // More restrictive for auth endpoints
} as const;

// Email Constants
export const EMAIL = {
  DEFAULT_SERVICE: 'gmail',
  DEFAULT_HOST: 'smtp.gmail.com',
  DEFAULT_PORT: 587,
  DEFAULT_SECURE: false,
} as const;

// OAuth Constants
export const OAUTH = {
  GOOGLE_SCOPE: ['profile', 'email'],
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Environment Constants
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: '/api/auth',
  USERS: '/api/auth/users',
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  GOOGLE_OAUTH: '/api/auth/google',
  GOOGLE_CALLBACK: '/api/auth/google/callback',
  GOOGLE_SUCCESS: '/api/auth/google/success',
  OAUTH_STATUS: '/api/auth/oauth/status',
} as const;

// File Paths
export const FILE_PATHS = {
  USERS_JSON: './data/users.json',
  DATA_DIR: './data',
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  OTP: /^[0-9]{6}$/,
  PASSWORD: /^.{6,}$/, // At least 6 characters
} as const;

// Default Values
export const DEFAULTS = {
  PORT: 5000,
  FRONTEND_URL: 'http://localhost:3000',
  JWT_SECRET: 'fallback-jwt-secret-change-in-production',
  SESSION_SECRET: 'fallback-session-secret',
} as const;
