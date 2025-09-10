# Stock Watchlist & Fibonacci Retracement App

A React Native app built with Expo that provides live stock price tracking and Fibonacci retracement analysis.

## Features

### 📈 Live Stock Watchlist
- Add stocks to your watchlist by searching for symbols
- Real-time price updates every 10 seconds
- View current price, change, change percentage, high, low, volume, and previous close
- Remove stocks from watchlist
- Pull-to-refresh functionality

### 🔢 Fibonacci Retracement Analysis
- Calculate Fibonacci retracement levels based on 3-month historical data
- Visual indicators for current price level relative to Fibonacci levels
- Support and resistance level identification
- Color-coded proximity indicators
- Detailed price analysis

### 🎨 Modern UI
- Clean, intuitive interface
- Material Design components
- Responsive layout
- Smooth animations and transitions

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd trade-bot-2
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Scan the QR code with Expo Go app on your mobile device, or press 'i' for iOS simulator, 'a' for Android emulator.

## Usage

### Adding Stocks
1. Tap the "+" button in the top-right corner of the watchlist
2. Search for a stock symbol (e.g., AAPL, MSFT, GOOGL)
3. Tap on the stock to add it to your watchlist
4. The stock will appear in your watchlist with live price updates

### Viewing Fibonacci Levels
1. Tap on any stock in your watchlist
2. View the Fibonacci retracement analysis
3. See which level the current price is closest to
4. Use the back button to return to the watchlist

### Removing Stocks
1. Tap the "X" button next to any stock in the watchlist
2. Confirm removal in the dialog

## Technical Details

### Dependencies
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **yfinance**: Yahoo Finance API for stock data
- **React Native Paper**: Material Design components
- **React Native SVG**: SVG support for charts
- **Expo Vector Icons**: Icon library

### Architecture
- **Services**: `stockService.js` - Handles all stock data operations
- **Utils**: `fibonacciUtils.js` - Fibonacci calculations and formatting
- **Components**: 
  - `StockWatchlist.js` - Main watchlist display
  - `StockSelector.js` - Stock search and selection
  - `FibonacciLevels.js` - Fibonacci analysis display

### Data Flow
1. StockService manages the watchlist and fetches data from yfinance
2. Components subscribe to data updates via callbacks
3. Live updates are fetched every 10 seconds
4. Fibonacci levels are calculated from 3-month historical data

## API Limitations

- **yfinance**: Free API with rate limits
- **Data Delay**: Some data may have a 15-20 minute delay
- **Availability**: Depends on Yahoo Finance API availability

## Troubleshooting

### Common Issues

1. **"No stocks found" when searching**
   - Try different stock symbols
   - Check your internet connection
   - Some symbols may not be available

2. **"Failed to load Fibonacci data"**
   - Ensure the stock has sufficient historical data
   - Check internet connection
   - Try refreshing the data

3. **App crashes on startup**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Performance Tips
- Limit your watchlist to 10-15 stocks for optimal performance
- Close the app when not in use to save battery
- Use WiFi when possible for better data updates

## Future Enhancements

- [ ] Price alerts and notifications
- [ ] Technical indicators (RSI, MACD, etc.)
- [ ] Portfolio tracking
- [ ] Dark mode support
- [ ] Offline data caching
- [ ] Multiple timeframes for Fibonacci analysis

## License

This project is for educational purposes. Please respect Yahoo Finance's terms of service when using the yfinance API.

## Support

If you encounter any issues or have questions, please check the troubleshooting section above or create an issue in the project repository.
# stocks
