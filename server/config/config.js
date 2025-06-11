/**
 * BeeTagged Configuration Service
 * Provides server-side access to configuration values and secrets
 */

const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/beetagged',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'beetagged-dev-secret',
    jwtExpire: '7d',
  },
  socialNetworks: {
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    }
  }
};

module.exports = config;