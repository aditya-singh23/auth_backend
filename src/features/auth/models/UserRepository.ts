import dbConnection from '@db/connection';
import { User, SafeUser } from '@interfaces/index';
import { CreateUserData, UserRepository as IUserRepository } from '../interfaces';

/**
 * User Repository - Handles all database operations for users
 * Uses Prisma ORM for type-safe database queries
 */
export class UserRepository implements IUserRepository {
  private prisma = dbConnection.getClient();

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const newUser = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: userData.password || null,
          googleId: userData.googleId || null,
          provider: userData.provider || 'local',
          profilePicture: userData.profilePicture || null,
          emailVerified: userData.emailVerified || false,
        },
      });

      return newUser as User;
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle unique constraint violation (duplicate email)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new Error('A user with this email already exists');
      }

      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user as User | null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user as User | null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { googleId },
      });

      return user as User | null;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw error;
    }
  }

  /**
   * Get all users (without sensitive data)
   */
  async getAll(): Promise<SafeUser[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          provider: true,
          profilePicture: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          passwordUpdatedAt: true,
          // Exclude password, resetOTP, otpCreatedAt, otpExpiresAt for security
        },
        orderBy: {
          createdAt: 'desc', // Most recent users first
        },
      });

      return users as SafeUser[];
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(email: string, hashedPassword: string): Promise<User | null> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          passwordUpdatedAt: new Date(),
        },
      });

      return updatedUser as User;
    } catch (error) {
      console.error('Error updating user password:', error);

      // Check if user doesn't exist
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        console.log('User not found for password update:', email);
        return null;
      }

      throw error;
    }
  }

  /**
   * Store OTP for password reset
   */
  async storeOTP(email: string, otp: string): Promise<boolean> {
    try {
      // Set OTP to expire in 10 minutes
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.user.update({
        where: { email },
        data: {
          resetOTP: otp,
          otpCreatedAt: new Date(),
          otpExpiresAt: expirationTime,
        },
      });

      console.log('OTP stored successfully for:', email);
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);

      // Check if user doesn't exist
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        console.log('User not found for OTP storage:', email);
        return false;
      }

      throw error;
    }
  }

  /**
   * Verify OTP for password reset
   */
  async verifyOTP(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
    try {
      // Get user with OTP data
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          resetOTP: true,
          otpExpiresAt: true,
        },
      });

      // Check if user exists
      if (!user) {
        console.log('User not found for OTP verification:', email);
        return { valid: false, message: 'User not found' };
      }

      // Check if user has an OTP
      if (!user.resetOTP) {
        console.log('No OTP found for user:', email);
        return { valid: false, message: 'No OTP found. Please request a new one.' };
      }

      // Check if OTP has expired
      const currentTime = new Date();
      if (!user.otpExpiresAt || currentTime > user.otpExpiresAt) {
        console.log('OTP expired for user:', email);
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
      }

      // Check if OTP code matches
      if (user.resetOTP !== otp) {
        console.log('Invalid OTP code for user:', email);
        return { valid: false, message: 'Invalid OTP code. Please check and try again.' };
      }

      // OTP is valid
      console.log('OTP verified successfully for user:', email);
      return { valid: true, message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Clear OTP data after successful password reset
   */
  async clearOTP(email: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { email },
        data: {
          resetOTP: null,
          otpCreatedAt: null,
          otpExpiresAt: null,
        },
      });

      console.log('OTP cleared successfully for user:', email);
      return true;
    } catch (error) {
      console.error('Error clearing OTP:', error);

      // Check if user doesn't exist
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        console.log('User not found for OTP clearing:', email);
        return false;
      }

      throw error;
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(id: number, data: Partial<CreateUserData>): Promise<User | null> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.profilePicture !== undefined && { profilePicture: data.profilePicture }),
          ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
          updatedAt: new Date(),
        },
      });

      return updatedUser as User;
    } catch (error) {
      console.error('Error updating user profile:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return null;
      }

      throw error;
    }
  }

  /**
   * Delete user (soft delete or hard delete)
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });

      console.log('User deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return false;
      }

      throw error;
    }
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  /**
   * Get user count
   */
  async getUserCount(): Promise<number> {
    try {
      return await this.prisma.user.count();
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }
}
