import { Alert } from 'react-native';

class NewsService {
  constructor() {
    this.newsCache = new Map();
    this.updateInterval = null;
    this.subscribers = new Set();
  }

  // Generate time-based news templates
  getTimeBasedTemplates(symbol, hour, isWeekend) {
    const baseTemplates = [
      {
        title: `${symbol} reports strong quarterly earnings`,
        summary: `The company exceeded analyst expectations with revenue growth of 15% year-over-year.`,
        source: 'Financial Times',
        sentiment: 'positive',
        url: `https://www.ft.com/content/${symbol.toLowerCase()}-earnings-${Date.now()}`
      },
      {
        title: `${symbol} announces new product launch`,
        summary: `The company unveiled its latest innovation that could revolutionize the market.`,
        source: 'Reuters',
        sentiment: 'positive',
        url: `https://www.reuters.com/business/${symbol.toLowerCase()}-product-launch-${Date.now()}`
      },
      {
        title: `Analysts upgrade ${symbol} price target`,
        summary: `Multiple analysts have raised their price targets following recent developments.`,
        source: 'Bloomberg',
        sentiment: 'positive',
        url: `https://www.bloomberg.com/news/articles/${symbol.toLowerCase()}-upgrade-${Date.now()}`
      },
      {
        title: `${symbol} faces regulatory challenges`,
        summary: `The company is dealing with new regulatory requirements that may impact operations.`,
        source: 'Wall Street Journal',
        sentiment: 'negative',
        url: `https://www.wsj.com/articles/${symbol.toLowerCase()}-regulatory-${Date.now()}`
      },
      {
        title: `${symbol} partners with major tech company`,
        summary: `Strategic partnership announced that could boost market presence significantly.`,
        source: 'TechCrunch',
        sentiment: 'positive',
        url: `https://techcrunch.com/${symbol.toLowerCase()}-partnership-${Date.now()}`
      },
      {
        title: `Market volatility affects ${symbol} trading`,
        summary: `Recent market conditions have led to increased trading volume and price fluctuations.`,
        source: 'MarketWatch',
        sentiment: 'neutral',
        url: `https://www.marketwatch.com/story/${symbol.toLowerCase()}-volatility-${Date.now()}`
      }
    ];

    // Add time-specific templates
    const timeSpecificTemplates = [];
    
    if (hour >= 6 && hour < 12) {
      // Morning news
      timeSpecificTemplates.push({
        title: `${symbol} opens higher in pre-market trading`,
        summary: `Early trading shows strong momentum with increased volume and positive sentiment.`,
        source: 'CNBC',
        sentiment: 'positive',
        url: `https://www.cnbc.com/${symbol.toLowerCase()}-premarket-${Date.now()}`
      });
    } else if (hour >= 12 && hour < 18) {
      // Afternoon news
      timeSpecificTemplates.push({
        title: `${symbol} maintains momentum during midday trading`,
        summary: `The stock continues to show strength with institutional buying interest.`,
        source: 'Yahoo Finance',
        sentiment: 'positive',
        url: `https://finance.yahoo.com/news/${symbol.toLowerCase()}-midday-${Date.now()}`
      });
    } else if (hour >= 18 && hour < 22) {
      // Evening news
      timeSpecificTemplates.push({
        title: `${symbol} closes with mixed signals`,
        summary: `After-hours trading shows cautious optimism following today's market session.`,
        source: 'MarketWatch',
        sentiment: 'neutral',
        url: `https://www.marketwatch.com/story/${symbol.toLowerCase()}-close-${Date.now()}`
      });
    } else {
      // Night/early morning news
      timeSpecificTemplates.push({
        title: `${symbol} shows overnight activity`,
        summary: `International markets and after-hours trading indicate continued interest.`,
        source: 'Reuters',
        sentiment: 'neutral',
        url: `https://www.reuters.com/business/${symbol.toLowerCase()}-overnight-${Date.now()}`
      });
    }

    if (isWeekend) {
      timeSpecificTemplates.push({
        title: `${symbol} weekend analysis: Market outlook`,
        summary: `Analysts weigh in on the stock's performance and future prospects.`,
        source: 'Seeking Alpha',
        sentiment: 'neutral',
        url: `https://seekingalpha.com/article/${symbol.toLowerCase()}-weekend-${Date.now()}`
      });
    }

    return [...baseTemplates, ...timeSpecificTemplates];
  }

  // Mock news data for demonstration
  getMockNews(symbol) {
    if (!symbol) {
      console.warn('No symbol provided to getMockNews');
      return [];
    }
    
    // Generate time-based content variations
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Get time-based templates
    const newsTemplates = this.getTimeBasedTemplates(symbol, hour, isWeekend);

    // Return 3-5 random news items with fresh timestamps
    const numItems = Math.floor(Math.random() * 3) + 3;
    return newsTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, numItems)
      .map((news, index) => {
        // Generate fresh timestamps within the last hour
        const minutesAgo = Math.floor(Math.random() * 60); // 0-59 minutes ago
        const publishedAt = new Date(now.getTime() - (minutesAgo * 60 * 1000));
        
        return {
          ...news,
          id: `${symbol}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          publishedAt: publishedAt
        };
      });
  }

  async getNewsForStock(symbol) {
    try {
      // Check cache first
      if (this.newsCache.has(symbol)) {
        const cached = this.newsCache.get(symbol);
        const now = new Date();
        const cacheAge = now - cached.timestamp;
        
        // Return cached data if less than 1 hour old
        if (cacheAge < 3600000) { // 1 hour = 3600000 ms
          return cached.news;
        }
      }

      // In a real app, you would fetch from a news API here
      // For now, we'll use mock data with fresh timestamps
      const news = this.getMockNews(symbol);
      
      // Cache the news
      this.newsCache.set(symbol, {
        news,
        timestamp: new Date()
      });

      return news;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  async getAllNews() {
    try {
      // In a real implementation, you would fetch news for all stocks in watchlist
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching all news:', error);
      return [];
    }
  }

  startLiveUpdates(intervalMs = 3600000) { // 1 hour default
    this.updateInterval = setInterval(() => {
      // Clear cache to force fresh news
      this.clearCache();
      this.notifySubscribers();
    }, intervalMs);
  }

  stopLiveUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in news subscriber callback:', error);
      }
    });
  }

  clearCache() {
    this.newsCache.clear();
  }

  getCachedNews(symbol) {
    return this.newsCache.get(symbol)?.news || [];
  }
}

export default new NewsService();
