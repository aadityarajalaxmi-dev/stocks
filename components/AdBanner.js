import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Conditional import to prevent runtime errors
let AdMobBanner;
try {
  const admob = require('expo-ads-admob');
  AdMobBanner = admob.AdMobBanner;
} catch (error) {
  console.log('AdMob not available:', error.message);
  AdMobBanner = null;
}

const AdBanner = ({ style, size = 'banner' }) => {
  const { theme } = useTheme();
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // Test Ad Unit IDs (replace with your actual ad unit IDs in production)
  // To get real ad unit IDs:
  // 1. Create an AdMob account at https://admob.google.com
  // 2. Add your app and create banner ad units
  // 3. Replace these test IDs with your real ad unit IDs
  // 4. Update app.json with your real AdMob app IDs
  const adUnitId = Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716', // Test banner ad unit ID for iOS
    android: 'ca-app-pub-3940256099942544/6300978111', // Test banner ad unit ID for Android
  });

  const handleAdLoaded = () => {
    setAdLoaded(true);
    setAdError(false);
  };

  const handleAdError = (error) => {
    console.log('Ad failed to load:', error);
    setAdError(true);
    setAdLoaded(false);
  };

  // Don't render anything if ad failed to load or AdMob not available
  if (adError || !AdMobBanner) {
    return null;
  }

  return (
    <View style={[styles.adContainer, style]}>
      {!adLoaded && (
        <View style={[styles.adPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.adPlaceholderText, { color: theme.colors.textTertiary }]}>
            Loading ad...
          </Text>
        </View>
      )}
      
      {AdMobBanner && (
        <AdMobBanner
          bannerSize={size}
          adUnitId={adUnitId}
          servePersonalizedAds={true}
          onDidFailToReceiveAdWithError={handleAdError}
          onAdViewDidReceiveAd={handleAdLoaded}
          style={adLoaded ? styles.adBanner : styles.hiddenAd}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    marginVertical: 8,
    minHeight: 50,
  },
  adBanner: {
    width: '100%',
  },
  hiddenAd: {
    position: 'absolute',
    opacity: 0,
  },
  adPlaceholder: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adPlaceholderText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default AdBanner;
