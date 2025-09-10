import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import StockWatchlist from './components/StockWatchlist';
import StockSelector from './components/StockSelector';
import FibonacciLevels from './components/FibonacciLevels';

const AppContent = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentView, setCurrentView] = useState('watchlist'); // 'watchlist' or 'fibonacci'

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setCurrentView('fibonacci');
  };

  const handleBackToWatchlist = () => {
    setCurrentView('watchlist');
    setSelectedStock(null);
  };

  const renderCurrentView = () => {
    if (currentView === 'fibonacci' && selectedStock) {
      return (
        <FibonacciLevels 
          symbol={selectedStock.symbol}
          onBack={handleBackToWatchlist}
        />
      );
    }
    
    return (
      <StockWatchlist 
        onStockSelect={handleStockSelect}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={theme.colors.headerBackground} />
      {renderCurrentView()}
      
      <StockSelector
        visible={showStockSelector}
        onClose={() => setShowStockSelector(false)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
