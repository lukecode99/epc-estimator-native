import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.co.epcestimator.app',
  appName: 'EPC Estimator',
  webDir: 'dist-native',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#1a2233',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    AdMob: {
      appId: 'ca-app-pub-9879821077971587~3911636489',
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
