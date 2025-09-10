import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StockService from '../services/stockService';
import { formatPrice, formatPercentage, getChangeColor } from '../utils/fibonacciUtils';

const StockWatchlist = ({ onStockSelect }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [watchlist, setWatchlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Subscribe to stock updates
    const unsubscribe = StockService.subscribe((updatedWatchlist) => {
      setWatchlist([...updatedWatchlist]);
    });

    // Start live updates
    StockService.startLiveUpdates(10000); // Update every 10 seconds

    // Load most volatile stocks
    loadMostVolatileStocks();

    return () => {
      unsubscribe();
      StockService.stopLiveUpdates();
    };
  }, []);

  const loadMostVolatileStocks = async () => {
    await StockService.getMostVolatileStocks();
    setWatchlist([...StockService.getWatchlist()]);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setIsSearching(false);
      await loadMostVolatileStocks();
    } else {
      setIsSearching(true);
      await StockService.searchStock(query.trim());
      setWatchlist([...StockService.getWatchlist()]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isSearching) {
      await handleSearch(searchQuery);
    } else {
      await loadMostVolatileStocks();
    }
    setRefreshing(false);
  };


  const renderStockItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        [styles.stockItem, { backgroundColor: theme.colors.cardBackground }],
        pressed && { opacity: 0.7 }
      ]}
      onPress={() => {
        console.log('Stock pressed:', item.symbol);
        onStockSelect && onStockSelect(item);
      }}
    >
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={[styles.symbol, { color: theme.colors.text }]}>{item.symbol}</Text>
          <Text style={[styles.price, { color: theme.colors.text }]}>{formatPrice(item.price)}</Text>
        </View>
        <View style={styles.changeInfo}>
          <Text style={[styles.change, { color: getChangeColor(item.change) }]}>
            {formatPrice(item.change)}
          </Text>
          <Text style={[styles.changePercent, { color: getChangeColor(item.change) }]}>
            {formatPercentage(item.changePercent)}
          </Text>
        </View>
      </View>
      
      <View style={[styles.stockDetails, { borderTopColor: theme.colors.borderLight }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>High:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatPrice(item.high)}</Text>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Low:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatPrice(item.low)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Volume:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{item.volume.toLocaleString()}</Text>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Prev Close:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatPrice(item.previousClose)}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trending-up" size={64} color={theme.colors.textTertiary} />
      <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>Loading stocks...</Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>Fetching stocks with highest change</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.colors.headerText }]}>Stock Tracker</Text>
          <Text style={[styles.subtitle, { color: theme.colors.headerText }]}>
            {isSearching ? `Search: ${searchQuery}` : '8 Most Volatile Stocks'}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons 
            name={isDarkMode ? "sunny" : "moon"} 
            size={24} 
            color={theme.colors.headerText} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search stocks..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={theme.colors.textTertiary}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
      
      <FlatList
        data={watchlist}
        keyExtractor={(item) => item.symbol}
        renderItem={renderStockItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={watchlist.length === 0 ? styles.emptyContainer : null}
      />
    </View>
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
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  stockItem: {
    margin: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    marginTop: 2,
  },
  changeInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePercent: {
    fontSize: 14,
    marginTop: 2,
  },
  stockDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default StockWatchlist;
