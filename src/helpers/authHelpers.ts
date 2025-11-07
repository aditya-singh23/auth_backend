import { User, SafeUser } from '@interfaces/index';

/**
 * Authentication Helper Functions
 * Business logic helpers for authentication operations
 */

/**
 * Format user data for API responses (remove sensitive fields)
 */
export const formatUserForResponse = (user: User): SafeUser => {
  const { password, resetOTP, otpCreatedAt, otpExpiresAt, ...safeUser } = user;
  return safeUser;
};

/**
 * Check if user is an admin based on email
 */
export const isAdminUser = (email: string): boolean => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [
    'admin@example.com',
    'superuser@example.com',
  ];
  return adminEmails.includes(email.toLowerCase());
};

/**
 * Generate a secure random OTP
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
};

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password should contain uppercase letters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password should contain lowercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Password should contain numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Password should contain special characters');

  return {
    isValid: score >= 3,
    score,
    feedback,
  };
};
