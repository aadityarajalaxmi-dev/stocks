import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import NewsService from '../services/newsService';
import StockService from '../services/stockService';
import {
  calculateFibonacciLevels,
  calculateSupportResistance,
  getCurrentLevel,
  formatPrice,
  getChangeColor,
  calculateRSI,
  calculateMACD
} from '../utils/fibonacciUtils';
import { RSIChart, MACDChart } from './TechnicalCharts';
import PriceChart from './PriceChart';
import DetailedPriceChart from './DetailedPriceChart';
import StockHeader from './StockHeader';
import AdBanner from './AdBanner';

// News Content Component
const NewsContent = ({ symbol, theme }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      loadNews();
    }
    
    // Set up hourly news refresh
    const refreshInterval = setInterval(() => {
      loadNews();
    }, 3600000); // 1 hour = 3600000 ms
    
    return () => clearInterval(refreshInterval);
  }, [symbol]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newsData = await NewsService.getNewsForStock(symbol);
      setNews(newsData);
    } catch (error) {
      console.error('Error loading news:', error);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const formatTimeAgo = (date) => {
    if (!date || !(date instanceof Date)) {
      return 'Unknown time';
    }
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return theme.colors.textSecondary;
    
    switch (sentiment) {
      case 'positive':
        return '#4CAF50';
      case 'negative':
        return '#F44336';
      case 'neutral':
      default:
        return theme.colors.textSecondary;
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return 'remove';
    
    switch (sentiment) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      case 'neutral':
      default:
        return 'remove';
    }
  };

  const handleNewsPress = async (item) => {
    if (item.url) {
      try {
        const supported = await Linking.canOpenURL(item.url);
        if (supported) {
          await Linking.openURL(item.url);
        } else {
          Alert.alert(
            'Cannot Open Link',
            'This link cannot be opened on your device.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert(
          'Error',
          'Failed to open the article. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert(
        item.title || 'News Article',
        item.summary || 'No summary available',
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Read More', onPress: () => {
            console.log('Opening article:', item.title);
          }}
        ]
      );
    }
  };

  const renderNewsItem = (item) => {
    if (!item || !item.id) {
      return null;
    }
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.newsItem, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.newsHeader}>
          <View style={styles.newsTitleContainer}>
            <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title || 'No title available'}
            </Text>
            <View style={styles.newsMeta}>
              <Text style={[styles.newsSource, { color: theme.colors.textSecondary }]}>
                {item.source || 'Unknown source'}
              </Text>
              <Text style={[styles.newsTime, { color: theme.colors.textTertiary }]}>
                {formatTimeAgo(item.publishedAt)}
              </Text>
            </View>
          </View>
          <View style={styles.sentimentContainer}>
            <Ionicons
              name={getSentimentIcon(item.sentiment)}
              size={20}
              color={getSentimentColor(item.sentiment)}
            />
          </View>
        </View>
        
        <Text style={[styles.newsSummary, { color: theme.colors.textSecondary }]} numberOfLines={3}>
          {item.summary || 'No summary available'}
        </Text>
        
        <View style={styles.newsFooter}>
          <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(item.sentiment) + '20' }]}>
            <Text style={[styles.sentimentText, { color: getSentimentColor(item.sentiment) }]}>
              {item.sentiment ? item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1) : 'Unknown'}
            </Text>
          </View>
          <View style={styles.linkIndicator}>
            <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {item.url ? 'Tap to read' : 'Tap for details'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading news...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.newsList}>
        {news.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
              No news available
            </Text>
          </View>
        ) : (
          news.map((item, index) => (
            <View key={item.id || index}>
              {renderNewsItem(item)}
              {/* Show ad after every 3rd news article */}
              {(index + 1) % 3 === 0 && (
                <AdBanner 
                  style={styles.adBannerSpacing}
                  size="banner"
                />
              )}
            </View>
          ))
        )}
        
        {/* Final ad at the bottom if we have news */}
        {news.length > 0 && (
          <AdBanner 
            style={styles.finalAdBanner}
            size="mediumRectangle"
          />
        )}
      </View>
    </ScrollView>
  );
};

