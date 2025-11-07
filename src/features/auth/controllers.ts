import { Request, Response } from 'express';
import AuthService from './services';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@utils/constants';
import { ApiResponse } from '@interfaces/index';
import {
  RegisterRequest,
  AuthRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './interfaces';

/**
 * Authentication Controllers
 * Handle HTTP requests and responses for authentication endpoints
 */
class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Handle user registration
   */
  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: RegisterRequest = req.body;
      const result = await this.authService.register(userData);

      const statusCode = result.success ? HTTP_STATUS.CREATED : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Signup controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Handle user login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: AuthRequest = req.body;
      const result = await this.authService.login(loginData);

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.UNAUTHORIZED;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Login controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Handle forgot password request
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email }: ForgotPasswordRequest = req.body;
      const result = await this.authService.forgotPassword({ email });

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Forgot password controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Handle password reset with OTP
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const resetData: ResetPasswordRequest = req.body;
      const result = await this.authService.resetPassword(resetData);

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Reset password controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Get all users (for testing/admin purposes)
   */
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.getAllUsers();

      const statusCode = result.success ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json(result);
    } catch (error) {
      console.error('Get users controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Check if email exists
   */
  checkEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        const response: ApiResponse = {
          success: false,
          message: 'Email parameter is required',
        };
        res.status(HTTP_STATUS.BAD_REQUEST).json(response);
        return;
      }

      const exists = await this.authService.emailExists(email);

      const response: ApiResponse = {
        success: true,
        message: 'Email check completed',
        data: { exists },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      console.error('Check email controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Get current user profile (requires authentication)
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // User should be attached to request by auth middleware
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: RESPONSE_MESSAGES.ACCESS_DENIED,
        };
        res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: req.user },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      console.error('Get profile controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };

  /**
   * Health check endpoint
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const response: ApiResponse = {
        success: true,
        message: 'Auth service is healthy',
        data: {
          timestamp: new Date().toISOString(),
          service: 'auth',
          status: 'operational',
        },
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      console.error('Health check controller error:', error);

      const response: ApiResponse = {
        success: false,
        message: 'Auth service health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }
  };
}

export default AuthController;
