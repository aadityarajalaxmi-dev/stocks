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

  // Generate realistic mini chart data based on actual stock movement
  const generateChartData = () => {
    const candles = [];
    const basePrice = stock.price;
    const dailyChange = stock.change || 0;
    const openPrice = basePrice - dailyChange; // Actual opening price
    let currentPrice = openPrice;
    
    // Generate 12 realistic intraday candles showing progression to current price
    for (let i = 0; i < 12; i++) {
      const progress = i / 11; // 0 to 1 progression through the day
      
      // Calculate realistic intraday movement
      const trendMovement = dailyChange * progress; // Gradual movement toward daily change
      const intraVolatility = Math.abs(dailyChange) * 0.1; // 10% of daily range for intra-candle movement
      const randomMovement = (Math.random() - 0.5) * intraVolatility;
      
      const open = currentPrice;
      const close = Math.max(0.01, openPrice + trendMovement + randomMovement);
      
      // Ensure proper OHLC relationships
      const bodyHigh = Math.max(open, close);
      const bodyLow = Math.min(open, close);
      const wickRange = Math.abs(dailyChange) * 0.05; // Small wick range
      const high = bodyHigh + Math.random() * wickRange;
      const low = Math.max(0.01, bodyLow - Math.random() * wickRange);
      
      candles.push({
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        x: (i / 11) * width,
        width: (width / 12) * 0.8
      });
      
      currentPrice = close;
    }
    
    // Ensure the last candle reflects the actual current price
    if (candles.length > 0) {
      candles[candles.length - 1].close = basePrice;
      // Adjust high/low to accommodate the actual current price
      const lastCandle = candles[candles.length - 1];
      lastCandle.high = Math.max(lastCandle.high, lastCandle.open, basePrice);
      lastCandle.low = Math.min(lastCandle.low, lastCandle.open, basePrice);
    }
    
    return candles;
  };

  const rawChartData = generateChartData();
  
  // Apply limits and validation to chart data
  const chartData = applyMiniChartLimits(rawChartData);
  
  // Calculate price range for scaling with padding
  const allPrices = chartData.flatMap(candle => [candle.open, candle.high, candle.low, candle.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = Math.max(maxPrice - minPrice, minPrice * 0.02) || 1; // Minimum 2% range
  
  // Apply chart limits and validation
  const applyMiniChartLimits = (data) => {
    if (!data || data.length === 0) return [];
    
    const MIN_PRICE = 0.001;
    const MAX_PRICE = 100000;
    const MAX_CHANGE_PER_CANDLE = 0.1; // 10% max change per candle
    
    return data.map((candle, index) => {
      // Clamp prices to reasonable ranges
      let { open, high, low, close } = candle;
      
      open = Math.max(MIN_PRICE, Math.min(MAX_PRICE, open));
      close = Math.max(MIN_PRICE, Math.min(MAX_PRICE, close));
      
      // Limit extreme movements within a single candle
      if (index > 0) {
        const prevClose = data[index - 1].close;
        const maxChange = prevClose * MAX_CHANGE_PER_CANDLE;
        
        if (Math.abs(open - prevClose) > maxChange) {
          open = prevClose + Math.sign(open - prevClose) * maxChange;
        }
        if (Math.abs(close - open) > maxChange) {
          close = open + Math.sign(close - open) * maxChange;
        }
      }
      
      // Ensure OHLC relationships
      high = Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.max(high, open, close)));
      low = Math.max(MIN_PRICE, Math.min(high, Math.min(low, open, close)));
      
      return {
        ...candle,
        open: Number(open.toFixed(4)),
        high: Number(high.toFixed(4)),
        low: Number(low.toFixed(4)),
        close: Number(close.toFixed(4))
      };
    });
  };
  
  // Calculate if the overall trend is positive or negative
  const firstPrice = chartData[0]?.close || 0;
  const lastPrice = chartData[chartData.length - 1]?.close || 0;
  const isPositive = lastPrice > firstPrice;
  
  // Create mini candlestick chart
  const renderChart = () => {
    return chartData.map((candle, index) => {
      const isGreen = candle.close >= candle.open;
      const candleHeight = Math.max(1, Math.abs(candle.close - candle.open) / priceRange * height);
      const bodyTop = Math.max(0, Math.min(height, height - ((Math.max(candle.close, candle.open) - minPrice) / priceRange) * height));
      const bodyBottom = Math.max(bodyTop, Math.min(height, bodyTop + candleHeight));
      
      const wickTop = Math.max(0, Math.min(height, height - ((candle.high - minPrice) / priceRange) * height));
      const wickBottom = Math.max(0, Math.min(height, height - ((candle.low - minPrice) / priceRange) * height));
      
      const wickCenter = Math.max(0, Math.min(width, candle.x + candle.width / 2));
      
      return (
        <View key={index} style={styles.candlestickContainer}>
          {/* Upper wick */}
          <View
            style={[
              styles.wick,
              {
                left: Math.max(0, wickCenter - 0.5),
                top: wickTop,
                height: Math.max(1, Math.min(height, bodyTop - wickTop)),
                backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
              }
            ]}
          />
          
          {/* Candlestick body */}
          <View
            style={[
              styles.candlestickBody,
              {
                left: Math.max(0, Math.min(width - candle.width, candle.x)),
                top: bodyTop,
                width: Math.min(candle.width, width),
                height: Math.max(1, Math.min(height, candleHeight)),
                backgroundColor: isGreen ? theme.colors.positive : theme.colors.negative,
              }
            ]}
          />
          
          {/* Lower wick */}
          <View
            style={[
              styles.wick,
              {
                left: Math.max(0, wickCenter - 0.5),
                top: bodyBottom,
                height: Math.max(1, Math.min(height, wickBottom - bodyBottom)),
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
