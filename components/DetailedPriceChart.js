import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StockService from '../services/stockService';

const { width: screenWidth } = Dimensions.get('window');

const DetailedPriceChart = ({ stock, timeframe = '1D' }) => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedInterval, setSelectedInterval] = useState('5m');
  const [dragPosition, setDragPosition] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Historical data period filters
  const timeframes = [
    { key: '1D', label: '1D' },
    { key: '7D', label: '7D' },
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
  ];

  // Candlestick interval filters
  const intervals = [
    { key: '1m', label: '1m' },
    { key: '5m', label: '5m' },
    { key: '15m', label: '15m' },
    { key: '1h', label: '1h' },
    { key: '4h', label: '4h' },
    { key: '1d', label: '1d' },
  ];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      const { locationX, locationY } = evt.nativeEvent;
      const chartWidth = screenWidth - 100;
      const chartHeight = 200;
      
      setDragPosition({ x: locationX, y: locationY });
      updateTooltipData(locationX, locationY, chartWidth, chartHeight);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const chartWidth = screenWidth - 100;
      const chartHeight = 200;
      
      setDragPosition({ x: locationX, y: locationY });
      updateTooltipData(locationX, locationY, chartWidth, chartHeight);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
      // Keep tooltip visible for a moment after drag ends
      setTimeout(() => {
        setDragPosition(null);
        setTooltipData(null);
      }, 2000);
    },
  });

  const updateTooltipData = (x, y, chartWidth, chartHeight) => {
    // Calculate which candle is closest to the drag position
    const candleIndex = Math.round((x / chartWidth) * (chartData.length - 1));
    const candle = chartData[candleIndex];
    
    if (candle) {
      // Calculate price at the Y position
      const allPrices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice;
      
      const priceAtY = maxPrice - (y / chartHeight) * priceRange;
      
      setTooltipData({
        candle,
        price: priceAtY,
        date: candle.date,
        index: candleIndex
      });
    }
  };

  useEffect(() => {
    loadChartData();
  }, [stock, selectedTimeframe, selectedInterval]);

  const loadChartData = async () => {
    if (!stock) return;
    
    setLoading(true);
    try {
      // Get historical data from StockService
      const historicalData = await StockService.getHistoricalData(stock.symbol, '6mo');
      
      if (historicalData && historicalData.length > 0) {
        // Filter data based on selected timeframe
        let filteredData = historicalData;
        const now = new Date();
        
        // Generate data based on timeframe and interval
        filteredData = generateCandlestickData(stock, selectedTimeframe, selectedInterval);
        
        setChartData(filteredData);
      } else {
        // Generate mock data if no historical data available
        setChartData(generateMockChartData());
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData(generateMockChartData());
    } finally {
      setLoading(false);
    }
  };

  const generateCandlestickData = (stock, timeframe, interval) => {
    if (!stock) return [];

    const currentPrice = stock.price;
    const volatility = Math.abs(stock.changePercent) / 100;
    
    // Determine number of candles based on timeframe and interval
    const candleConfig = getCandleConfiguration(timeframe, interval);
    const numCandles = candleConfig.count;
    const intervalMs = candleConfig.intervalMs;
    
    const candleData = [];
    let price = currentPrice * (1 - (stock.changePercent / 100)); // Start from beginning of period
    const now = new Date();
    
    for (let i = 0; i < numCandles; i++) {
      const candleStartTime = new Date(now.getTime() - (numCandles - i) * intervalMs);
      
      // Generate realistic price movements within the candle
      const trendDirection = stock.changePercent > 0 ? 1 : -1;
      const progressThroughPeriod = i / (numCandles - 1);
      
      // Base movement includes trend + some randomness
      const trendMovement = (stock.changePercent / 100) * (currentPrice * progressThroughPeriod / numCandles);
      const randomMovement = (Math.random() - 0.5) * volatility * currentPrice * 0.1;
      
      const open = price;
      const close = price + trendMovement + randomMovement;
      
      // Generate high and low based on interval volatility
      const intervalVolatility = getIntervalVolatility(interval) * currentPrice;
      const high = Math.max(open, close) + Math.random() * intervalVolatility;
      const low = Math.min(open, close) - Math.random() * intervalVolatility;
      
      candleData.push({
        date: candleStartTime,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
      
      price = close;
    }
    
    return candleData;
  };

  const getCandleConfiguration = (timeframe, interval) => {
    // Convert interval to milliseconds
    const intervalMap = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    
    const intervalMs = intervalMap[interval] || intervalMap['5m'];
    
    // Determine number of candles based on timeframe
    const timeframeMap = {
      '1D': 24 * 60 * 60 * 1000,       // 1 day
      '7D': 7 * 24 * 60 * 60 * 1000,   // 7 days
      '1M': 30 * 24 * 60 * 60 * 1000,  // 30 days
      '3M': 90 * 24 * 60 * 60 * 1000   // 90 days
    };
    
    const timeframeMs = timeframeMap[timeframe] || timeframeMap['1D'];
    const count = Math.min(Math.floor(timeframeMs / intervalMs), 200); // Cap at 200 candles for performance
    
    return { count, intervalMs };
  };

  const getIntervalVolatility = (interval) => {
    // Different intervals have different typical volatility ranges
    const volatilityMap = {
      '1m': 0.002,   // 0.2% typical range
      '5m': 0.005,   // 0.5% typical range
      '15m': 0.01,   // 1% typical range
      '1h': 0.02,    // 2% typical range
      '4h': 0.04,    // 4% typical range
      '1d': 0.08     // 8% typical range
    };
    
    return volatilityMap[interval] || volatilityMap['5m'];
  };

  const generateIntradayData = (stock) => {
    const data = [];
    const basePrice = stock.price || 100;
    const volatility = Math.abs((stock.changePercent || 5)) / 100;
    let currentPrice = basePrice - (stock.change || 0); // Start from previous close
    
    // Generate 24 hours of hourly data
    for (let i = 0; i < 24; i++) {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      
      const progress = i / 23;
      const randomChange = (Math.random() - 0.5) * volatility * basePrice * 0.03;
      const trendChange = (stock.change || 0) * progress;
      
      const open = Math.max(0.01, currentPrice);
      const close = Math.max(0.01, basePrice + trendChange + randomChange);
      const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.01;
      
      // Ensure all OHLC values are valid numbers and follow market rules
      const validOpen = Math.max(0.01, open);
      const validClose = Math.max(0.01, close);
      const validHigh = Math.max(validOpen, validClose, high);
      const validLow = Math.min(validOpen, validClose, Math.max(0.01, low));
      
      data.push({
        date: hour,
        open: validOpen,
        high: validHigh,
        low: validLow,
        close: validClose
      });
      
      currentPrice = validClose;
    }
    return data;
  };

  const generateMockChartData = () => {
    const data = [];
    const basePrice = stock?.price || 100;
    const volatility = Math.abs(stock?.changePercent || 5) / 100;
    
    // Calculate number of candles and interval based on timeframe
    let totalCandles, intervalHours;
    switch (selectedTimeframe) {
      case '1D':
        totalCandles = 24; // 24 hourly candles for 1 day
        intervalHours = 1;
        break;
      case '7D':
        totalCandles = 42; // 42 candles for 7 days (4h intervals = 168h/4h = 42)
        intervalHours = 4;
        break;
      case '1M':
        totalCandles = 30; // 30 daily candles for 1 month
        intervalHours = 24;
        break;
      case '3M':
        totalCandles = 30; // 30 candles for 3 months (3d intervals = 90d/3d = 30)
        intervalHours = 72; // 3 days = 72 hours
        break;
      default:
        totalCandles = 24;
        intervalHours = 1;
    }
    
    let currentPrice = basePrice - (stock?.change || 0); // Start from previous close
    
    for (let i = 0; i < totalCandles; i++) {
      const date = new Date();
      date.setTime(date.getTime() - (totalCandles - 1 - i) * intervalHours * 60 * 60 * 1000);
      
      const progress = i / (totalCandles - 1);
      const randomChange = (Math.random() - 0.5) * volatility * basePrice * 0.02;
      const trendChange = (stock?.change || 0) * progress;
      
      // Adjust volatility based on interval
      const intervalVolatility = Math.random() * basePrice * (0.01 * Math.sqrt(intervalHours));
      const open = currentPrice;
      const close = basePrice + trendChange + randomChange + intervalVolatility;
      const high = Math.max(open, close) + Math.random() * basePrice * (0.005 * Math.sqrt(intervalHours));
      const low = Math.min(open, close) - Math.random() * basePrice * (0.005 * Math.sqrt(intervalHours));
      
      data.push({
        date: date,
        open: open,
        high: high,
        low: low,
        close: close
      });
      
      currentPrice = close;
    }
    return data;
  };

  const renderCandlestick = (candle, index, minPrice, maxPrice, chartHeight, chartWidth) => {
    const candleWidth = Math.max(4, (chartWidth / chartData.length) * 0.8); // Increase minimum width
    const candleSpacing = chartWidth / chartData.length;
    const x = index * candleSpacing + (candleSpacing - candleWidth) / 2;
    
    const isGreen = candle.close >= candle.open;
    const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
    const bodyHeight = Math.max(2, Math.abs(candle.close - candle.open) / priceRange * chartHeight);
    const bodyTop = chartHeight - ((Math.max(candle.close, candle.open) - minPrice) / priceRange) * chartHeight;
    const bodyBottom = bodyTop + bodyHeight;
    
    const wickTop = chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
    const wickBottom = chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
    
    const wickCenter = x + candleWidth / 2;

    // Debug logging for first few candles
    if (index < 3) {
      console.log(`Candle ${index}:`, {
        x, candleWidth, bodyHeight, bodyTop, 
        open: candle.open, high: candle.high, low: candle.low, close: candle.close,
        minPrice, maxPrice, priceRange
      });
    }
    
    return (
      <View key={index} style={styles.candlestickContainer}>
        {/* Upper wick */}
        <View
          style={[
            styles.wick,
            {
              left: wickCenter - 0.5,
              top: wickTop,
              height: Math.max(1, bodyTop - wickTop),
              backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
            }
          ]}
        />
        
        {/* Candlestick body */}
        <View
          style={[
            styles.candlestickBody,
            {
              left: x,
              top: bodyTop,
              width: candleWidth,
              height: bodyHeight,
              backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
              borderColor: isGreen ? theme.colors.positive : theme.colors.negative,
              borderWidth: bodyHeight < 2 ? 1 : 0, // Add border for very small bodies
            }
          ]}
        />
        
        {/* Lower wick */}
        <View
          style={[
            styles.wick,
            {
              left: wickCenter - 0.5,
              top: bodyBottom,
              height: Math.max(1, wickBottom - bodyBottom),
              backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
            }
          ]}
        />
      </View>
    );
  };

  const renderChart = () => {
    if (loading || chartData.length === 0) {
      return (
        <View style={[styles.chartPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons name="bar-chart" size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.chartPlaceholderText, { color: theme.colors.textTertiary }]}>
            {loading ? 'Loading chart...' : `No chart data available (${chartData.length} candles)`}
          </Text>
        </View>
      );
    }

    console.log('Chart data:', chartData.length, 'candles');

    // Calculate price range for all OHLC data
    const allPrices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const chartHeight = 200;
    const chartWidth = screenWidth - 100; // Account for price labels

    // Calculate if overall trend is positive
    const firstPrice = chartData[0]?.close || 0;
    const lastPrice = chartData[chartData.length - 1]?.close || 0;
    const isPositive = lastPrice > firstPrice;

    return (
      <View style={styles.chartContainer}>
        {/* Price labels */}
        <View style={styles.priceLabels}>
          <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
            ${maxPrice.toFixed(2)}
          </Text>
          <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
            ${minPrice.toFixed(2)}
          </Text>
        </View>

        {/* Chart area */}
        <View 
          style={[styles.chartArea, { backgroundColor: theme.colors.surfaceVariant, height: chartHeight }]}
          {...panResponder.panHandlers}
        >
            {/* Candlestick chart */}
            <View style={[styles.candlestickChart, { height: chartHeight }]}>
              {chartData.map((candle, index) => 
                renderCandlestick(candle, index, minPrice, maxPrice, chartHeight, chartWidth)
              )}
            </View>

            {/* Debug info - remove this later */}
            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 4, borderRadius: 4 }}>
              <Text style={{ color: 'white', fontSize: 10 }}>
                Candles: {chartData.length} | Range: ${minPrice.toFixed(2)}-${maxPrice.toFixed(2)}
              </Text>
            </View>

            {/* Test candlestick - visible red rectangle */}
            <View style={{
              position: 'absolute',
              left: 50,
              top: 50,
              width: 10,
              height: 30,
              backgroundColor: theme.colors.negative,
              borderRadius: 1
            }} />

            {/* Crosshair lines */}
            {dragPosition && (
              <>
                {/* Vertical crosshair */}
                <View
                  style={[
                    styles.crosshairVertical,
                    {
                      left: dragPosition.x,
                      backgroundColor: theme.colors.text,
                      opacity: 0.7
                    }
                  ]}
                />
                {/* Horizontal crosshair */}
                <View
                  style={[
                    styles.crosshairHorizontal,
                    {
                      top: dragPosition.y,
                      backgroundColor: theme.colors.text,
                      opacity: 0.7
                    }
                  ]}
                />
              </>
            )}

            {/* Trend overlay */}
            <View style={[
              styles.trendOverlay,
              {
                backgroundColor: isPositive ? theme.colors.positive : theme.colors.negative,
                opacity: 0.05
              }
            ]} />
          </View>

        {/* Tooltip */}
        {tooltipData && (
          <View style={[styles.tooltip, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.tooltipTitle, { color: theme.colors.text }]}>
              {tooltipData.date instanceof Date ? tooltipData.date.toLocaleDateString() : new Date(tooltipData.date).toLocaleDateString()}
            </Text>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Open:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                ${tooltipData.candle.open.toFixed(2)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>High:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.positive }]}>
                ${tooltipData.candle.high.toFixed(2)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Low:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.negative }]}>
                ${tooltipData.candle.low.toFixed(2)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Close:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                ${tooltipData.candle.close.toFixed(2)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Price at cursor:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
                ${tooltipData.price.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Time labels */}
        <View style={styles.timeLabels}>
          <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
            {chartData[0]?.date ? (chartData[0].date instanceof Date ? chartData[0].date.toLocaleDateString() : new Date(chartData[0].date).toLocaleDateString()) : ''}
          </Text>
          <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
            {chartData[chartData.length - 1]?.date ? (chartData[chartData.length - 1].date instanceof Date ? chartData[chartData.length - 1].date.toLocaleDateString() : new Date(chartData[chartData.length - 1].date).toLocaleDateString()) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Interval selector (Candlestick size) */}
      <View style={styles.selectorHeader}>
        <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>Interval</Text>
      </View>
      <View style={styles.intervalSelector}>
        {intervals.map((interval) => (
          <TouchableOpacity
            key={interval.key}
            style={[
              styles.intervalButton,
              {
                backgroundColor: selectedInterval === interval.key ? theme.colors.primary : theme.colors.surfaceVariant
              }
            ]}
            onPress={() => setSelectedInterval(interval.key)}
          >
            <Text style={[
              styles.intervalText,
              { color: selectedInterval === interval.key ? theme.colors.textInverse : theme.colors.text }
            ]}>
              {interval.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeframe selector (Data period) */}
      <View style={styles.selectorHeader}>
        <Text style={[styles.selectorTitle, { color: theme.colors.text }]}>Period</Text>
      </View>
      <View style={styles.timeframeSelector}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.key}
            style={[
              styles.timeframeButton,
              {
                backgroundColor: selectedTimeframe === tf.key ? theme.colors.primary : theme.colors.surfaceVariant
              }
            ]}
            onPress={() => setSelectedTimeframe(tf.key)}
          >
            <Text style={[
              styles.timeframeText,
              { color: selectedTimeframe === tf.key ? theme.colors.textInverse : theme.colors.text }
            ]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  selectorHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  intervalSelector: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
  },
  intervalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    height: 250,
    position: 'relative',
  },
  priceLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 200,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartArea: {
    marginLeft: 50,
    marginRight: 50,
    height: 200,
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible', // Changed from 'hidden' to 'visible'
  },
  candlestickChart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  candlestickContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  candlestickBody: {
    position: 'absolute',
    borderRadius: 1,
  },
  wick: {
    position: 'absolute',
    width: 1,
  },
  trendOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 50,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  crosshairVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    zIndex: 10,
  },
  crosshairHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    zIndex: 10,
  },
  tooltip: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DetailedPriceChart;
