import bcrypt from 'bcryptjs';
import { generateToken } from '@middlewares/authMiddleware';
import emailService from '@utils/emailService';
import { HTTP_STATUS, RESPONSE_MESSAGES, JWT } from '@utils/constants';
import {
  AuthRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  CreateUserData,
} from './interfaces';
import { UserRepository } from './models';

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const { name, email, password } = data;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          message: RESPONSE_MESSAGES.USER_EXISTS,
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user data
      const userData: CreateUserData = {
        name,
        email,
        password: hashedPassword,
        provider: 'local',
        emailVerified: false,
      };

      // Create user
      const newUser = await this.userRepository.create(userData);

      // Generate JWT token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        provider: 'local',
      });

      return {
        success: true,
        message: RESPONSE_MESSAGES.USER_CREATED,
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            provider: newUser.provider || 'local',
            profilePicture: newUser.profilePicture || '',
            emailVerified: newUser.emailVerified || false,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
            ...(newUser.passwordUpdatedAt && { passwordUpdatedAt: newUser.passwordUpdatedAt }),
          },
          token,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Authenticate user login
   */
  async login(data: AuthRequest): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Check if user has a password (OAuth users might not)
      if (!user.password) {
        return {
          success: false,
          message: 'Please sign in using Google OAuth',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        provider: user.provider || 'local',
      });

      return {
        success: true,
        message: RESPONSE_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            provider: user.provider || 'local',
            profilePicture: user.profilePicture || '',
            emailVerified: user.emailVerified || false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            ...(user.passwordUpdatedAt && { passwordUpdatedAt: user.passwordUpdatedAt }),
          },
          token,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle forgot password request
   */
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { email } = data;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);

      // For security, always return success message regardless of whether user exists
      if (user) {
        // Send OTP email
        const emailResult = await emailService.sendOTPEmail(email, user.name);

        if (emailResult.success && emailResult.otp) {
          // Store OTP in database
          const otpStored = await this.userRepository.storeOTP(email, emailResult.otp);

          if (!otpStored) {
            return {
              success: false,
              message: 'Failed to process password reset request',
            };
          }
        } else {
          return {
            success: false,
            message: RESPONSE_MESSAGES.EMAIL_SEND_FAILED,
          };
        }
      }

      return {
        success: true,
        message: RESPONSE_MESSAGES.OTP_SENT,
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
      };
    }
  }

  /**
   * Handle password reset with OTP
   */
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const { email, otp, newPassword } = data;

      // Verify OTP
      const otpVerification = await this.userRepository.verifyOTP(email, otp);
      if (!otpVerification.valid) {
        return {
          success: false,
          message: otpVerification.message,
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password
      const updatedUser = await this.userRepository.updatePassword(email, hashedPassword);
      if (!updatedUser) {
        return {
          success: false,
          message: 'Failed to update password',
        };
      }

      // Clear OTP data
      await this.userRepository.clearOTP(email);

      return {
        success: true,
        message: RESPONSE_MESSAGES.PASSWORD_RESET_SUCCESS,
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            provider: updatedUser.provider || 'local',
            profilePicture: updatedUser.profilePicture || '',
            emailVerified: updatedUser.emailVerified || false,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            ...(updatedUser.passwordUpdatedAt && {
              passwordUpdatedAt: updatedUser.passwordUpdatedAt,
            }),
          },
          token: generateToken({
            userId: updatedUser.id,
            email: updatedUser.email,
            provider: updatedUser.provider || 'local',
          }),
        },
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all users (for testing/admin purposes)
   */
  async getAllUsers() {
    try {
      const users = await this.userRepository.getAll();
      return {
        success: true,
        message: RESPONSE_MESSAGES.USERS_RETRIEVED,
        data: users,
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        message: RESPONSE_MESSAGES.SERVER_ERROR,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate user credentials without logging in
   */
  async validateCredentials(email: string, password: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !user.password) {
        return false;
      }

      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Validate credentials error:', error);
      return false;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      return !!user;
    } catch (error) {
      console.error('Email exists check error:', error);
      return false;
    }
  }
}

export default AuthService;
