import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import AuthController from './controllers';
import { authenticateToken, generateToken } from '@middlewares/authMiddleware';
import { requireAdmin } from '@middlewares/adminMiddleware';
import {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '@middlewares/validationMiddleware';
import { findOrCreateGoogleUser } from '@config/passport';
import appSettings from '@config/settings';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@utils/constants';
import { ApiResponse } from '@interfaces/index';

/**
 * Authentication Routes
 * Defines all authentication-related endpoints
 */
const router = Router();
const authController = new AuthController();

// ====================================================================
// BASIC AUTH ROUTES
// ====================================================================

/**
 * POST /signup - Register a new user
 */
router.post('/signup', validateSignup, authController.signup);

/**
 * POST /login - Authenticate user
 */
router.post('/login', validateLogin, authController.login);

/**
 * POST /forgot-password - Request password reset OTP
 */
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

/**
 * POST /reset-password - Reset password with OTP
 */
router.post('/reset-password', validateResetPassword, authController.resetPassword);

/**
 * GET /users - Get all users (ADMIN ONLY - requires authentication + admin privileges)
 */
router.get('/users', authenticateToken, requireAdmin, authController.getUsers);

/**
 * GET /profile - Get current user profile (requires authentication)
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * GET /check-email - Check if email exists
 */
router.get('/check-email', authController.checkEmail);

/**
 * GET /health - Health check endpoint
 */
router.get('/health', authController.healthCheck);

// ====================================================================
// GOOGLE OAUTH ROUTES
// ====================================================================

/**
 * GET /google - Initiate Google OAuth flow
 */
router.get('/google', (req, res, next) => {
  // Check if OAuth is configured
  const { clientId, clientSecret } = appSettings.oauth.google;

  if (!clientId || !clientSecret) {
    const response: ApiResponse = {
      success: false,
      message:
        'Google OAuth is not configured. Please set up Google OAuth credentials in your .env file.',
      data: {
        error: 'OAUTH_NOT_CONFIGURED',
        instructions: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file',
      },
    };
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }

  // Initiate Google OAuth flow
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
});

/**
 * GET /google/callback - Handle Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${appSettings.frontend.url}/login?error=oauth_failed`,
    session: false,
  }),
  async (req, res) => {
    try {
      const user = req.user as any;

      console.log('✅ Google OAuth Success for user:', user?.email);

      if (!user) {
        return res.redirect(`${appSettings.frontend.url}/login?error=no_user`);
      }

      // Generate JWT token
      const token = generateToken(
        {
          userId: user.id,
          email: user.email,
          provider: user.provider || 'google',
        },
        '7d'
      );

      // Prepare user data
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        provider: user.provider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // Redirect to frontend with token and user data
      const frontendUrl = appSettings.frontend.url;
      const redirectUrl = `${frontendUrl}/oauth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;

      console.log('🔄 Redirecting to frontend:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      const frontendUrl = appSettings.frontend.url;
      res.redirect(`${frontendUrl}/login?error=oauth_callback_failed`);
    }
  }
);

/**
 * POST /google/success - Alternative OAuth success handler via AJAX
 */
router.post('/google/success', async (req, res) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      const response: ApiResponse = {
        success: false,
        message: 'Google token is required',
      };
      return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    }

    // Verify Google token using Google Auth Library
    const clientId = appSettings.oauth.google.clientId;
    if (!clientId) {
      const response: ApiResponse = {
        success: false,
        message: 'Google OAuth not configured',
      };
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    }

    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid Google token',
      };
      return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    }

    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const profilePicture = payload['picture'];

    if (!email || !googleId || !name) {
      const response: ApiResponse = {
        success: false,
        message: 'Missing required Google profile information',
      };
      return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    }

    // Find or create user using the utility function
    const user = await findOrCreateGoogleUser({
      id: googleId,
      emails: [{ value: email }],
      displayName: name,
      photos: profilePicture ? [{ value: profilePicture }] : [],
    });

    // Generate JWT token
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
        provider: 'google',
      },
      '7d'
    );

    // Return success response
    const response: ApiResponse = {
      success: true,
      message: RESPONSE_MESSAGES.OAUTH_SUCCESS,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          provider: user.provider,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: token,
      },
    };

    return res.json(response);
  } catch (error) {
    console.error('❌ Google OAuth success handler error:', error);

    const response: ApiResponse = {
      success: false,
      message: RESPONSE_MESSAGES.OAUTH_FAILED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
});

/**
 * GET /oauth/status - Check OAuth configuration status
 */
router.get('/oauth/status', (req, res) => {
  const isConfigured = !!(
    appSettings.oauth.google.clientId &&
    appSettings.oauth.google.clientSecret &&
    appSettings.oauth.google.callbackUrl
  );

  const response: ApiResponse = {
    success: true,
    message: 'OAuth status retrieved',
    data: {
      googleOAuthConfigured: isConfigured,
      callbackUrl: appSettings.oauth.google.callbackUrl,
      frontendUrl: appSettings.frontend.url,
    },
  };

  res.json(response);
});

// ====================================================================
// ERROR HANDLING MIDDLEWARE
// ====================================================================

/**
 * Handle OAuth-specific errors
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error('OAuth Route Error:', error);

  if (error.name === 'GoogleOAuthError') {
    const response: ApiResponse = {
      success: false,
      message: RESPONSE_MESSAGES.OAUTH_FAILED,
      error: error.message,
    };
    return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }

  // Generic error response
  const response: ApiResponse = {
    success: false,
    message: 'OAuth authentication error',
    error: appSettings.nodeEnv === 'development' ? error.message : 'Internal server error',
  };

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
});

export default router;
