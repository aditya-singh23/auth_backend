# Basic Auth API Backend

A comprehensive authentication API built with Node.js, Express, TypeScript, and Prisma ORM. Features JWT authentication, Google OAuth, password reset functionality, and role-based access control.

## 🚀 Features

- **JWT Authentication** - Secure token-based authentication
- **Google OAuth** - Social login integration
- **Password Reset** - OTP-based password recovery via email
- **Role-based Access Control** - Admin and user roles
- **Email Service** - Automated email notifications
- **Data Encryption** - Secure data storage and transmission
- **Input Validation** - Comprehensive request validation
- **Clean Architecture** - Feature-based organization
- **TypeScript** - Full type safety
- **Prisma ORM** - Type-safe database operations

## 📁 Project Structure

```
backend/
├── .husky/              # Git hooks for pre-commit and linting
├── .prettierignore      # Files to exclude from Prettier formatting
├── .prettierrc         # Prettier configuration
├── src/                 # Source code
│   ├── config/          # Configuration files
│   │   ├── envConfig.ts # Environment configuration loader
│   │   ├── passport.ts  # Passport.js OAuth configuration
│   │   └── settings.ts  # App settings using envConfig
│   ├── db/              # Database related files
│   │   └── connection.ts # Prisma database connection
│   ├── features/        # Feature-based routing and logic
│   │   └── auth/        # Authentication module
│   │       ├── models/  # Authentication-related models
│   │       │   ├── UserRepository.ts # User data access layer
│   │       │   └── index.ts          # Model exports
│   │       ├── controllers.ts  # Auth controllers
│   │       ├── interfaces.ts   # TypeScript interfaces
│   │       ├── routes.ts       # Auth routes
│   │       ├── services.ts     # Auth business logic
│   │       └── validations.ts  # Joi validation schemas
│   ├── helpers/         # Helper utilities
│   │   ├── authHelpers.ts      # Authentication helpers
│   │   ├── responseHelpers.ts  # API response helpers
│   │   ├── validationHelpers.ts # Input validation helpers
│   │   └── index.ts            # Helper exports
│   ├── interfaces/      # Shared TypeScript interfaces
│   ├── middlewares/     # Middleware functions
│   │   ├── adminMiddleware.ts    # Admin authorization
│   │   ├── authMiddleware.ts     # JWT authentication
│   │   └── validationMiddleware.ts # Request validation
│   ├── models/          # Shared models (currently empty)
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Custom types and declarations
│   ├── utils/           # Utility functions
│   │   ├── constants.ts # Application constants
│   │   └── emailService.ts # Email service utilities
│   └── App.ts           # Application entry point
├── prisma/              # Prisma ORM files
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── env.json             # Environment configuration
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basic-auth-api/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# Email Service
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Frontend
FRONTEND_URL="http://localhost:3000"

# Admin Configuration
ADMIN_EMAILS="admin@example.com,superuser@example.com"
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/users` - Get all users (admin only)

### Password Reset
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### OAuth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/google/success` - Handle OAuth success

### Utility
- `GET /api/auth/health` - Health check
- `GET /api/auth/check-email` - Check if email exists
- `GET /api/auth/oauth/status` - OAuth configuration status

## 🔐 Security Features

- **JWT Tokens** - Secure authentication with configurable expiration
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Joi schema validation
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Cross-origin request security
- **Admin Authorization** - Role-based access control
- **Data Encryption** - Sensitive data protection

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📖 API Testing

You can test the API endpoints using:
- **Postman** - Import the collection for easy testing
- **cURL** - Command line testing
- **Frontend Application** - Integrated React frontend

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@basicauth.com or create an issue in the repository.
