/**
 * LinkedIn Configuration
 * 
 * Configuration for LinkedIn OAuth and API access
 */

// The LinkedIn API configuration is loaded from environment variables
const linkedinConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  redirectUri: 'https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev:3000/api/auth/linkedin/callback',
  scope: 'r_emailaddress r_liteprofile',
  state: Math.random().toString(36).substring(2, 15),
  responseType: 'code'
};

module.exports = linkedinConfig;