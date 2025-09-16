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
    const validatedData = applyChartBoundaries(chartData);
    const candleIndex = Math.round((x / chartWidth) * (validatedData.length - 1));
    const candle = validatedData[candleIndex];
    
    if (candle) {
      // Calculate price at the Y position
      const allPrices = validatedData.flatMap(d => [d.open, d.high, d.low, d.close]);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = Math.max(maxPrice - minPrice, minPrice * 0.01);
      const padding = priceRange * 0.05;
      const adjustedMinPrice = Math.max(0.001, minPrice - padding);
      const adjustedMaxPrice = maxPrice + padding;
      const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;
      
      const priceAtY = Math.max(0.001, adjustedMaxPrice - (y / chartHeight) * adjustedPriceRange);
      
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
      // Get real intraday data from StockService based on timeframe and interval
      let chartData = [];
      
      // Map timeframe to API range parameter
      const rangeMap = {
        '1D': '1d',
        '7D': '5d', 
        '1M': '1mo',
        '3M': '3mo'
      };
      
      const range = rangeMap[selectedTimeframe] || '1d';
      
      // Try to get real intraday data first
      if (selectedTimeframe === '1D' && ['1m', '5m', '15m', '1h'].includes(selectedInterval)) {
        // For intraday charts, use intraday data
        chartData = await StockService.getIntradayData(stock.symbol, selectedInterval, range);
      } else {
        // For longer timeframes, use daily data and generate realistic intraday candles
        const historicalData = await StockService.getHistoricalData(stock.symbol, '6mo');
        if (historicalData && historicalData.length > 0) {
          chartData = filterDataByTimeframe(historicalData, selectedTimeframe);
        }
      }
      
      // If we have real data, use it; otherwise fall back to realistic mock data
      if (chartData && chartData.length > 0) {
        setChartData(chartData);
      } else {
        console.warn('No real data available, using mock data for', stock.symbol);
        setChartData(generateRealisticMockData());
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData(generateRealisticMockData());
    } finally {
      setLoading(false);
    }
  };

  const filterDataByTimeframe = (historicalData, timeframe) => {
    if (!historicalData || historicalData.length === 0) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '1D':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7D':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 1);
    }
    
    return historicalData.filter(candle => {
      const candleDate = new Date(candle.date);
      return candleDate >= startDate;
    }).slice(-200); // Limit to last 200 candles for performance
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

  const generateRealisticMockData = () => {
    if (!stock) return [];
    
    const data = [];
    const basePrice = stock.price || 100;
    const dailyChange = stock.change || 0;
    const changePercent = stock.changePercent || 0;
    
    // Calculate number of candles based on timeframe and interval
    const candleConfig = getCandleConfiguration(selectedTimeframe, selectedInterval);
    const numCandles = Math.min(candleConfig.count, 200); // Limit for performance
    const intervalMs = candleConfig.intervalMs;
    
    // Start from the price at the beginning of the period
    let currentPrice = basePrice - dailyChange;
    const now = new Date();
    
    for (let i = 0; i < numCandles; i++) {
      const candleStartTime = new Date(now.getTime() - (numCandles - i) * intervalMs);
      const progress = i / (numCandles - 1);
      
      // Calculate realistic price movement for this candle
      const trendMovement = dailyChange * (progress / numCandles);
      const intervalVolatility = getIntervalVolatility(selectedInterval) * basePrice;
      const randomMovement = (Math.random() - 0.5) * intervalVolatility;
      
      const open = currentPrice;
      const close = Math.max(0.01, currentPrice + trendMovement + randomMovement);
      
      // Ensure high/low respect OHLC rules
      const bodyHigh = Math.max(open, close);
      const bodyLow = Math.min(open, close);
      const high = bodyHigh + Math.random() * intervalVolatility * 0.5;
      const low = Math.max(0.01, bodyLow - Math.random() * intervalVolatility * 0.5);
      
      const volume = Math.floor(Math.random() * 5000000) + 500000;
      
      data.push({
        date: candleStartTime,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: volume
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const renderGridLines = (chartHeight, chartWidth, minPrice, maxPrice) => {
    const gridLines = [];
    const gridColor = theme.isDark ? '#2a2a2a' : '#e6e6e6';
    
    // Horizontal grid lines (price levels)
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const y = (i / priceSteps) * chartHeight;
      gridLines.push(
        <View
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: 1,
            backgroundColor: gridColor,
            opacity: 0.3,
          }}
        />
      );
    }
    
    // Vertical grid lines (time intervals)
    const timeSteps = Math.min(8, Math.max(1, chartData.length));
    for (let i = 0; i <= timeSteps; i++) {
      const x = Math.min((i / timeSteps) * chartWidth, chartWidth);
      gridLines.push(
        <View
          key={`v-${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: gridColor,
            opacity: 0.3,
          }}
        />
      );
    }
    
    return gridLines;
  };

  const renderVolumeBars = (chartHeight, chartWidth, validatedData) => {
    if (!validatedData || validatedData.length === 0) return null;
    
    const volumes = validatedData.map(d => d.volume || 0).filter(v => v > 0);
    if (volumes.length === 0) return null;
    
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    const volumeRange = Math.max(maxVolume - minVolume, maxVolume * 0.1); // Minimum 10% range
    
    const volumeHeight = chartHeight * 0.15; // Use bottom 15% for volume
    const volumeTop = chartHeight - volumeHeight;
    
    return validatedData.map((candle, index) => {
      const candleWidth = Math.max(1, (chartWidth / validatedData.length) * 0.7);
      const candleSpacing = chartWidth / validatedData.length;
      const x = Math.max(0, index * candleSpacing + (candleSpacing - candleWidth) / 2);
      const volume = Math.max(0, candle.volume || 0);
      
      // Normalize volume with proper scaling
      const normalizedVolume = maxVolume > 0 ? volume / maxVolume : 0;
      const barHeight = Math.max(1, normalizedVolume * volumeHeight);
      const isGreen = candle.close >= candle.open;
      
      return (
        <View
          key={`volume-${index}`}
          style={{
            position: 'absolute',
            left: Math.min(x, chartWidth - candleWidth),
            top: Math.max(volumeTop, volumeTop + (volumeHeight - barHeight)),
            width: candleWidth,
            height: Math.min(barHeight, volumeHeight),
            backgroundColor: isGreen ? '#26a69a' : '#ef5350',
            opacity: 0.4,
          }}
        />
      );
    });
  };

  const renderPriceLabels = (minPrice, maxPrice, chartHeight) => {
    const priceChartHeight = chartHeight * 0.85; // Only price chart area
    const priceSteps = 5;
    const priceRange = maxPrice - minPrice;
    const labels = [];
    
    for (let i = 0; i <= priceSteps; i++) {
      const price = maxPrice - (i / priceSteps) * priceRange;
      const y = (i / priceSteps) * priceChartHeight - 8; // Center text on grid line
      
      labels.push(
        <View
          key={`price-label-${i}`}
          style={{
            position: 'absolute',
            top: y,
            right: 0,
            backgroundColor: theme.isDark ? '#2a2a2a' : '#f5f5f5',
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 2,
          }}
        >
          <Text style={[styles.priceLabel, { 
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontFamily: 'monospace',
          }]}>
            ${price.toFixed(2)}
          </Text>
        </View>
      );
    }
    
    return labels;
  };

  const renderCandlestick = (candle, index, minPrice, maxPrice, chartHeight, chartWidth) => {
    const candleWidth = Math.max(6, (chartWidth / chartData.length) * 0.7);
    const candleSpacing = chartWidth / chartData.length;
    const x = index * candleSpacing + (candleSpacing - candleWidth) / 2;
    
    const isGreen = candle.close >= candle.open;
    const priceRange = maxPrice - minPrice || 1;
    
    // Adjust for volume area (use only top 85% for price chart)
    const priceChartHeight = chartHeight * 0.85;
    
    // Calculate correct positions for open and close
    const openY = priceChartHeight - ((candle.open - minPrice) / priceRange) * priceChartHeight;
    const closeY = priceChartHeight - ((candle.close - minPrice) / priceRange) * priceChartHeight;
    const highY = priceChartHeight - ((candle.high - minPrice) / priceRange) * priceChartHeight;
    const lowY = priceChartHeight - ((candle.low - minPrice) / priceRange) * priceChartHeight;
    
    // Body positioning: top is the higher price, bottom is the lower price
    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyHeight = Math.max(1, bodyBottom - bodyTop);
    
    const wickCenter = x + candleWidth / 2;

    // TradingView-style colors
    const candleColor = isGreen ? '#26a69a' : '#ef5350';
    
    return (
      <View key={index} style={styles.candlestickContainer}>
        {/* Upper wick - from high to top of body */}
        <View
          style={[
            styles.wick,
            {
              left: wickCenter - 0.5,
              top: highY,
              height: Math.max(1, bodyTop - highY),
              backgroundColor: candleColor,
              width: 1,
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
              backgroundColor: isGreen ? '#26a69a' : (theme.isDark ? 'transparent' : '#ffffff'), // Green filled, transparent/white for red
              borderColor: candleColor,
              borderWidth: 1,
              borderRadius: 0,
            }
          ]}
        />
        
        {/* Lower wick - from bottom of body to low */}
        <View
          style={[
            styles.wick,
            {
              left: wickCenter - 0.5,
              top: bodyBottom,
              height: Math.max(1, lowY - bodyBottom),
              backgroundColor: candleColor,
              width: 1,
            }
          ]}
        />
        
        {/* Doji line - when open equals close */}
        {Math.abs(candle.open - candle.close) < (priceRange * 0.001) && (
          <View
            style={{
              position: 'absolute',
              left: x,
              top: openY - 0.5,
              width: candleWidth,
              height: 1,
              backgroundColor: candleColor,
            }}
          />
        )}
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

    // Apply chart limits and validate data
    const validatedData = applyChartBoundaries(chartData);
    
    // Calculate price range for all OHLC data with padding
    const allPrices = validatedData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = Math.max(maxPrice - minPrice, minPrice * 0.01); // Minimum 1% range
    
    // Add padding to price range (5% above and below)
    const padding = priceRange * 0.05;
    const adjustedMinPrice = Math.max(0.001, minPrice - padding);
    const adjustedMaxPrice = maxPrice + padding;
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;
    
    const chartHeight = 200;
    const chartWidth = Math.min(screenWidth - 100, 800); // Cap max width

    // Calculate if overall trend is positive
    const firstPrice = validatedData[0]?.close || 0;
    const lastPrice = validatedData[validatedData.length - 1]?.close || 0;
    const isPositive = lastPrice > firstPrice;

    return (
      <View style={styles.chartContainer}>
        {/* Price labels */}
        <View style={styles.priceLabels}>
          {renderPriceLabels(adjustedMinPrice, adjustedMaxPrice, chartHeight)}
        </View>

        {/* Chart area */}
        <View 
          style={[styles.chartArea, { backgroundColor: theme.isDark ? '#1e1e1e' : '#ffffff', height: chartHeight }]}
          {...panResponder.panHandlers}
        >
            {/* Grid lines */}
            {renderGridLines(chartHeight, chartWidth, adjustedMinPrice, adjustedMaxPrice)}
            
            {/* Volume bars */}
            {renderVolumeBars(chartHeight, chartWidth, validatedData)}
            
            {/* Candlestick chart */}
            <View style={[styles.candlestickChart, { height: chartHeight }]}>
              {validatedData.map((candle, index) => 
                renderCandlestick(candle, index, adjustedMinPrice, adjustedMaxPrice, chartHeight, chartWidth)
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
                      backgroundColor: theme.isDark ? '#ffffff' : '#000000',
                      opacity: 0.8,
                      shadowColor: theme.isDark ? '#000000' : '#ffffff',
                      shadowOffset: { width: 1, height: 0 },
                      shadowOpacity: 0.5,
                    }
                  ]}
                />
                {/* Horizontal crosshair */}
                <View
                  style={[
                    styles.crosshairHorizontal,
                    {
                      top: dragPosition.y,
                      backgroundColor: theme.isDark ? '#ffffff' : '#000000',
                      opacity: 0.8,
                      shadowColor: theme.isDark ? '#000000' : '#ffffff',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.5,
                    }
                  ]}
                />
                {/* Price indicator on crosshair */}
                <View
                  style={{
                    position: 'absolute',
                    right: -50,
                    top: dragPosition.y - 10,
                    backgroundColor: theme.isDark ? '#373737' : '#f0f0f0',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: theme.isDark ? '#555' : '#ccc',
                  }}
                >
                  <Text style={[styles.crosshairPrice, { 
                    color: theme.colors.text,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }]}>
                    ${((adjustedMaxPrice - (dragPosition.y / (chartHeight * 0.85)) * adjustedPriceRange).toFixed(2))}
                  </Text>
                </View>
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
            {validatedData[0]?.date ? (validatedData[0].date instanceof Date ? validatedData[0].date.toLocaleDateString() : new Date(validatedData[0].date).toLocaleDateString()) : ''}
          </Text>
          <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
            {validatedData[validatedData.length - 1]?.date ? (validatedData[validatedData.length - 1].date instanceof Date ? validatedData[validatedData.length - 1].date.toLocaleDateString() : new Date(validatedData[validatedData.length - 1].date).toLocaleDateString()) : ''}
          </Text>
        </View>
      </View>
    );
  };

  // Apply chart boundaries and validation
  const applyChartBoundaries = (data) => {
    if (!data || data.length === 0) return [];
    
    const MAX_CANDLES = 300; // Limit for performance
    const MIN_PRICE = 0.001;
    const MAX_PRICE = 1000000;
    
    // Limit number of candles
    let limitedData = data.slice(-MAX_CANDLES);
    
    // Validate and clamp each candle
    limitedData = limitedData.map(candle => {
      const open = Math.max(MIN_PRICE, Math.min(MAX_PRICE, candle.open || 0));
      const close = Math.max(MIN_PRICE, Math.min(MAX_PRICE, candle.close || 0));
      const high = Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.max(candle.high || 0, open, close)));
      const low = Math.max(MIN_PRICE, Math.min(high, Math.min(candle.low || MAX_PRICE, open, close)));
      const volume = Math.max(0, Math.min(10000000000, candle.volume || 0)); // 10B max volume
      
      return {
        ...candle,
        open: Number(open.toFixed(4)),
        high: Number(high.toFixed(4)),
        low: Number(low.toFixed(4)),
        close: Number(close.toFixed(4)),
        volume: Math.floor(volume)
      };
    }).filter(candle => 
      candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0 &&
      candle.high >= Math.max(candle.open, candle.close) &&
      candle.low <= Math.min(candle.open, candle.close)
    );
    
    return limitedData;
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
    marginRight: 80,
    height: 200,
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
  crosshairPrice: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DetailedPriceChart;
