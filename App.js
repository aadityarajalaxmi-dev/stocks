import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StockWatchlist from './components/StockWatchlist';
import StockSelector from './components/StockSelector';
import StockDetailTabs from './components/StockDetailTabs';
import NotificationService from './services/notificationService';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { theme } = useTheme();
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentView, setCurrentView] = useState('watchlist'); // 'watchlist' or 'details'

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setCurrentView('details');
  };

  const handleBackToWatchlist = () => {
    setCurrentView('watchlist');
    setSelectedStock(null);
  };

  // Initialize notification service
  useEffect(() => {
    NotificationService.start();

    return () => {
      NotificationService.stop();
    };
  }, []);

  const renderCurrentView = () => {
    if (currentView === 'details' && selectedStock) {
      return (
        <StockDetailTabs 
          symbol={selectedStock.symbol}
          stock={selectedStock}
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
      <StatusBar 
        style={theme.isDark ? "light" : "dark"} 
        backgroundColor={theme.colors.background} 
      />
      {renderCurrentView()}
      
      <StockSelector
        visible={showStockSelector}
        onClose={() => setShowStockSelector(false)}
      />
    </SafeAreaView>
  );
}

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
