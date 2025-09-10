import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StockService from '../services/stockService';
import {
  calculateFibonacciLevels,
  calculateSupportResistance,
  getCurrentLevel,
  formatPrice,
  getChangeColor
} from '../utils/fibonacciUtils';

const FibonacciLevels = ({ symbol, onBack }) => {
  const { theme } = useTheme();
  const [fibonacciData, setFibonacciData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      loadFibonacciData();
    }
  }, [symbol]);

  const loadFibonacciData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current stock data
      const watchlist = StockService.getWatchlist();
      const stock = watchlist.find(s => s.symbol === symbol);
      
      if (!stock) {
        setError('Stock not found in watchlist');
        setLoading(false);
        return;
      }

      setCurrentPrice(stock.price);

      // Get historical data for Fibonacci calculations
      const historicalData = await StockService.getHistoricalData(symbol, '3mo');
      
      if (historicalData.length === 0) {
        setError('No historical data available');
        setLoading(false);
        return;
      }

      // Calculate Fibonacci levels
      const { high, low, levels } = calculateSupportResistance(historicalData);
      
      setFibonacciData({
        high,
        low,
        levels,
        historicalData: historicalData.slice(-30) // Last 30 days for display
      });
    } catch (error) {
      console.error('Error loading Fibonacci data:', error);
      setError('Failed to load Fibonacci data');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (levelName, levelValue) => {
    if (!currentPrice) return '#757575';
    
    const diff = Math.abs(currentPrice - levelValue);
    const range = fibonacciData ? fibonacciData.high - fibonacciData.low : 1;
    const proximity = 1 - (diff / range);
    
    if (proximity > 0.8) return '#FF5722'; // Orange for very close
    if (proximity > 0.6) return '#FF9800'; // Amber for close
    if (proximity > 0.4) return '#FFC107'; // Yellow for moderate
    return '#757575'; // Gray for far
  };

  const getLevelStrength = (levelName) => {
    const strongLevels = ['38.2', '50', '61.8'];
    return strongLevels.includes(levelName) ? 'Strong' : 'Weak';
  };

  const renderFibonacciLevel = (levelName, levelValue) => {
    const isCurrentLevel = currentPrice && 
      Math.abs(currentPrice - levelValue) < (fibonacciData.high - fibonacciData.low) * 0.05;
    
    return (
      <View key={levelName} style={[
        [styles.levelItem, { backgroundColor: theme.colors.cardBackground }],
        isCurrentLevel && [styles.currentLevel, { borderColor: theme.colors.primary }]
      ]}>
        <View style={styles.levelHeader}>
          <Text style={[styles.levelName, { color: theme.colors.text }]}>{levelName}%</Text>
          <Text style={[styles.levelStrength, { color: theme.colors.textSecondary, backgroundColor: theme.colors.surfaceVariant }]}>
            {getLevelStrength(levelName)}
          </Text>
        </View>
        <View style={styles.levelContent}>
          <Text style={[
            styles.levelPrice,
            { color: getLevelColor(levelName, levelValue) }
          ]}>
            {formatPrice(levelValue)}
          </Text>
          {isCurrentLevel && (
            <View style={styles.currentIndicator}>
              <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} />
              <Text style={[styles.currentText, { color: theme.colors.primary }]}>Current Level</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPriceAnalysis = () => {
    if (!fibonacciData || !currentPrice) return null;

    const currentLevel = getCurrentLevel(currentPrice, fibonacciData.levels);
    
    return (
      <View style={[styles.analysisContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.analysisTitle, { color: theme.colors.text }]}>Price Analysis</Text>
        <View style={styles.analysisItem}>
          <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>Current Price:</Text>
          <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
            {formatPrice(currentPrice)}
          </Text>
        </View>
        <View style={styles.analysisItem}>
          <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>High (3 months):</Text>
          <Text style={[styles.analysisValue, { color: theme.colors.text }]}>{formatPrice(fibonacciData.high)}</Text>
        </View>
        <View style={styles.analysisItem}>
          <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>Low (3 months):</Text>
          <Text style={[styles.analysisValue, { color: theme.colors.text }]}>{formatPrice(fibonacciData.low)}</Text>
        </View>
        {currentLevel && (
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: theme.colors.textSecondary }]}>Between Levels:</Text>
            <Text style={[styles.analysisValue, { color: theme.colors.text }]}>
              {currentLevel.level}% - {currentLevel.level + 23.6}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading Fibonacci levels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
          Try refreshing or check your internet connection
        </Text>
      </View>
    );
  }

  if (!fibonacciData) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="trending-up" size={48} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No Fibonacci data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.headerText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.colors.headerText }]}>Fibonacci Retracement</Text>
          <Text style={[styles.subtitle, { color: theme.colors.headerText }]}>{symbol}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {renderPriceAnalysis()}

      <View style={styles.levelsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Retracement Levels</Text>
        {Object.entries(fibonacciData.levels)
          .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
          .map(([levelName, levelValue]) => 
            renderFibonacciLevel(levelName, levelValue)
          )}
      </View>

      <View style={[styles.infoContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>About Fibonacci Levels</Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Fibonacci retracement levels are horizontal lines that indicate where support and resistance are likely to occur. They are based on the key numbers identified by mathematician Leonardo Fibonacci.
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          The most important levels are 38.2%, 50%, and 61.8%, which often act as strong support or resistance levels.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
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
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  analysisContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelsContainer: {
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
  infoContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default FibonacciLevels;
