import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beetagged.app',
  appName: 'BeeTagged',
  webDir: 'public',
  server: {
    androidScheme: 'https'
  }
};

export default config;