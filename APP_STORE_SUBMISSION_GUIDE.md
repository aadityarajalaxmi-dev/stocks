# Trackr App Store Submission Guide

## 📱 App Overview
**App Name**: Trackr  
**Bundle ID**: com.aadi.tyar.trackr  
**Version**: 1.0.0  
**Category**: Finance  
**Platform**: iOS & Android  

## 🔧 Prerequisites

### Apple Developer Account Requirements
1. **Apple Developer Program Membership** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Use email: aadityarajalaxmi@gmail.com

2. **Required Information**
   - Apple Team ID (get from Apple Developer Console)
   - App Store Connect App ID (create new app)

### Google Play Console Requirements
1. **Google Play Console Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/
2. **Service Account Key** for automated publishing

## 🚀 Build & Submit Process

### Step 1: Install EAS CLI
```bash
npm install -g @expo/eas-cli
eas login
```

### Step 2: Configure EAS Build
```bash
eas build:configure
```

### Step 3: Get Required Apple Developer IDs

**IMPORTANT**: You need these IDs from your Apple Developer account before building:

1. **Apple Team ID** (10 characters, like "AB32CZE81F"):
   - Go to https://developer.apple.com/account
   - Sign in with aadityarajalaxmi@gmail.com
   - Look for "Team ID" in your account overview

2. **App Store Connect App ID** (numbers only, like "1234567891"):
   - Go to https://appstoreconnect.apple.com
   - Create new app with bundle ID: com.aadi.tyar.trackr
   - After creation, find the "App ID" in app information

3. **Update eas.json** with real values:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "aadityarajalaxmi@gmail.com",
         "ascAppId": "YOUR_ACTUAL_APP_ID_HERE",
         "appleTeamId": "YOUR_TEAM_ID_HERE"
       }
     }
   }
   ```

### Step 4: Build for Production
```bash
# First, build for testing
eas build --platform ios --profile production

# For Android (optional)
eas build --platform android --profile production
```

### Step 5: Submit to App Store (After Getting IDs)
**Only run this AFTER you have:**
- ✅ Apple Developer Program membership
- ✅ App created in App Store Connect
- ✅ Real Team ID and App ID added to eas.json

```bash
# Submit to App Store (requires real IDs)
eas submit --platform ios --profile production
```

## 📋 App Store Metadata

### App Description
**Trackr** is a comprehensive stock market tracking and analysis app designed for modern investors and traders. Get real-time stock data, technical analysis, and market news all in one place.

### Key Features
- 📈 **Real-time Stock Tracking**: Live price updates with accurate candlestick charts
- 📊 **Technical Analysis**: RSI, MACD, Fibonacci levels, and support/resistance
- 📰 **Market News**: Latest financial news with sentiment analysis
- 🔔 **Smart Notifications**: Customizable alerts for price movements
- 🌙 **Dark/Light Theme**: Comfortable viewing in any lighting
- ⚙️ **User Settings**: Personalized experience with notification controls

### Screenshots Required
1. **Watchlist Screen** (main dashboard)
2. **Stock Detail Chart** (technical analysis)
3. **News Feed** (market news)
4. **Settings Screen** (app configuration)

### App Store Keywords
finance, stocks, trading, market, investment, charts, news, portfolio, real-time, analysis

### Privacy Policy
- Data collection: Stock prices, user preferences
- No personal financial data stored
- Third-party services: Yahoo Finance API, Google Ads

## 🎯 App Store Review Guidelines Compliance

### ✅ Content Guidelines
- Financial data is clearly marked as informational only
- Disclaimers about investment risks included
- No gambling or get-rich-quick promises

### ✅ Technical Requirements
- Supports latest iOS versions
- 64-bit architecture
- App Transport Security enabled
- Proper error handling

### ✅ Legal Requirements
- Terms and Conditions included
- Privacy policy accessible
- Age restriction: 17+ (financial content)

## 🔐 AdMob Production Setup

### Replace Test Ad Units
1. **Create AdMob Account**: https://admob.google.com
2. **Add App**: Register "Trackr" 
3. **Create Ad Units**: Banner and Medium Rectangle
4. **Update AdBanner.js**: Replace test ad unit IDs
5. **Update app.json**: Replace test AdMob app IDs

### Current Test Configuration
```javascript
// In AdBanner.js - REPLACE THESE
ios: 'ca-app-pub-3940256099942544/2934735716'     // Test banner
android: 'ca-app-pub-3940256099942544/6300978111' // Test banner

// In app.json - REPLACE THESE
androidAppId: "ca-app-pub-3940256099942544~3347511713" // Test app
iosAppId: "ca-app-pub-3940256099942544~1458002511"     // Test app
```

## 📄 Required App Store Assets

### App Icons
- **1024x1024**: App Store icon (PNG, no transparency)
- **180x180**: iPhone icon (@3x)
- **120x120**: iPhone icon (@2x)

### Screenshots (Required Sizes)
- **iPhone 6.7"**: 1284x2778 (iPhone 14 Pro Max)
- **iPhone 6.5"**: 1242x2688 (iPhone 11 Pro Max)
- **iPhone 5.5"**: 1242x2208 (iPhone 8 Plus)

### Launch Screen
- Current splash screen configured in app.json

## ⚠️ Important Notes

### Before Submission
1. **Test thoroughly** on physical devices
2. **Update AdMob** to production ad units
3. **Review all legal text** in app
4. **Test all features** without internet
5. **Verify app icons** display correctly

### Apple Review Process
- Typically takes 24-48 hours
- May be rejected for financial app content
- Ensure disclaimers are prominent
- Test all user flows

### Post-Submission
1. **Monitor crash reports**
2. **Update app regularly**
3. **Respond to user reviews**
4. **Track revenue analytics**

## 🎉 Success Checklist

- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] EAS build successful
- [ ] All test ad units replaced
- [ ] App icons prepared
- [ ] Screenshots created
- [ ] App description written
- [ ] Privacy policy accessible
- [ ] Terms and conditions reviewed
- [ ] App submitted for review

## 📞 Support
For technical issues: aadityarajalaxmi@gmail.com  
For app updates: Monitor this repository

---
**Good luck with your App Store submission! 🚀📱💰**
