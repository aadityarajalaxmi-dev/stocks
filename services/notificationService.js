import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

class NotificationService {
  constructor() {
    this.notificationInterval = null;
    this.stockHistory = new Map(); // Store historical data for each stock
    this.timeframes = ['10min', '30min', '1hr', '3hr', '6hr', '24hr'];
  }

  // Start notification service
  async start() {
    // Request notification permissions
    await this.requestPermissions();
    
    const isEnabled = await this.getNotificationEnabled();
    if (isEnabled) {
      const interval = await this.getNotificationInterval();
      this.scheduleNotifications(interval);
    }
  }

  // Request notification permissions
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    return true;
  }

  // Stop notification service
  stop() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }

  // Get notification enabled status
  async getNotificationEnabled() {
    try {
      const enabled = await AsyncStorage.getItem('notificationsEnabled');
      return enabled ? JSON.parse(enabled) : false;
    } catch (error) {
      console.error('Error getting notification enabled status:', error);
      return false;
    }
  }

  // Get notification interval
  async getNotificationInterval() {
    try {
      const interval = await AsyncStorage.getItem('notificationInterval');
      return interval || '10min';
    } catch (error) {
      console.error('Error getting notification interval:', error);
      return '10min';
    }
  }

  // Schedule notifications based on interval
  scheduleNotifications(interval) {
    this.stop(); // Clear existing interval

    const intervalMs = this.getIntervalMs(interval);
    if (intervalMs > 0) {
      this.notificationInterval = setInterval(() => {
        this.checkAndShowNotifications();
      }, intervalMs);
    }
  }

  // Convert interval string to milliseconds
  getIntervalMs(interval) {
    const intervals = {
      '5min': 5 * 60 * 1000,
      '10min': 10 * 60 * 1000,
      '30min': 30 * 60 * 1000,
      '1hr': 60 * 60 * 1000,
      '3hr': 3 * 60 * 60 * 1000,
      '6hr': 6 * 60 * 60 * 1000,
      '24hr': 24 * 60 * 60 * 1000,
    };
    return intervals[interval] || 10 * 60 * 1000; // Default to 10 minutes
  }

  // Update stock data for tracking changes
  updateStockData(stocks) {
    const now = new Date();
    
    stocks.forEach(stock => {
      if (!this.stockHistory.has(stock.symbol)) {
        this.stockHistory.set(stock.symbol, []);
      }
      
      const history = this.stockHistory.get(stock.symbol);
      history.push({
        price: stock.price,
        changePercent: stock.changePercent,
        timestamp: now
      });
      
      // Keep only last 24 hours of data
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const filteredHistory = history.filter(entry => entry.timestamp > oneDayAgo);
      this.stockHistory.set(stock.symbol, filteredHistory);
    });
  }

  // Calculate percentage change for a specific timeframe
  calculateChangeForTimeframe(stockSymbol, timeframe) {
    const history = this.stockHistory.get(stockSymbol);
    if (!history || history.length < 2) return null;

    const now = new Date();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const cutoffTime = new Date(now.getTime() - timeframeMs);
    
    // Find the closest data point to the cutoff time
    const relevantData = history.filter(entry => entry.timestamp >= cutoffTime);
    if (relevantData.length < 2) return null;

    const latest = relevantData[relevantData.length - 1];
    const earliest = relevantData[0];
    
    const changePercent = ((latest.price - earliest.price) / earliest.price) * 100;
    
    return {
      symbol: stockSymbol,
      changePercent: changePercent,
      currentPrice: latest.price,
      previousPrice: earliest.price,
      timeframe: timeframe
    };
  }

  // Convert timeframe string to milliseconds
  getTimeframeMs(timeframe) {
    const timeframes = {
      '10min': 10 * 60 * 1000,
      '30min': 30 * 60 * 1000,
      '1hr': 60 * 60 * 1000,
      '3hr': 3 * 60 * 60 * 1000,
      '6hr': 6 * 60 * 60 * 1000,
      '24hr': 24 * 60 * 60 * 1000,
    };
    return timeframes[timeframe] || 0;
  }

  // Check and show notifications for the single highest performing stock
  async checkAndShowNotifications() {
    const isEnabled = await this.getNotificationEnabled();
    if (!isEnabled) return;

    // Find the single highest performing stock across all timeframes
    const highestPerformer = this.getHighestPerformingStock();
    
    if (highestPerformer) {
      this.showNotificationAlert([highestPerformer]);
    }
  }

  // Get the single highest performing stock across all timeframes
  getHighestPerformingStock() {
    let highestPerformer = null;
    let maxAbsChange = 0;

    // Check all stocks across all timeframes
    for (const [symbol] of this.stockHistory) {
      for (const timeframe of this.timeframes) {
        const change = this.calculateChangeForTimeframe(symbol, timeframe);
        if (change && Math.abs(change.changePercent) > maxAbsChange) {
          maxAbsChange = Math.abs(change.changePercent);
          highestPerformer = change;
        }
      }
    }

    // Only return if change is significant (more than 1%)
    return maxAbsChange > 1 ? highestPerformer : null;
  }

  // Get the stock with greatest change for a specific timeframe
  getGreatestChangeForTimeframe(timeframe) {
    let greatestChange = null;
    let maxAbsChange = 0;

    for (const [symbol] of this.stockHistory) {
      const change = this.calculateChangeForTimeframe(symbol, timeframe);
      if (change && Math.abs(change.changePercent) > maxAbsChange) {
        maxAbsChange = Math.abs(change.changePercent);
        greatestChange = change;
      }
    }

    // Only return if change is significant (more than 1%)
    return maxAbsChange > 1 ? greatestChange : null;
  }

  // Show external notification
  async showNotificationAlert(notifications) {
    const notification = notifications[0]; // Only one notification now
    const changeText = notification.changePercent >= 0 ? '+' : '';
    const timeframeText = this.formatTimeframe(notification.timeframe);
    
    const title = '📈 Stock Alert - Top Performer';
    const body = `${notification.symbol} is the highest performing stock!\n` +
                 `Change: ${changeText}${notification.changePercent.toFixed(1)}%\n` +
                 `Timeframe: ${timeframeText}\n` +
                 `Current Price: $${notification.currentPrice.toFixed(1)}`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Format timeframe for display
  formatTimeframe(timeframe) {
    const formats = {
      '10min': '10m',
      '30min': '30m',
      '1hr': '1h',
      '3hr': '3h',
      '6hr': '6h',
      '24hr': '24h',
    };
    return formats[timeframe] || timeframe;
  }

  // Get current notifications (for display)
  getCurrentNotifications() {
    const highestPerformer = this.getHighestPerformingStock();
    return highestPerformer ? [highestPerformer] : [];
  }

  // Restart notifications with new settings
  async restart() {
    this.stop();
    await this.start();
  }
}

export default new NotificationService();
