import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dbConnection from '@db/connection';
import appSettings from '@config/settings';
import { GoogleProfile, User } from '@interfaces/index';

/**
 * Passport Google OAuth Configuration
 *
 * This file configures Passport.js for Google OAuth authentication
 * It handles the OAuth flow and user creation/authentication
 */

type AuthProvider = 'local' | 'google';

const prisma = dbConnection.getClient();

/**
 * Helper function to safely convert database user to Express User
 */
function mapDbUserToExpressUser(
  dbUser: Record<string, string | number | boolean | Date | null>
): Express.User | null {
  if (!dbUser || typeof dbUser !== 'object') return null;

  const user = dbUser as Record<string, string | number | boolean | Date | null>;

  // Type guards for required fields
  if (
    typeof user.id !== 'number' ||
    typeof user.email !== 'string' ||
    typeof user.name !== 'string'
  ) {
    return null;
  }

  // Safely convert provider string to AuthProvider type with validation
  let provider: AuthProvider | null = null;
  if (typeof user.provider === 'string') {
    if (user.provider === 'local' || user.provider === 'google') {
      provider = user.provider as AuthProvider;
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: provider,
  };
}

// ====================================================================
// PASSPORT CONFIGURATION
// ====================================================================

// Serialize user for session storage
// This determines what data is stored in the session
passport.serializeUser((user: Express.User, done) => {
  // Store only the user ID in the session for security
  done(null, user.id);
});

// Deserialize user from session storage
// This retrieves the full user object from the stored ID
passport.deserializeUser(async (id: number, done) => {
  try {
    // Find user by ID in database
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
        // Note: Don't select password for security
      },
    });

    const mappedUser = user ? mapDbUserToExpressUser(user) : null;
    done(null, mappedUser);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

// ====================================================================
// GOOGLE OAUTH STRATEGY
// ====================================================================

// Only configure Google OAuth if credentials are provided
const { clientId, clientSecret, callbackUrl } = appSettings.oauth.google;

console.log('🔍 Google OAuth Config Check:', {
  clientId: clientId ? 'SET' : 'MISSING',
  clientSecret: clientSecret ? 'SET' : 'MISSING',
  callbackUrl: callbackUrl ? 'SET' : 'MISSING',
});

// Temporary fix: Always register the strategy with dummy credentials for testing
console.log('⚠️ Registering Google OAuth strategy with temporary credentials for testing');

passport.use(
  new GoogleStrategy(
    {
      // Use real credentials if available, otherwise use dummy ones
      clientID: clientId || 'dummy-client-id',
      clientSecret: clientSecret || 'dummy-client-secret',
      callbackURL: callbackUrl || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // If using dummy credentials, return an error
      if (!clientId || !clientSecret) {
        return done(
          new Error(
            'Google OAuth not properly configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file'
          ),
          false
        );
      }

      try {
        console.log('🔍 Google OAuth Profile:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
        });

        // Extract user information from Google profile
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const profilePicture = profile.photos?.[0]?.value;

        // Validate required fields
        if (!email || !googleId) {
          return done(new Error('Missing required Google profile information'), false);
        }

        // Check if user already exists by Google ID
        let user = await prisma.user.findUnique({
          where: { googleId: googleId },
        });

        if (user) {
          // User exists with this Google ID - update their info
          console.log('✅ Existing Google user found:', user.email);

          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: name,
              profilePicture: profilePicture || null,
              emailVerified: true,
              updatedAt: new Date(),
            },
          });

          const mappedUser = mapDbUserToExpressUser(user);
          return done(null, mappedUser || false);
        }

        // Check if user exists by email (from regular signup)
        user = await prisma.user.findUnique({
          where: { email: email },
        });

        if (user) {
          // User exists with this email but no Google ID - link accounts
          console.log('🔗 Linking existing email account with Google:', user.email);

          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleId,
              provider: 'google',
              profilePicture: profilePicture || null,
              emailVerified: true,
              updatedAt: new Date(),
            },
          });

          const mappedUser2 = mapDbUserToExpressUser(user);
          return done(null, mappedUser2 || false);
        }

        // Create new user with Google OAuth
        console.log('🆕 Creating new Google user:', email);

        user = await prisma.user.create({
          data: {
            name: name,
            email: email,
            googleId: googleId,
            provider: 'google',
            profilePicture: profilePicture || null,
            emailVerified: true,
            password: null, // OAuth users don't have passwords
          },
        });

        console.log('✅ New Google user created:', user.email);
        const mappedUser3 = mapDbUserToExpressUser(user);
        return done(null, mappedUser3 || false);
      } catch (error) {
        console.error('❌ Google OAuth Error:', error);
        return done(error, false);
      }
    }
  )
);

if (clientId && clientSecret && callbackUrl) {
  console.log('✅ Google OAuth strategy configured with real credentials');
} else {
  console.log('⚠️ Google OAuth not configured - using dummy credentials for testing');
  console.log(
    '   To enable Google OAuth, set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in your .env file'
  );
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Function to find or create user from Google profile
 * This function is kept separate for potential reuse or testing
 */
export const findOrCreateGoogleUser = async (
  profile: GoogleProfile
): Promise<Express.User | null> => {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value;
  const name = profile.displayName;
  const profilePicture = profile.photos?.[0]?.value;

  if (!email || !googleId) {
    throw new Error('Missing required Google profile information');
  }

  try {
    // Check for existing user by Google ID first
    let user = await prisma.user.findUnique({
      where: { googleId: googleId },
    });

    if (!user) {
      // Check for existing user by email
      user = await prisma.user.findUnique({
        where: { email: email },
      });

      if (user) {
        // Link existing account
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            provider: 'google',
            profilePicture: profilePicture || null,
            emailVerified: true,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            name: name,
            email: email,
            googleId: googleId,
            provider: 'google',
            profilePicture: profilePicture || null,
            emailVerified: true,
            password: null,
          },
        });
      }
    }

    return mapDbUserToExpressUser(user);
  } catch (error) {
    console.error('Error in findOrCreateGoogleUser:', error);
    throw error;
  }
};

/**
 * Validates Google OAuth configuration
 */
export const validateOAuthConfig = (): boolean => {
  const { clientId, clientSecret, callbackUrl } = appSettings.oauth.google;

  if (!clientId || !clientSecret || !callbackUrl) {
    console.error('❌ Google OAuth configuration incomplete');
    console.log('Missing required environment variables:');
    if (!clientId) console.log('  - GOOGLE_CLIENT_ID');
    if (!clientSecret) console.log('  - GOOGLE_CLIENT_SECRET');
    if (!callbackUrl) console.log('  - GOOGLE_CALLBACK_URL');
    return false;
  }

  console.log('✅ Google OAuth configuration validated');
  return true;
};

export default passport;
