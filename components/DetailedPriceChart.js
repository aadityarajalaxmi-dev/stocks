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
  const [dragPosition, setDragPosition] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const timeframes = [
    { key: '1D', label: '1D' },
    { key: '7D', label: '7D' },
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
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
  }, [stock, selectedTimeframe]);

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
        
        switch (selectedTimeframe) {
          case '1D':
            // Last 24 hours - generate hourly data
            filteredData = generateIntradayData(stock);
            break;
          case '7D':
            // Last 7 days - generate 4h candle data
            filteredData = generateMockChartData();
            break;
          case '1M':
            // Last 30 days - generate daily candle data
            filteredData = generateMockChartData();
            break;
          case '3M':
            // Last 90 days - generate 3-day candle data
            filteredData = generateMockChartData();
            break;
        }
        
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

  const generateIntradayData = (stock) => {
    const data = [];
    const basePrice = stock.price;
    const volatility = Math.abs(stock.changePercent) / 100;
    let currentPrice = basePrice - stock.change; // Start from previous close
    
    // Generate 24 hours of hourly data
    for (let i = 0; i < 24; i++) {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      
      const progress = i / 23;
      const randomChange = (Math.random() - 0.5) * volatility * basePrice * 0.03;
      const trendChange = stock.change * progress;
      
      const open = currentPrice;
      const close = basePrice + trendChange + randomChange;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.01;
      
      data.push({
        date: hour,
        open: open,
        high: high,
        low: low,
        close: close
      });
      
      currentPrice = close;
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
    const candleWidth = (chartWidth / chartData.length) * 0.8;
    const candleSpacing = chartWidth / chartData.length;
    const x = index * candleSpacing + (candleSpacing - candleWidth) / 2;
    
    const isGreen = candle.close >= candle.open;
    const bodyHeight = Math.abs(candle.close - candle.open) / (maxPrice - minPrice) * chartHeight;
    const bodyTop = chartHeight - ((Math.max(candle.close, candle.open) - minPrice) / (maxPrice - minPrice)) * chartHeight;
    const bodyBottom = bodyTop + bodyHeight;
    
    const wickTop = chartHeight - ((candle.high - minPrice) / (maxPrice - minPrice)) * chartHeight;
    const wickBottom = chartHeight - ((candle.low - minPrice) / (maxPrice - minPrice)) * chartHeight;
    
    const wickCenter = x + candleWidth / 2;
    
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
              height: Math.max(1, bodyHeight),
              backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
              borderColor: isGreen ? theme.colors.positive : theme.colors.negative,
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
            {loading ? 'Loading chart...' : 'No chart data available'}
          </Text>
        </View>
      );
    }

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
            ${maxPrice.toFixed(1)}
          </Text>
          <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
            ${minPrice.toFixed(1)}
          </Text>
        </View>

        {/* Chart area */}
        <View 
          style={[styles.chartArea, { backgroundColor: theme.colors.surfaceVariant }]}
          {...panResponder.panHandlers}
        >
            {/* Candlestick chart */}
            <View style={styles.candlestickChart}>
              {chartData.map((candle, index) => 
                renderCandlestick(candle, index, minPrice, maxPrice, chartHeight, chartWidth)
              )}
            </View>

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
                ${tooltipData.candle.open.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>High:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.positive }]}>
                ${tooltipData.candle.high.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Low:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.negative }]}>
                ${tooltipData.candle.low.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Close:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                ${tooltipData.candle.close.toFixed(1)}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Price at cursor:</Text>
              <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
                ${tooltipData.price.toFixed(1)}
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
      {/* Timeframe selector */}
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
  timeframeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
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
    overflow: 'hidden',
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
