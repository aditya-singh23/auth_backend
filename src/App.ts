import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';

import appSettings from '@config/settings';
import dbConnection from '@db/connection';
import authRoutes from '@features/auth/routes';
import { ApiResponse } from '@interfaces/index';
import { HTTP_STATUS } from '@utils/constants';

// Import Passport configuration
import '@config/passport';

class App {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = appSettings.port;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // CORS middleware
    this.app.use(cors(appSettings.cors));

    // JSON parsing middleware
    this.app.use(express.json());

    // URL encoded parsing middleware
    this.app.use(express.urlencoded({ extended: true }));

    // Session middleware for OAuth
    this.app.use(session(appSettings.session));

    // Passport middleware
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  private initializeRoutes(): void {
    // Health check route
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        message: 'Basic Auth API Server is running!',
        data: {
          status: 'OK',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: appSettings.nodeEnv,
        },
      };
      res.json(response);
    });

    // API routes
    this.app.use('/api/auth', authRoutes);

    // API documentation route
    this.app.get('/api', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        message: 'Basic Auth API Documentation',
        data: {
          endpoints: {
            auth: {
              'POST /api/auth/signup': 'Create a new user account',
              'POST /api/auth/login': 'Authenticate user and get token',
              'GET /api/auth/users': 'Get all users (for testing)',
              'POST /api/auth/forgot-password': 'Request password reset OTP',
              'POST /api/auth/reset-password': 'Reset password with OTP',
              'GET /api/auth/google': 'Start Google OAuth flow',
              'GET /api/auth/google/callback': 'Google OAuth callback',
              'POST /api/auth/google/success': 'Handle Google OAuth success',
              'GET /api/auth/oauth/status': 'Check OAuth configuration status',
            },
          },
        },
      };
      res.json(response);
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: false,
        message: 'Route not found',
        error: `The requested route ${req.originalUrl} does not exist`,
      };
      res.status(HTTP_STATUS.NOT_FOUND).json(response);
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Server error:', err);

      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        error: appSettings.nodeEnv === 'development' ? err.message : 'Something went wrong',
      };

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await dbConnection.connect();

      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 Server is running on http://localhost:${this.port}`);
        console.log(`📝 Environment: ${appSettings.nodeEnv}`);
        console.log('📝 Available routes:');
        console.log('   GET  / - Server status');
        console.log('   GET  /api - API documentation');
        console.log('   POST /api/auth/signup - Create account');
        console.log('   POST /api/auth/login - Sign in');
        console.log('   GET  /api/auth/users - View all users');
        console.log('   POST /api/auth/forgot-password - Request password reset OTP');
        console.log('   POST /api/auth/reset-password - Reset password with OTP');
        console.log('   GET  /api/auth/google - Start Google OAuth');
        console.log('   GET  /api/auth/google/callback - Google OAuth callback');
        console.log('   POST /api/auth/google/success - Google OAuth success handler');
        console.log('   GET  /api/auth/oauth/status - OAuth configuration status');
        console.log('');
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

      try {
        await dbConnection.disconnect();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Start server only if this file is run directly
if (require.main === module) {
  app.start().catch(error => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  });
}

export default app.getApp();
export { App };
