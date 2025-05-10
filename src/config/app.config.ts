import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Server configuration
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT settings
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'accessTokenSecret',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refreshTokenSecret',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // Rates and limits
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // Frontend URLs for CORS and redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER || 'user@example.com',
    password: process.env.EMAIL_PASSWORD || 'password',
    from: process.env.EMAIL_FROM || 'noreply@example.com',
  },

  // OAuth providers
  oauth: {
    google: {
      enabled: process.env.OAUTH_GOOGLE_ENABLED === 'true',
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.OAUTH_GOOGLE_CALLBACK_URL,
    },
    facebook: {
      enabled: process.env.OAUTH_FACEBOOK_ENABLED === 'true',
      clientId: process.env.OAUTH_FACEBOOK_CLIENT_ID,
      clientSecret: process.env.OAUTH_FACEBOOK_CLIENT_SECRET,
      callbackUrl: process.env.OAUTH_FACEBOOK_CALLBACK_URL,
    },
    github: {
      enabled: process.env.OAUTH_GITHUB_ENABLED === 'true',
      clientId: process.env.OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.OAUTH_GITHUB_CALLBACK_URL,
    },
  },

  // Admin activity logging
  admin: {
    logActivityToConsole: process.env.LOG_ADMIN_ACTIVITY === 'true',
  },
}));
