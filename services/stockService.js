class StockService {
  constructor() {
    this.watchlist = [];
    this.priceUpdateInterval = null;
    this.subscribers = [];
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
        high: 0,
        low: 0,
        volume: 0,
        lastUpdate: null
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
          const change = currentPrice - previousClose;
          const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
          
          this.watchlist[stockIndex] = {
            ...this.watchlist[stockIndex],
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            previousClose: previousClose,
            high: meta.regularMarketDayHigh || 0,
            low: meta.regularMarketDayLow || 0,
            volume: meta.regularMarketVolume || 0,
            lastUpdate: new Date()
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
      const change = (Math.random() - 0.5) * 20; // Random change between -10 to +10
      const changePercent = (change / basePrice) * 100;
      
      this.watchlist[stockIndex] = {
        ...this.watchlist[stockIndex],
        price: basePrice,
        change: change,
        changePercent: changePercent,
        previousClose: basePrice - change,
        high: basePrice + Math.random() * 10,
        low: basePrice - Math.random() * 10,
        volume: Math.floor(Math.random() * 1000000),
        lastUpdate: new Date()
      };
      
      this.notifySubscribers();
    }
  }

  // Fetch data for all stocks in watchlist
  async fetchAllStockData() {
    const promises = this.watchlist.map(stock => this.fetchStockData(stock.symbol));
    await Promise.all(promises);
  }

  // Start live price updates
  startLiveUpdates(intervalMs = 10000) {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    
    this.priceUpdateInterval = setInterval(() => {
      this.fetchAllStockData();
    }, intervalMs);
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
  }

  // Get historical data for Fibonacci calculations
  async getHistoricalData(symbol, period = '3mo') {
    try {
      // Using Yahoo Finance API for historical data
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`);
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
    
    for (let i = 90; i >= 0; i--) {
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

  // Get 8 most volatile stocks
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
    
    // Sort by absolute change percentage (most volatile first)
    this.watchlist.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    
    // Take only the top 8 most volatile
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
