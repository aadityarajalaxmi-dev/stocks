import NotificationService from './notificationService';

class StockService {
  constructor() {
    this.watchlist = [];
    this.priceUpdateInterval = null;
    this.subscribers = [];
    this.priceHistory = new Map(); // Track price history for timeframe calculations
  }

  // Add stock to watchlist
  addToWatchlist(symbol) {
    if (!this.watchlist.find(stock => stock.symbol === symbol)) {
      this.watchlist.push({
        symbol: symbol.toUpperCase(),
        price: 0,
        change: 0,
        changePercent: 0,
        previousClose: 0,
        openPrice: 0, // Today's opening price for percentage calculation
        high: 0,
        low: 0,
        volume: 0,
        marketCap: 0,
        avgVolume: 0,
        volumeChange: 0,
        lastUpdate: null,
        // Timeframe-specific changes
        timeframeChanges: {
          '5m': { change: 0, changePercent: 0 },
          '1h': { change: 0, changePercent: 0 },
          '6h': { change: 0, changePercent: 0 },
          '24h': { change: 0, changePercent: 0 }
        }
      });
      this.fetchStockData(symbol);
    }
  }

  // Remove stock from watchlist
  removeFromWatchlist(symbol) {
    this.watchlist = this.watchlist.filter(stock => stock.symbol !== symbol);
  }

  // Get current watchlist
  getWatchlist() {
    return this.watchlist;
  }

  // Fetch stock data for a specific symbol using Alpha Vantage API
  async fetchStockData(symbol) {
    try {
      // Using a free API that works in React Native
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        
        const stockIndex = this.watchlist.findIndex(stock => stock.symbol === symbol);
        if (stockIndex !== -1) {
          const currentPrice = meta.regularMarketPrice || 0;
          const previousClose = meta.previousClose || 0;
          const openPrice = meta.regularMarketOpen || previousClose; // Use opening price for today's session
          const change = currentPrice - openPrice; // Change from opening price, not previous close
          const changePercent = openPrice !== 0 ? (change / openPrice) * 100 : 0;
          
          // Calculate market cap (price * shares outstanding - using volume as proxy)
          const marketCap = currentPrice * (meta.regularMarketVolume || 1000000);
          const avgVolume = (meta.regularMarketVolume || 0) * 0.8; // Simulate average volume
          const volumeChange = Math.random() * 40 - 20; // Random volume change -20% to +20%

          // Initialize price history
          this.trackPriceHistory(symbol, currentPrice);
          const timeframeChanges = this.calculateTimeframeChanges(symbol, currentPrice);

          this.watchlist[stockIndex] = {
            ...this.watchlist[stockIndex],
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            previousClose: previousClose,
            openPrice: openPrice,
            high: meta.regularMarketDayHigh || 0,
            low: meta.regularMarketDayLow || 0,
            volume: meta.regularMarketVolume || 0,
            marketCap: marketCap,
            avgVolume: avgVolume,
            volumeChange: volumeChange,
            lastUpdate: new Date(),
            timeframeChanges: timeframeChanges
          };
          
          this.notifySubscribers();
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      // Fallback to mock data for demo purposes
      this.setMockData(symbol);
    }
  }

  // Set mock data for demo purposes
  setMockData(symbol) {
    const stockIndex = this.watchlist.findIndex(stock => stock.symbol === symbol);
    if (stockIndex !== -1) {
      const basePrice = 100 + Math.random() * 200; // Random price between 100-300
      const openPrice = basePrice - (Math.random() - 0.5) * 10; // Opening price slightly different from current
      const change = basePrice - openPrice; // Change from opening price
      const changePercent = openPrice !== 0 ? (change / openPrice) * 100 : 0;
      
      // Generate more realistic volume ranges for popular stocks
      const volumeMultiplier = this.getVolumeMultiplierForStock(symbol);
      const volume = Math.floor((Math.random() * 50000000 + 5000000) * volumeMultiplier); // 5M to 55M base volume
      const marketCap = basePrice * volume;
      const avgVolume = volume * 0.8;
      const volumeChange = Math.random() * 40 - 20;

      // Initialize price history with some mock data
      this.trackPriceHistory(symbol, basePrice);
      const timeframeChanges = this.calculateTimeframeChanges(symbol, basePrice);

      this.watchlist[stockIndex] = {
        ...this.watchlist[stockIndex],
        price: basePrice,
        change: change,
        changePercent: changePercent,
        previousClose: openPrice - (Math.random() - 0.5) * 5, // Previous close different from opening
        openPrice: openPrice,
        high: Math.max(basePrice, openPrice) + Math.random() * 10,
        low: Math.min(basePrice, openPrice) - Math.random() * 10,
        volume: volume,
        marketCap: marketCap,
        avgVolume: avgVolume,
        volumeChange: volumeChange,
        lastUpdate: new Date(),
        timeframeChanges: timeframeChanges
      };
      
      this.notifySubscribers();
    }
  }

  // Get volume multiplier based on stock symbol (simulate different stock popularity)
  getVolumeMultiplierForStock(symbol) {
    // High-volume stocks (FAANG, Tesla, etc.)
    const highVolumeStocks = ['AAPL', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN', 'GOOGL', 'MSFT', 'NFLX'];
    // Medium-volume stocks
    const mediumVolumeStocks = ['CRM', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SQ', 'ROKU', 'ZM', 'PTON'];
    
    if (highVolumeStocks.includes(symbol)) {
      return 2.0 + Math.random() * 2.0; // 2x to 4x multiplier
    } else if (mediumVolumeStocks.includes(symbol)) {
      return 1.0 + Math.random() * 1.5; // 1x to 2.5x multiplier
    } else {
      return 0.3 + Math.random() * 0.7; // 0.3x to 1x multiplier
    }
  }

  // Track price history for timeframe calculations
  trackPriceHistory(symbol, price) {
    const now = new Date();
    
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol);
    history.push({ price, timestamp: now });
    
    // Keep only last 24 hours of data (1440 minutes at 1-second intervals = 86400 entries)
    // But we'll keep a reasonable amount for memory efficiency
    const maxEntries = 1440; // 24 minutes at 1-second intervals for demo
    if (history.length > maxEntries) {
      history.splice(0, history.length - maxEntries);
    }
  }

  // Calculate timeframe-specific changes
  calculateTimeframeChanges(symbol, currentPrice) {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length === 0) {
      return {
        '5m': { change: 0, changePercent: 0 },
        '1h': { change: 0, changePercent: 0 },
        '6h': { change: 0, changePercent: 0 },
        '24h': { change: 0, changePercent: 0 }
      };
    }

    const now = new Date();
    const timeframes = {
      '5m': 5 * 60 * 1000,      // 5 minutes in milliseconds
      '1h': 60 * 60 * 1000,     // 1 hour in milliseconds
      '6h': 6 * 60 * 60 * 1000, // 6 hours in milliseconds
      '24h': 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    };

    const changes = {};
    
    for (const [timeframe, duration] of Object.entries(timeframes)) {
      const targetTime = now.getTime() - duration;
      
      // Find the closest price entry to the target time
      let closestEntry = history[0];
      let closestDiff = Math.abs(history[0].timestamp.getTime() - targetTime);
      
      for (const entry of history) {
        const diff = Math.abs(entry.timestamp.getTime() - targetTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestEntry = entry;
        }
      }
      
      const oldPrice = closestEntry.price;
      const change = currentPrice - oldPrice;
      const changePercent = oldPrice !== 0 ? (change / oldPrice) * 100 : 0;
      
      changes[timeframe] = {
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2))
      };
    }
    
