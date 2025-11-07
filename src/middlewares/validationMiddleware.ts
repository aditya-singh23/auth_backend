import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '@interfaces/index';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@utils/constants';

/**
 * Generic validation middleware factory
 * Creates middleware that validates request data against a Joi schema
 */
export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow unknown properties
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.VALIDATION_ERROR,
        errors: error.details.map(detail => detail.message),
      };

      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    // Replace the original data with validated/sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Validation schemas for authentication endpoints
 */
export const authValidationSchemas = {
  signup: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 50 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    otp: Joi.string()
      .length(6)
      .pattern(/^[0-9]+$/)
      .required()
      .messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only numbers',
        'any.required': 'OTP is required',
      }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'New password is required',
    }),
  }),
};

/**
 * Pre-configured validation middlewares for common use cases
 */
export const validateSignup = validate(authValidationSchemas.signup);
export const validateLogin = validate(authValidationSchemas.login);
export const validateForgotPassword = validate(authValidationSchemas.forgotPassword);
export const validateResetPassword = validate(authValidationSchemas.resetPassword);

/**
 * Custom validation functions
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateOTP = (otp: string): boolean => {
  const otpRegex = /^[0-9]{6}$/;
  return otpRegex.test(otp);
};

/**
 * Sanitization functions
 */
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }

    const clientRequests = requests.get(clientId);

    if (!clientRequests) {
      requests.set(clientId, { count: 1, resetTime: now });
      next();
      return;
    }

    if (clientRequests.count >= maxRequests) {
      const response: ApiResponse = {
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'Rate limit exceeded',
      };

      res.status(429).json(response);
      return;
    }

    clientRequests.count++;
    next();
  };
};
