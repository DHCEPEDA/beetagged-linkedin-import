// Facebook SDK integration for contact import
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export interface FacebookContact {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  source: 'facebook' | 'linkedin' | 'manual';
  profileImage?: string;
  company?: string;
  position?: string;
  location?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class FacebookService {
  private appId: string;
  private isInitialized = false;
  private accessToken: string | null = null;

  constructor(appId: string) {
    this.appId = appId;
  }

  // Initialize Facebook SDK
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      // Load Facebook SDK
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: this.appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });

        this.isInitialized = true;
        resolve();
      };

      // Load SDK script
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
      document.head.appendChild(script);
    });
  }

  // Authenticate user with Facebook
  async login(): Promise<{ accessToken: string; userID: string }> {
    if (!this.isInitialized) {
      throw new Error('Facebook SDK not initialized');
    }

    return new Promise((resolve, reject) => {
      window.FB.login((response: any) => {
        if (response.authResponse) {
          this.accessToken = response.authResponse.accessToken;
          resolve({
            accessToken: response.authResponse.accessToken,
            userID: response.authResponse.userID
          });
        } else {
          reject(new Error('Facebook login failed or was cancelled'));
        }
      }, {
        scope: 'email,user_friends'
      });
    });
  }

  // Get user's Facebook friends
  async getFriends(): Promise<FacebookContact[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Facebook');
    }

    return new Promise((resolve, reject) => {
      window.FB.api('/me/friends', {
        fields: 'id,name,email,picture',
        access_token: this.accessToken
      }, (response: any) => {
        if (response.error) {
          reject(new Error(`Facebook API error: ${response.error.message}`));
        } else {
          resolve(response.data || []);
        }
      });
    });
  }

  // Get user's own profile information
  async getUserProfile(): Promise<FacebookContact> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Facebook');
    }

    return new Promise((resolve, reject) => {
      window.FB.api('/me', {
        fields: 'id,name,email,picture',
        access_token: this.accessToken
      }, (response: any) => {
        if (response.error) {
          reject(new Error(`Facebook API error: ${response.error.message}`));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Convert Facebook contacts to app Contact format
  convertToContacts(facebookContacts: FacebookContact[]): Contact[] {
    return facebookContacts.map(fbContact => ({
      id: `fb_${fbContact.id}`,
      name: fbContact.name,
      email: fbContact.email,
      source: 'facebook' as const,
      profileImage: fbContact.picture?.data?.url,
      company: undefined,
      position: undefined,
      location: undefined,
      tags: ['facebook-friend'],
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Check login status
  async getLoginStatus(): Promise<{ status: string; authResponse?: any }> {
    if (!this.isInitialized) {
      throw new Error('Facebook SDK not initialized');
    }

    return new Promise((resolve) => {
      window.FB.getLoginStatus((response: any) => {
        if (response.authResponse) {
          this.accessToken = response.authResponse.accessToken;
        }
        resolve(response);
      });
    });
  }

  // Logout from Facebook
  async logout(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Facebook SDK not initialized');
    }

    return new Promise((resolve) => {
      window.FB.logout(() => {
        this.accessToken = null;
        resolve();
      });
    });
  }

  // Import contacts and send to backend
  async importContacts(appId: string): Promise<Contact[]> {
    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Login to Facebook
      await this.login();

      // Get friends list
      const facebookFriends = await this.getFriends();

      // Convert to app format
      const contacts = this.convertToContacts(facebookFriends);

      // Send to backend
      const response = await fetch('/api/import/facebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contacts })
      });

      if (!response.ok) {
        throw new Error(`Failed to import contacts: ${response.statusText}`);
      }

      const result = await response.json();
      return result.contacts || contacts;

    } catch (error) {
      console.error('Facebook import error:', error);
      throw error;
    }
  }
}

export default FacebookService;