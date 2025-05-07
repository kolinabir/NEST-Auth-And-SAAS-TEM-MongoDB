import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-template',

  // Add optional database configuration options
  options: {
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 50,
    minPoolSize: 5,
  },

  // Add database document TTL configurations (time to live)
  ttl: {
    passwordReset: 24 * 60 * 60, // 24 hours in seconds
    emailVerification: 24 * 60 * 60, // 24 hours in seconds
    refreshToken: 30 * 24 * 60 * 60, // 30 days in seconds
  },
}));
