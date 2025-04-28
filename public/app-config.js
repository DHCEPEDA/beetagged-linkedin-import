/**
 * BeeTagger Application Configuration
 * Web equivalent of InfoPlist.strings from iOS
 */

const AppConfig = {
  // App information
  appName: "BeeTagger",
  appVersion: "1.0.0",
  
  // Branding
  branding: {
    primaryColor: "#FFC107", // Bee yellow
    secondaryColor: "#212121", // Dark gray
    logoPath: "/images/diago-bee.svg"
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
      appId: process.env.FACEBOOK_APP_ID || "123456789012345"
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
    enabled: process.env.NODE_ENV !== "production",
    logLevel: "info" // "debug", "info", "warn", "error"
  }
};

// Make the configuration available globally
window.AppConfig = AppConfig;

// Export for module usage
export default AppConfig;