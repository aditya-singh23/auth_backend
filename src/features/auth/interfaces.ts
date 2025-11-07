import { User, SafeUser, JWTPayload } from '@interfaces/index';

// Auth-specific request interfaces
export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
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

export interface GoogleOAuthRequest {
  googleToken: string;
}

// Auth-specific response interfaces
export interface AuthSuccessResponse {
  success: true;
  message: string;
  data: {
    user: SafeUser;
    token: string;
  };
}

export interface AuthErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  error?: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

// Service interfaces
export interface AuthService {
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: AuthRequest): Promise<AuthResponse>;
  forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }>;
  resetPassword(data: ResetPasswordRequest): Promise<AuthResponse>;
  googleOAuth(data: GoogleOAuthRequest): Promise<AuthResponse>;
}

// Repository interfaces
export interface UserRepository {
  create(userData: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  getAll(): Promise<SafeUser[]>;
  updatePassword(email: string, hashedPassword: string): Promise<User | null>;
  storeOTP(email: string, otp: string): Promise<boolean>;
  verifyOTP(email: string, otp: string): Promise<{ valid: boolean; message: string }>;
  clearOTP(email: string): Promise<boolean>;
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

// Email service interfaces
export interface EmailService {
  sendOTP(email: string, name: string): Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyConfig(): Promise<boolean>;
}

// OAuth interfaces
export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface OAuthService {
  verifyGoogleToken(token: string): Promise<GoogleUserProfile>;
  findOrCreateUser(profile: GoogleUserProfile): Promise<User>;
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidation extends ValidationResult {
  strength?: 'weak' | 'medium' | 'strong';
}

// Token interfaces
export interface TokenService {
  generate(payload: JWTPayload, expiresIn?: string): string;
  verify(token: string): JWTPayload;
  decode(token: string): JWTPayload | null;
}

// Password service interfaces
export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
  validate(password: string): PasswordValidation;
  generateOTP(): string;
}

// Rate limiting interfaces
export interface RateLimitService {
  checkLimit(identifier: string, limit: number, windowMs: number): Promise<boolean>;
  resetLimit(identifier: string): Promise<void>;
}

// Audit/Logging interfaces
export interface AuthAuditLog {
  userId?: number;
  email: string;
  action: 'login' | 'register' | 'forgot_password' | 'reset_password' | 'oauth_login';
  success: boolean;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  error?: string;
}

export interface AuditService {
  log(auditLog: AuthAuditLog): Promise<void>;
  getLogsByUser(userId: number): Promise<AuthAuditLog[]>;
  getLogsByEmail(email: string): Promise<AuthAuditLog[]>;
}

// Configuration interfaces
export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  password: {
    saltRounds: number;
    minLength: number;
  };
  otp: {
    length: number;
    expirationMinutes: number;
  };
  rateLimit: {
    windowMs: number;
    maxAttempts: number;
  };
  oauth: {
    google: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
}
