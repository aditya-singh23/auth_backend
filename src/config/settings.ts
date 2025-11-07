import envConfig from './envConfig';

export const appSettings = {
  // Server Configuration
  port: envConfig.get('PORT'),
  nodeEnv: envConfig.get('NODE_ENV'),

  // Security Configuration
  jwt: {
    secret: envConfig.get('JWT_SECRET'),
    expiresIn: '24h',
  },

  session: {
    secret: envConfig.get('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: envConfig.isProduction(),
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  // CORS Configuration
  cors: {
    origin: envConfig.get('FRONTEND_URL'),
    credentials: true,
  },

  // Database Configuration
  database: {
    url: envConfig.get('DATABASE_URL'),
  },

  // Email Configuration
  email: {
    service: envConfig.get('EMAIL_SERVICE') || 'gmail',
    host: envConfig.get('EMAIL_HOST') || 'smtp.gmail.com',
    port: envConfig.get('EMAIL_PORT') || 587,
    secure: envConfig.get('EMAIL_SECURE') || false,
    auth: {
      user: envConfig.get('EMAIL_USER'),
      pass: envConfig.get('EMAIL_PASS'),
    },
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: envConfig.get('GOOGLE_CLIENT_ID'),
      clientSecret: envConfig.get('GOOGLE_CLIENT_SECRET'),
      callbackUrl: envConfig.get('GOOGLE_CALLBACK_URL') || '/api/auth/google/callback',
    },
  },

  // OTP Configuration
  otp: {
    expirationMinutes: 10,
    length: 6,
  },

  // Password Configuration
  password: {
    saltRounds: 10,
    minLength: 6,
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Frontend Configuration
  frontend: {
    url: envConfig.get('FRONTEND_URL'),
  },

  // AI Configuration
  geminiApiKey: process.env.GEMINI_API_KEY || envConfig.get('GEMINI_API_KEY'),
};

export default appSettings;
