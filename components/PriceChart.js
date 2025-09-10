import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const PriceChart = ({ stock, width = 100, height = 40 }) => {
  const { theme } = useTheme();

  if (!stock) {
    return (
      <View style={[styles.container, { width, height, backgroundColor: theme.colors.surfaceVariant }]} />
    );
  }

  // Generate mock hourly candlestick data for mini chart
  const generateChartData = () => {
    const candles = [];
    const basePrice = stock.price;
    const volatility = Math.abs(stock.changePercent) / 100;
    let currentPrice = basePrice - stock.change; // Start from previous close
    
    // Generate 12 hourly candles for the mini chart
    for (let i = 0; i < 12; i++) {
      const progress = i / 11; // 0 to 1
      const randomChange = (Math.random() - 0.5) * volatility * basePrice * 0.02;
      const trendChange = stock.change * progress;
      
      const open = currentPrice;
      const close = basePrice + trendChange + randomChange;
      const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
      const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
      
      candles.push({
        open,
        high,
        low,
        close,
        x: (i / 11) * width,
        width: (width / 12) * 0.8
      });
      
      currentPrice = close;
    }
    return candles;
  };

  const chartData = generateChartData();
  
  // Calculate price range for scaling
  const allPrices = chartData.flatMap(candle => [candle.open, candle.high, candle.low, candle.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  
  // Calculate if the overall trend is positive or negative
  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = chartData[chartData.length - 1]?.close || 0;
  const isPositive = lastPrice > firstPrice;
  
  // Create mini candlestick chart
  const renderChart = () => {
    return chartData.map((candle, index) => {
      const isGreen = candle.close >= candle.open;
      const candleHeight = Math.abs(candle.close - candle.open) / priceRange * height;
      const bodyTop = height - ((Math.max(candle.close, candle.open) - minPrice) / priceRange) * height;
      const bodyBottom = bodyTop + candleHeight;
      
      const wickTop = height - ((candle.high - minPrice) / priceRange) * height;
      const wickBottom = height - ((candle.low - minPrice) / priceRange) * height;
      
      const wickCenter = candle.x + candle.width / 2;
      
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
                left: candle.x,
                top: bodyTop,
                width: candle.width,
                height: Math.max(1, candleHeight),
                backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
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
    });
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.chartBackground, { backgroundColor: theme.colors.surfaceVariant }]}>
        {renderChart()}
        
        {/* Trend overlay */}
        <View style={[
          styles.trendOverlay,
          {
            backgroundColor: isPositive ? theme.colors.positive : theme.colors.negative,
            opacity: 0.1
          }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBackground: {
    flex: 1,
    position: 'relative',
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
    borderRadius: 0.5,
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
});

export default PriceChart;
