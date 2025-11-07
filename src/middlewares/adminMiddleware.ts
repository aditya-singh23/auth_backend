import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@utils/constants';
import { ApiResponse } from '@interfaces/index';

/**
 * Admin Authorization Middleware
 *
 * This middleware checks if the authenticated user has admin privileges.
 * For now, it uses a simple email-based check, but this should be replaced
 * with a proper role-based system in production.
 */

// Get admin emails from environment variable or use defaults
const getAdminEmails = (): string[] => {
  const envAdmins = process.env.ADMIN_EMAILS;
  if (envAdmins) {
    return envAdmins.split(',').map(email => email.trim());
  }

  // Default admin emails - In production, this should be in database
  return [
    'admin@example.com',
    // Add your email here to get admin access to /users endpoint
    // Example: 'your-email@gmail.com',
  ];
};

const ADMIN_EMAILS = getAdminEmails();

/**
 * Middleware to check if user has admin privileges
 * Must be used after authenticateToken middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    const user = req.user;

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
      return;
    }

    // Check if user email is in admin list
    if (!ADMIN_EMAILS.includes(user.email)) {
      const response: ApiResponse = {
        success: false,
        message: 'Admin access required. This endpoint is restricted to administrators only.',
        data: {
          error: 'INSUFFICIENT_PRIVILEGES',
          userRole: 'user',
          requiredRole: 'admin',
        },
      };
      res.status(HTTP_STATUS.FORBIDDEN).json(response);
      return;
    }

    // User is admin, proceed to next middleware/route handler
    console.log(`✅ Admin access granted to: ${user.email}`);
    next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);

    const response: ApiResponse = {
      success: false,
      message: 'Authorization check failed',
    };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
};

/**
 * Alternative: Check if user is admin (returns boolean)
 * Useful for conditional logic in controllers
 */
export const isAdmin = (userEmail: string): boolean => {
  return ADMIN_EMAILS.includes(userEmail);
};

/**
 * Add admin email to the list (for dynamic admin management)
 * In production, this should modify the database
 */
export const addAdminEmail = (email: string): void => {
  if (!ADMIN_EMAILS.includes(email)) {
    ADMIN_EMAILS.push(email);
    console.log(`✅ Added admin email: ${email}`);
  }
};

/**
 * Remove admin email from the list
 * In production, this should modify the database
 */
export const removeAdminEmail = (email: string): void => {
  const index = ADMIN_EMAILS.indexOf(email);
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    console.log(`✅ Removed admin email: ${email}`);
  }
};

export default requireAdmin;
