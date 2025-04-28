/**
 * BeeTagged Application Configuration
 * Web equivalent of InfoPlist.strings from iOS
 */

const AppConfig = {
  // App information
  appName: "BeeTagged",
  appVersion: "1.0.0",
  
  // Branding
  branding: {
    primaryColor: "#FD9E31", // goldBeeColor - the darker yellow of the bee icon
    secondaryColor: "#212121", // Dark gray
    accentColor: "#FFEC16", // yellowBeeColor - the lighter color of the bee icon
    backgroundColor: "#ECF0F1", // cloudsColor - light gray for backgrounds
    logoPath: "/images/beelogo-actual.svg"
  },
  
  // Features configuration
  features: {
    tagging: true,
    socialImport: true,
    affinityGroups: true,
    contactSearch: true
  },
  
  // Social networks configuration
  socialNetworks: {
    facebook: {
      enabled: true,
      appId: process.env.FACEBOOK_APP_ID || '' // Access via webpack environment injection
    },
    linkedin: {
      enabled: false // Not implemented yet
    }
  },
  
  // API endpoints
  apiEndpoints: {
    base: "/api",
    auth: "/api/auth",
    contacts: "/api/contacts",
    tags: "/api/tags",
    groups: "/api/groups",
    social: "/api/social"
  },
  
  // Debug settings
  debug: {
    enabled: true,
    logLevel: "info" // "debug", "info", "warn", "error"
  }
};

// Make the configuration available globally
window.AppConfig = AppConfig;