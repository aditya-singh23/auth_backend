import * as fs from 'fs';
import * as path from 'path';

interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  EMAIL_SERVICE?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_SECURE?: boolean;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
}

class EnvConfigLoader {
  private config: EnvironmentConfig;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvironmentConfig {
    try {
      // First, try to load from env.json
      const envJsonPath = path.join(process.cwd(), 'env.json');

      if (fs.existsSync(envJsonPath)) {
        const envJson = JSON.parse(fs.readFileSync(envJsonPath, 'utf8'));
        const envConfig = envJson[this.environment];

        if (envConfig) {
          // Replace ${VAR} placeholders with actual environment variables
          const processedConfig = this.processEnvironmentVariables(envConfig);
          return this.validateAndTransformConfig(processedConfig);
        }
      }

      // Fallback to process.env if env.json is not available
      return this.loadFromProcessEnv();
    } catch (error) {
      console.error('Error loading environment configuration:', error);
      throw new Error('Failed to load environment configuration');
    }
  }

  private processEnvironmentVariables(config: any): any {
    const processed: any = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        // Extract variable name from ${VAR_NAME}
        const envVar = value.slice(2, -1);
        processed[key] = process.env[envVar] || value;
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  private loadFromProcessEnv(): EnvironmentConfig {
    // Debug logging
    console.log('🔍 Loading environment variables from process.env');
    console.log('GOOGLE_CLIENT_ID available:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET available:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('GOOGLE_CALLBACK_URL available:', !!process.env.GOOGLE_CALLBACK_URL);

    const config: EnvironmentConfig = {
      PORT: parseInt(process.env.PORT || '5000', 10),
      NODE_ENV: process.env.NODE_ENV || 'development',
      JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
      SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-session-secret',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || '',
    };

    // Only add optional properties if they exist
    if (process.env.EMAIL_SERVICE) config.EMAIL_SERVICE = process.env.EMAIL_SERVICE;
    if (process.env.EMAIL_HOST) config.EMAIL_HOST = process.env.EMAIL_HOST;
    if (process.env.EMAIL_PORT) config.EMAIL_PORT = parseInt(process.env.EMAIL_PORT, 10);
    if (process.env.EMAIL_SECURE) config.EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
    if (process.env.EMAIL_USER) config.EMAIL_USER = process.env.EMAIL_USER;
    if (process.env.EMAIL_PASS) config.EMAIL_PASS = process.env.EMAIL_PASS;
    if (process.env.GOOGLE_CLIENT_ID) config.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (process.env.GOOGLE_CLIENT_SECRET)
      config.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    if (process.env.GOOGLE_CALLBACK_URL)
      config.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

    console.log('🔍 Final config Google OAuth check:', {
      clientId: config.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
      clientSecret: config.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
      callbackUrl: config.GOOGLE_CALLBACK_URL ? 'SET' : 'MISSING',
    });

    return config;
  }

  private validateAndTransformConfig(config: any): EnvironmentConfig {
    const validated: EnvironmentConfig = {
      PORT: typeof config.PORT === 'string' ? parseInt(config.PORT, 10) : config.PORT || 5000,
      NODE_ENV: config.NODE_ENV || 'development',
      JWT_SECRET: config.JWT_SECRET || 'fallback-jwt-secret-change-in-production',
      SESSION_SECRET: config.SESSION_SECRET || 'fallback-session-secret',
      FRONTEND_URL: config.FRONTEND_URL || 'http://localhost:3000',
      DATABASE_URL: config.DATABASE_URL || '',
    };

    // Add optional fields if they exist
    if (config.EMAIL_SERVICE) validated.EMAIL_SERVICE = config.EMAIL_SERVICE;
    if (config.EMAIL_HOST) validated.EMAIL_HOST = config.EMAIL_HOST;
    if (config.EMAIL_PORT)
      validated.EMAIL_PORT =
        typeof config.EMAIL_PORT === 'string' ? parseInt(config.EMAIL_PORT, 10) : config.EMAIL_PORT;
    if (config.EMAIL_SECURE !== undefined)
      validated.EMAIL_SECURE = config.EMAIL_SECURE === 'true' || config.EMAIL_SECURE === true;
    if (config.EMAIL_USER) validated.EMAIL_USER = config.EMAIL_USER;
    if (config.EMAIL_PASS) validated.EMAIL_PASS = config.EMAIL_PASS;
    if (config.GOOGLE_CLIENT_ID) validated.GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
    if (config.GOOGLE_CLIENT_SECRET) validated.GOOGLE_CLIENT_SECRET = config.GOOGLE_CLIENT_SECRET;
    if (config.GOOGLE_CALLBACK_URL) validated.GOOGLE_CALLBACK_URL = config.GOOGLE_CALLBACK_URL;

    return validated;
  }

  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  public getEnvironment(): string {
    return this.environment;
  }

  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public isTest(): boolean {
    return this.environment === 'test';
  }
}

// Create singleton instance
const envConfigLoader = new EnvConfigLoader();

export { EnvironmentConfig };
export default envConfigLoader;