// Technical Analysis Content Component
const TechnicalContent = ({ symbol, stock, theme }) => {
  const [fibonacciData, setFibonacciData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rsiData, setRsiData] = useState(null);
  const [macdData, setMacdData] = useState(null);
  const [shimmerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (symbol) {
      loadTechnicalData();
    }
  }, [symbol]);

  useEffect(() => {
    // Update current price when stock prop changes (real-time updates)
    if (stock && stock.price) {
      setCurrentPrice(stock.price);
    }
  }, [stock]);

  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startShimmer();
  }, [shimmerAnim]);

  const loadTechnicalData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const watchlist = StockService.getWatchlist();
      const stock = watchlist.find(s => s.symbol === symbol);
      
      if (!stock) {
        setError('Stock not found in watchlist');
        setLoading(false);
        return;
      }

      setCurrentPrice(stock?.price || 0);
      const historicalData = await StockService.getHistoricalData(symbol, '6mo');
      
      if (historicalData.length === 0) {
        setError('No historical data available');
        setLoading(false);
        return;
      }

      const { high, low, levels } = calculateSupportResistance(historicalData);
      const closePrices = historicalData.map(day => day.close);
      const rsiValues = calculateRSI(closePrices, 14);
      const macdValues = calculateMACD(closePrices, 12, 26, 9);
      
      setFibonacciData({
        high,
        low,
        levels,
        historicalData: historicalData.slice(-30)
      });
      
      setRsiData(rsiValues.slice(-30));
      setMacdData({
        macd: macdValues.macd.slice(-30),
        signal: macdValues.signal.slice(-30),
        histogram: macdValues.histogram.slice(-30)
      });
    } catch (error) {
      console.error('Error loading technical data:', error);
      setError('Failed to load technical data');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (levelName, levelValue) => {
    if (!currentPrice) return '#757575';
    
    if (levelName === '61.8') return '#FFD700';
    
    const diff = Math.abs(currentPrice - levelValue);
    const range = fibonacciData ? fibonacciData.high - fibonacciData.low : 1;
    const proximity = 1 - (diff / range);
    
    if (proximity > 0.8) return '#FF5722';
    if (proximity > 0.6) return '#FF9800';
    if (proximity > 0.4) return '#FFC107';
    return '#757575';
  };

  const getLevelStrength = (levelName) => {
    const strongLevels = ['38.2', '50', '61.8'];
    return strongLevels.includes(levelName) ? 'Strong' : 'Weak';
  };

  const renderFibonacciLevel = (levelName, levelValue) => {
    const currentLevel = getCurrentLevel(currentPrice, fibonacciData?.levels || {});
    const isCurrentLevel = currentLevel && currentLevel.level === parseFloat(levelName);
    const shouldShowCurrentLevel = isCurrentLevel;
    const isGoldLevel = levelName === '61.8';
    
    return (
      <View key={levelName} style={[
        [styles.levelItem, { backgroundColor: theme.colors.cardBackground }],
        shouldShowCurrentLevel && [styles.currentLevel, { borderColor: theme.colors.primary }],
        isGoldLevel && styles.goldLevel
      ]}>
        {isGoldLevel && (
          <Animated.View 
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.8, 0.3],
                }),
                transform: [{
                  translateX: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 100],
                  })
                }]
              }
            ]}
          />
        )}
        <View style={styles.levelHeader}>
          <Text style={[
            styles.levelName, 
            { color: theme.colors.text },
            isGoldLevel && styles.goldText
          ]}>
            {levelName}%
          </Text>
          <Text style={[
            styles.levelStrength, 
            { color: theme.colors.textSecondary, backgroundColor: theme.colors.surfaceVariant },
            isGoldLevel && styles.goldStrength
          ]}>
            {getLevelStrength(levelName)}
          </Text>
        </View>
        <View style={styles.levelContent}>
          <Text style={[
            styles.levelPrice,
            { color: getLevelColor(levelName, levelValue) },
            isGoldLevel && styles.goldPrice
          ]}>
            {formatPrice(levelValue)}
          </Text>
          {shouldShowCurrentLevel && (
            <View style={styles.currentIndicator}>
              <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} />
              <Text style={[styles.currentText, { color: theme.colors.primary }]}>Current Level</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading technical analysis...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!fibonacciData) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="trending-up" size={48} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No technical data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Candlestick Chart Section */}
      <View style={styles.chartContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Price Chart</Text>
        <View style={[styles.chartWrapper, { backgroundColor: theme.colors.cardBackground }]}>
          <DetailedPriceChart 
            stock={stock || { symbol, price: currentPrice }} 
            timeframe="1D"
          />
        </View>
      </View>

      <View style={styles.levelsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Fibonacci Retracement Levels</Text>
        {Object.entries(fibonacciData.levels)
          .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
          .map(([levelName, levelValue]) => 
            renderFibonacciLevel(levelName, levelValue)
          )}
      </View>

      <View style={styles.indicatorsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Technical Indicators</Text>
        
        {rsiData && rsiData.length > 0 && (
          <RSIChart rsiData={rsiData} theme={theme} />
        )}
        
        {macdData && macdData.macd && macdData.macd.length > 0 && (
          <MACDChart macdData={macdData} theme={theme} />
        )}
      </View>
    </ScrollView>
  );
};

// Financials Content Component
const FinancialsContent = ({ symbol, theme }) => {
  const [financialData, setFinancialData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      loadFinancialData();
    }
  }, [symbol]);

  const loadFinancialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate mock financial data for demo
      const mockFinancials = generateMockFinancialData(symbol);
      const mockEarnings = generateMockEarningsData(symbol);
      
      setFinancialData(mockFinancials);
      setEarningsData(mockEarnings);
    } catch (error) {
      console.error('Error loading financial data:', error);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockFinancialData = (symbol) => {
    const baseRevenue = 50 + Math.random() * 200; // $50B - $250B
    const revenueGrowth = (Math.random() - 0.3) * 30; // -30% to +20% growth
    const netIncome = baseRevenue * (0.05 + Math.random() * 0.25); // 5-30% margin
    const eps = 2 + Math.random() * 20; // $2-$22 EPS
    const peRatio = 10 + Math.random() * 40; // P/E 10-50
    
    return {
      revenue: baseRevenue,
      revenueGrowth: revenueGrowth,
      netIncome: netIncome,
      grossMargin: 20 + Math.random() * 60, // 20-80%
      operatingMargin: 5 + Math.random() * 30, // 5-35%
      netMargin: (netIncome / baseRevenue) * 100,
      eps: eps,
      peRatio: peRatio,
      pbRatio: 1 + Math.random() * 8, // P/B 1-9
      debtToEquity: Math.random() * 2, // 0-200%
      currentRatio: 0.5 + Math.random() * 3, // 0.5-3.5
      roe: 5 + Math.random() * 25, // 5-30% ROE
      roa: 2 + Math.random() * 15, // 2-17% ROA
      freeCashFlow: netIncome * (0.8 + Math.random() * 0.4), // 80-120% of net income
      lastUpdated: new Date()
    };
  };

  const generateMockEarningsData = (symbol) => {
    const quarters = ['Q4 2024', 'Q3 2024', 'Q2 2024', 'Q1 2024'];
    const earningsHistory = quarters.map((quarter, index) => {
      const baseEps = 2 + Math.random() * 5;
      const estimate = baseEps + (Math.random() - 0.5) * 0.5;
      const actual = baseEps + (Math.random() - 0.3) * 0.3;
      const surprise = actual - estimate;
      
      return {
        quarter,
        date: new Date(2024, 9 - index * 3, 15 + Math.random() * 15),
        epsEstimate: estimate,
        epsActual: actual,
        epsSurprise: surprise,
        revenueEstimate: 20 + Math.random() * 10,
        revenueActual: 20 + Math.random() * 12,
        guidance: index === 0 ? 'Raised' : Math.random() > 0.5 ? 'Maintained' : 'Lowered'
      };
    });

    // Next earnings date
    const nextEarnings = {
      date: new Date(Date.now() + (Math.random() * 90 + 10) * 24 * 60 * 60 * 1000),
      epsEstimate: 2.5 + Math.random() * 3,
      revenueEstimate: 25 + Math.random() * 10,
      confirmed: Math.random() > 0.3
    };

    return {
      history: earningsHistory,
      nextEarnings: nextEarnings,
      analystRatings: {
        buy: Math.floor(8 + Math.random() * 15),
        hold: Math.floor(5 + Math.random() * 10),
        sell: Math.floor(0 + Math.random() * 5)
      }
    };
  };

  const formatCurrency = (amount, unit = 'B') => {
    return `$${amount.toFixed(1)}${unit}`;
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading financial data...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!financialData || !earningsData) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="analytics" size={48} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No financial data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Key Financial Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Revenue (TTM)</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>{formatCurrency(financialData.revenue)}</Text>
            <Text style={[styles.metricChange, { color: financialData.revenueGrowth >= 0 ? theme.colors.positive : theme.colors.negative }]}>
              {formatPercentage(financialData.revenueGrowth)} YoY
            </Text>
          </View>
          
          <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Net Income</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>{formatCurrency(financialData.netIncome)}</Text>
            <Text style={[styles.metricChange, { color: theme.colors.textSecondary }]}>
              {financialData.netMargin.toFixed(1)}% Margin
            </Text>
          </View>
          
          <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>EPS (TTM)</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>${financialData.eps.toFixed(2)}</Text>
            <Text style={[styles.metricChange, { color: theme.colors.textSecondary }]}>
              P/E: {financialData.peRatio.toFixed(1)}
            </Text>
          </View>
          
          <View style={[styles.metricCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Free Cash Flow</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>{formatCurrency(financialData.freeCashFlow)}</Text>
            <Text style={[styles.metricChange, { color: theme.colors.positive }]}>
              ROE: {financialData.roe.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Next Earnings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Next Earnings</Text>
        <View style={[styles.earningsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.earningsHeader}>
            <Text style={[styles.earningsDate, { color: theme.colors.text }]}>
              {earningsData.nextEarnings.date.toLocaleDateString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: earningsData.nextEarnings.confirmed ? theme.colors.positive : theme.colors.warning }]}>
              <Text style={[styles.statusText, { color: theme.colors.background }]}>
                {earningsData.nextEarnings.confirmed ? 'Confirmed' : 'Estimated'}
              </Text>
            </View>
          </View>
          <View style={styles.earningsDetails}>
            <View style={styles.earningsRow}>
              <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>EPS Estimate:</Text>
              <Text style={[styles.earningsValue, { color: theme.colors.text }]}>
                ${earningsData.nextEarnings.epsEstimate.toFixed(2)}
              </Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>Revenue Estimate:</Text>
              <Text style={[styles.earningsValue, { color: theme.colors.text }]}>
                {formatCurrency(earningsData.nextEarnings.revenueEstimate)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Earnings History */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Earnings</Text>
        {earningsData.history.map((earnings, index) => (
          <View key={index} style={[styles.earningsHistoryCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.earningsHistoryHeader}>
              <Text style={[styles.quarterText, { color: theme.colors.text }]}>{earnings.quarter}</Text>
              <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
                {earnings.date.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.earningsHistoryContent}>
              <View style={styles.earningsRow}>
                <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>EPS:</Text>
                <View style={styles.earningsComparison}>
                  <Text style={[styles.earningsValue, { color: theme.colors.text }]}>
                    ${earnings.epsActual.toFixed(2)}
                  </Text>
                  <Text style={[styles.earningsEstimate, { color: theme.colors.textTertiary }]}>
                    vs ${earnings.epsEstimate.toFixed(2)}
                  </Text>
                  <Text style={[styles.earningsSurprise, { 
                    color: earnings.epsSurprise >= 0 ? theme.colors.positive : theme.colors.negative 
                  }]}>
                    ({earnings.epsSurprise >= 0 ? '+' : ''}{earnings.epsSurprise.toFixed(2)})
                  </Text>
                </View>
              </View>
              <View style={styles.earningsRow}>
                <Text style={[styles.earningsLabel, { color: theme.colors.textSecondary }]}>Guidance:</Text>
                <Text style={[styles.guidanceText, { 
                  color: earnings.guidance === 'Raised' ? theme.colors.positive : 
                        earnings.guidance === 'Lowered' ? theme.colors.negative : theme.colors.textSecondary 
                }]}>
                  {earnings.guidance}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Analyst Ratings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Analyst Ratings</Text>
        <View style={[styles.ratingsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.ratingsRow}>
            <View style={styles.ratingItem}>
              <Text style={[styles.ratingCount, { color: theme.colors.positive }]}>
                {earningsData.analystRatings.buy}
              </Text>
              <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>Buy</Text>
            </View>
            <View style={styles.ratingItem}>
              <Text style={[styles.ratingCount, { color: theme.colors.warning }]}>
                {earningsData.analystRatings.hold}
              </Text>
              <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>Hold</Text>
            </View>
            <View style={styles.ratingItem}>
              <Text style={[styles.ratingCount, { color: theme.colors.negative }]}>
                {earningsData.analystRatings.sell}
              </Text>
              <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>Sell</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const StockDetailTabs = ({ symbol, stock, onBack }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('news'); // 'news', 'technical', or 'financials'
  const [currentStock, setCurrentStock] = useState(stock);

  const tabs = [
    { id: 'news', label: 'News', icon: 'newspaper-outline' },
    { id: 'technical', label: 'Analysis', icon: 'trending-up-outline' },
    { id: 'financials', label: 'Financials', icon: 'analytics-outline' }
  ];

  useEffect(() => {
    // Subscribe to stock updates for real-time price changes
    const unsubscribe = StockService.subscribe((updatedWatchlist) => {
      const updatedStock = updatedWatchlist.find(s => s.symbol === symbol);
      if (updatedStock) {
        setCurrentStock(updatedStock);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [symbol]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'news':
        return <NewsContent symbol={symbol} theme={theme} />;
      case 'technical':
        return <TechnicalContent symbol={symbol} stock={currentStock} theme={theme} />;
      case 'financials':
        return <FinancialsContent symbol={symbol} theme={theme} />;
      default:
        return <NewsContent symbol={symbol} theme={theme} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StockHeader stock={currentStock} onBack={onBack} />
      
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.activeTab, { backgroundColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? theme.colors.background : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === tab.id ? theme.colors.background : theme.colors.textSecondary,
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal'
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  tabContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  // News styles
  newsList: {
    padding: 16,
  },
  newsItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  newsSource: {
    fontSize: 12,
    fontWeight: '500',
  },
  newsTime: {
    fontSize: 12,
  },
  sentimentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Technical Analysis styles
  chartContainer: {
    margin: 16,
  },
  chartWrapper: {
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  levelsContainer: {
    margin: 16,
  },
  indicatorsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  levelItem: {
    marginBottom: 8,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentLevel: {
    borderWidth: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelStrength: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  // Chrome Gold Effect Styles
  goldLevel: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  goldText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  goldPrice: {
    color: '#FFD700',
    fontWeight: 'bold',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  goldStrength: {
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    fontWeight: 'bold',
  },
  // Financials styles
  section: {
    margin: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  earningsCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  earningsDetails: {
    gap: 8,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  earningsHistoryCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quarterText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
  },
  earningsHistoryContent: {
    gap: 8,
  },
  earningsComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningsEstimate: {
    fontSize: 12,
  },
  earningsSurprise: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  guidanceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ratingsCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  adBannerSpacing: {
    marginTop: 16,
    marginBottom: 8,
  },
  finalAdBanner: {
    marginTop: 20,
    marginBottom: 16,
  },
});

export default StockDetailTabs;
