// Fibonacci retracement levels
export const FIBONACCI_LEVELS = {
  0: 0,
  23.6: 0.236,
  38.2: 0.382,
  50: 0.5,
  61.8: 0.618,
  78.6: 0.786,
  100: 1
};

// Calculate Fibonacci retracement levels
export function calculateFibonacciLevels(high, low) {
  const diff = high - low;
  const levels = {};
  
  Object.entries(FIBONACCI_LEVELS).forEach(([name, ratio]) => {
    levels[name] = high - (diff * ratio);
  });
  
  return levels;
}

// Calculate Fibonacci extension levels
export function calculateFibonacciExtensions(high, low, retracement) {
  const diff = high - low;
  const levels = {
    127.2: high + (diff * 0.272),
    138.2: high + (diff * 0.382),
    161.8: high + (diff * 0.618),
    200: high + diff,
    261.8: high + (diff * 1.618)
  };
  
  return levels;
}

// Get the current price level relative to Fibonacci levels
export function getCurrentLevel(price, fibonacciLevels) {
  const levels = Object.entries(fibonacciLevels)
    .map(([name, value]) => ({ name: parseFloat(name), value }))
    .sort((a, b) => b.value - a.value);
  
  for (let i = 0; i < levels.length - 1; i++) {
    if (price >= levels[i + 1].value && price <= levels[i].value) {
      return {
        level: levels[i].name,
        support: levels[i + 1].value,
        resistance: levels[i].value,
        position: (price - levels[i + 1].value) / (levels[i].value - levels[i + 1].value)
      };
    }
  }
  
  return null;
}

// Calculate support and resistance levels
export function calculateSupportResistance(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return { high: 0, low: 0, levels: {} };
  }
  
  const highs = historicalData.map(day => day.high);
  const lows = historicalData.map(day => day.low);
  
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  
  const levels = calculateFibonacciLevels(high, low);
  
  return { high, low, levels };
}

// Format price for display
export function formatPrice(price) {
  if (price === null || price === undefined) return 'N/A';
  return `$${price.toFixed(2)}`;
}

// Format percentage for display
export function formatPercentage(percent) {
  if (percent === null || percent === undefined) return 'N/A';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

// Get color based on price change
export function getChangeColor(change) {
  if (change > 0) return '#4CAF50'; // Green
  if (change < 0) return '#F44336'; // Red
  return '#757575'; // Gray
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return [];
  
  const rsi = [];
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  // Calculate RSI for the first period
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsiValue = 100 - (100 / (1 + rs));
  rsi.push({ value: rsiValue, date: new Date() });
  
  // Calculate RSI for remaining periods using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    rsi.push({ value: rsiValue, date: new Date() });
  }
  
  return rsi;
}

// Calculate MACD (Moving Average Convergence Divergence)
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (prices.length < slowPeriod + signalPeriod) return { macd: [], signal: [], histogram: [] };
  
  // Calculate EMAs
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  const macd = [];
  const signal = [];
  const histogram = [];
  
  // Calculate MACD line - align the EMAs properly
  const startIndex = slowPeriod - 1;
  for (let i = startIndex; i < prices.length; i++) {
    const fastIndex = i - startIndex;
    const slowIndex = i - startIndex;
    
    if (fastIndex < fastEMA.length && slowIndex < slowEMA.length) {
      const macdValue = fastEMA[fastIndex] - slowEMA[slowIndex];
      macd.push({ value: macdValue, date: new Date() });
    }
  }
  
  // Calculate signal line (EMA of MACD) - only if we have enough MACD values
  if (macd.length >= signalPeriod) {
    const macdValues = macd.map(item => item.value);
    const signalEMA = calculateEMA(macdValues, signalPeriod);
    
    for (let i = 0; i < signalEMA.length; i++) {
      signal.push({ value: signalEMA[i], date: new Date() });
    }
  }
  
  // Calculate histogram
  for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
    const histValue = macd[i].value - signal[i].value;
    histogram.push({ value: histValue, date: new Date() });
  }
  
  return { macd, signal, histogram };
}

// Calculate EMA (Exponential Moving Average)
function calculateEMA(prices, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);
  
  // Calculate subsequent EMAs
  for (let i = period; i < prices.length; i++) {
    const emaValue = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(emaValue);
  }
  
  return ema;
}

// Get RSI signal with strength levels
export function getRSISignal(rsiValue) {
  // Overbought levels
  if (rsiValue >= 80) return { signal: 'Very Strong Overbought', color: '#D32F2F' };
  if (rsiValue >= 70) return { signal: 'Strong Overbought', color: '#F44336' };
  if (rsiValue >= 60) return { signal: 'Moderate Overbought', color: '#FF5722' };
  
  // Oversold levels
  if (rsiValue <= 20) return { signal: 'Very Strong Oversold', color: '#2E7D32' };
  if (rsiValue <= 30) return { signal: 'Strong Oversold', color: '#4CAF50' };
  if (rsiValue <= 40) return { signal: 'Moderate Oversold', color: '#8BC34A' };
  
  // Neutral levels
  if (rsiValue >= 55) return { signal: 'Weak Bullish', color: '#9C27B0' };
  if (rsiValue <= 45) return { signal: 'Weak Bearish', color: '#FF9800' };
  
  return { signal: 'Neutral', color: '#757575' };
}

// Get MACD signal
export function getMACDSignal(macd, signal) {
  if (macd > signal) return { signal: 'Bullish', color: '#4CAF50' };
  if (macd < signal) return { signal: 'Bearish', color: '#F44336' };
  return { signal: 'Neutral', color: '#757575' };
}
