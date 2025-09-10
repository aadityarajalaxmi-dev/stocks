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
  return `${sign}${percent.toFixed(2)}%`;
}

// Get color based on price change
export function getChangeColor(change) {
  if (change > 0) return '#4CAF50'; // Green
  if (change < 0) return '#F44336'; // Red
  return '#757575'; // Gray
}
