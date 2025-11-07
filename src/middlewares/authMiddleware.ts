import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, SafeUser, ApiResponse } from '@interfaces/index';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@utils/constants';
import appSettings from '@config/settings';

// Note: We rely on Passport's user declaration on Request
// and cast it to SafeUser when needed

/**
 * Middleware to authenticate JWT tokens
 * Verifies the token and attaches user information to the request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.ACCESS_DENIED,
        error: 'No token provided',
      };
      res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, appSettings.jwt.secret) as JWTPayload;

    // Create user object from token payload
    const user: SafeUser = {
      id: decoded.userId,
      email: decoded.email,
      name: '', // Will be populated from database if needed
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: decoded.provider || 'local',
    };

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    let errorMessage: string = RESPONSE_MESSAGES.INVALID_TOKEN;

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Token has expired';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid token format';
    }

    const response: ApiResponse = {
      success: false,
      message: RESPONSE_MESSAGES.ACCESS_DENIED,
      error: errorMessage,
    };

    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, appSettings.jwt.secret) as JWTPayload;

      const user: SafeUser = {
        id: decoded.userId,
        email: decoded.email,
        name: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        provider: decoded.provider || 'local',
      };

      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't block on invalid tokens
    next();
  }
};

/**
 * Middleware to check if user has specific role/permission
 * Currently just checks if user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      message: RESPONSE_MESSAGES.ACCESS_DENIED,
      error: 'Authentication required',
    };
    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
    return;
  }

  next();
};

/**
 * Utility function to generate JWT token
 */
export const generateToken = (payload: JWTPayload, expiresIn?: string | number): string => {
  return jwt.sign(payload, appSettings.jwt.secret, {
    expiresIn: expiresIn || appSettings.jwt.expiresIn,
  } as jwt.SignOptions);
};

/**
 * Utility function to verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, appSettings.jwt.secret) as JWTPayload;
};