    return changes;
  }

  // Update prices with realistic real-time movements (every second)
  updatePricesWithRealTimeMovements() {
    console.log(`Updating ${this.watchlist.length} stocks`);
    this.watchlist.forEach((stock, index) => {
      if (stock.price > 0) {
        // Ensure openPrice is set (fallback for existing stocks without openPrice)
        if (!stock.openPrice || stock.openPrice === 0) {
          stock.openPrice = stock.previousClose || stock.price;
          console.log(`Setting openPrice for ${stock.symbol}: ${stock.openPrice}`);
        }
        // Create realistic micro-movements (0.01% to 0.1% per second)
        const microMovement = (Math.random() - 0.5) * 0.002; // -0.1% to +0.1%
        const priceMovement = stock.price * microMovement;
        
        // Add some volatility patterns
        const timeBasedVolatility = Math.sin(Date.now() / 10000) * 0.001;
        const randomSpike = Math.random() < 0.01 ? (Math.random() - 0.5) * 0.01 : 0; // 1% chance of 0.5% spike
        
        const totalMovement = priceMovement + (stock.price * timeBasedVolatility) + (stock.price * randomSpike);
        const newPrice = Math.max(0.01, stock.price + totalMovement);
        
        // Calculate new change from opening price (not previous close)
        // If openPrice is not set, use previousClose as fallback
        const openPrice = stock.openPrice || stock.previousClose || stock.price;
        const newChange = newPrice - openPrice;
        const newChangePercent = openPrice !== 0 ? (newChange / openPrice) * 100 : 0;
        
        // Debug logging for first stock
        if (index === 0) {
          console.log(`${stock.symbol}: Price=${newPrice.toFixed(2)}, Open=${stock.openPrice}, Change=${newChange.toFixed(2)}, Percent=${newChangePercent.toFixed(2)}%`);
        }
        
        // Update daily high/low if needed
        const newHigh = Math.max(stock.high, newPrice);
        const newLow = Math.min(stock.low, newPrice);
        
        // Simulate volume changes (small increments)
        const volumeIncrement = Math.floor(Math.random() * 1000);
        const newVolume = stock.volume + volumeIncrement;
        const newMarketCap = newPrice * (newVolume || 1000000);
        
        // Track price history for timeframe calculations
        this.trackPriceHistory(stock.symbol, newPrice);
        
        // Calculate timeframe-specific changes
        const timeframeChanges = this.calculateTimeframeChanges(stock.symbol, newPrice);
        
        this.watchlist[index] = {
          ...stock,
          price: Number(newPrice.toFixed(2)),
          change: Number(newChange.toFixed(2)),
          changePercent: Number(newChangePercent.toFixed(2)),
          openPrice: stock.openPrice || openPrice, // Ensure openPrice is preserved/set
          high: Number(newHigh.toFixed(2)),
          low: Number(newLow.toFixed(2)),
          volume: newVolume,
          marketCap: newMarketCap,
          lastUpdate: new Date(),
          timeframeChanges: timeframeChanges
        };
      }
    });
    
    this.notifySubscribers();
  }

  // Fetch data for all stocks in watchlist
  async fetchAllStockData() {
    const promises = this.watchlist.map(stock => this.fetchStockData(stock.symbol));
    await Promise.all(promises);
  }

  // Start live price updates
  startLiveUpdates(intervalMs = 1000) { // Default to 1 second for real-time updates
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    
    console.log(`Starting live updates every ${intervalMs}ms`);
    
    // Fix any stocks that don't have openPrice set
    this.fixMissingOpenPrices();
    
    this.priceUpdateInterval = setInterval(() => {
      // For real-time updates, use mock data with realistic micro-movements
      console.log('Updating prices...', new Date().toLocaleTimeString());
      this.updatePricesWithRealTimeMovements();
    }, intervalMs);
  }

  // Fix any stocks that don't have openPrice set
  fixMissingOpenPrices() {
    this.watchlist.forEach((stock, index) => {
      if (!stock.openPrice || stock.openPrice === 0) {
        // Set openPrice to previousClose or current price as fallback
        this.watchlist[index].openPrice = stock.previousClose || stock.price;
        console.log(`Fixed openPrice for ${stock.symbol}: ${this.watchlist[index].openPrice}`);
      }
    });
  }

  // Stop live price updates
  stopLiveUpdates() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
  }

  // Subscribe to price updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.watchlist));
    
    // Update notification service with latest stock data
    NotificationService.updateStockData(this.watchlist);
  }

  // Get historical data for Fibonacci calculations and technical indicators
  async getHistoricalData(symbol, period = '6mo') {
    try {
      // Using Yahoo Finance API for historical data - extended to 6 months for RSI/MACD
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`);
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        if (timestamps && quotes && timestamps.length > 0) {
          const prices = timestamps.map((timestamp, index) => ({
            date: new Date(timestamp * 1000),
            high: quotes.high[index] || 0,
            low: quotes.low[index] || 0,
            close: quotes.close[index] || 0,
            open: quotes.open[index] || 0
          })).filter(day => day.high > 0 && day.low > 0);
          
          return prices;
        }
      }
      return [];
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      // Return mock historical data for demo
      return this.generateMockHistoricalData();
    }
  }

  // Generate mock historical data for demo
  generateMockHistoricalData() {
    const data = [];
    const basePrice = 100;
    let currentPrice = basePrice;
    
    // Generate 180 days of data for RSI/MACD calculations
    for (let i = 180; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.5) * 10;
      currentPrice += change;
      
      const high = currentPrice + Math.random() * 5;
      const low = currentPrice - Math.random() * 5;
      
      data.push({
        date: date,
        high: high,
        low: low,
        close: currentPrice,
        open: currentPrice - change
      });
    }
    
    return data;
  }

  // Get 8 highest volume stocks 
  async getMostVolatileStocks() {
    const volatileStocks = [
      'TSLA', 'NVDA', 'AMD', 'NFLX', 'META', 'AMZN', 'GOOGL', 'AAPL',
      'MSFT', 'CRM', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SQ', 'ROKU',
      'ZM', 'PTON', 'SPOT', 'SNAP', 'PINS', 'SHOP', 'OKTA', 'DDOG',
      'SNOW', 'PLTR', 'CRWD', 'ZS', 'NET', 'FSLY', 'DOCU', 'WDAY',
      'NOW', 'TEAM', 'MDB', 'ESTC', 'SPLK', 'VMW', 'ORCL', 'IBM',
      'CSCO', 'QCOM', 'AVGO', 'TXN', 'AMAT', 'LRCX', 'MU', 'ADI',
      'MCHP', 'KLAC', 'SNPS', 'CDNS', 'ANSS', 'FTNT', 'PANW', 'WDAY'
    ];

    // Clear current watchlist and add new stocks
    this.watchlist = [];
    
    // Fetch data for each stock and calculate volatility
    const stockData = [];
    for (const symbol of volatileStocks) {
      this.addToWatchlist(symbol);
      await this.fetchStockData(symbol);
    }
    
    // Sort by volume (highest volume first) to match the default sort filter
    this.watchlist.sort((a, b) => b.volume - a.volume);
    
    // Take only the top 8 highest volume
    this.watchlist = this.watchlist.slice(0, 8);
    
    this.notifySubscribers();
  }

  // Search for a specific stock
  async searchStock(symbol) {
    // Clear current watchlist
    this.watchlist = [];
    
    // Add the searched stock
    this.addToWatchlist(symbol.toUpperCase());
    await this.fetchStockData(symbol.toUpperCase());
    
    this.notifySubscribers();
  }
}

export default new StockService();
