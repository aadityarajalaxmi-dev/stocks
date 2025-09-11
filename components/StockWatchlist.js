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
  TouchableOpacity,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StockService from '../services/stockService';
import { formatPrice, formatPercentage, getChangeColor } from '../utils/fibonacciUtils';
import SettingsModal from './SettingsModal';

const StockWatchlist = ({ onStockSelect }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [watchlist, setWatchlist] = useState([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [sortFilter, setSortFilter] = useState('volume');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Subscribe to stock updates
    const unsubscribe = StockService.subscribe((updatedWatchlist) => {
      setWatchlist([...updatedWatchlist]);
      applyFilters([...updatedWatchlist]);
    });

    // Start live updates
    StockService.startLiveUpdates(1000); // Update every 1 second

    // Load most volatile stocks
    loadMostVolatileStocks();

    return () => {
      unsubscribe();
      StockService.stopLiveUpdates();
    };
  }, []);

  useEffect(() => {
    // Apply filters when time or sort filter changes
    applyFilters(watchlist);
  }, [timeFilter, sortFilter]);

  const loadMostVolatileStocks = async () => {
    await StockService.getMostVolatileStocks();
    const stocks = [...StockService.getWatchlist()];
    setWatchlist(stocks);
    applyFilters(stocks);
  };

  const applyFilters = (stocks) => {
    let filtered = [...stocks];
    
    // Apply time-based filtering (simulate different time periods)
    switch (timeFilter) {
      case '5m':
        filtered = filtered.filter(stock => Math.abs(stock.changePercent) > 2);
        break;
      case '1h':
        filtered = filtered.filter(stock => Math.abs(stock.changePercent) > 1.5);
        break;
      case '6h':
        filtered = filtered.filter(stock => Math.abs(stock.changePercent) > 1);
        break;
      case '24h':
      default:
        // Show all stocks
        break;
    }
    
    // Apply sorting
    switch (sortFilter) {
      case 'volume':
        filtered.sort((a, b) => b.volume - a.volume);
        break;
      case 'price':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'marketCap':
        filtered.sort((a, b) => b.marketCap - a.marketCap);
        break;
      case 'volatility':
      default:
        filtered.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
        break;
    }
    
    setFilteredWatchlist(filtered);
    
    // Calculate total volume
    const total = filtered.reduce((sum, stock) => sum + (stock.volume * stock.price), 0);
    setTotalVolume(total);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setIsSearching(false);
      await loadMostVolatileStocks();
    } else {
      setIsSearching(true);
      await StockService.searchStock(query.trim());
      const stocks = [...StockService.getWatchlist()];
      setWatchlist(stocks);
      applyFilters(stocks);
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

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    setShowTimeFilter(false);
    applyFilters(watchlist);
  };

  const handleSortFilterChange = (filter) => {
    setSortFilter(filter);
    setShowSortFilter(false);
    applyFilters(watchlist);
  };

  const formatVolume = (volume) => {
    if (!volume || isNaN(volume)) return '0';
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap || isNaN(marketCap)) return '$0';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toFixed(0)}`;
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
        </View>
        <View style={styles.changeInfo}>
          <Text style={[styles.price, { color: theme.colors.text }]}>
            {formatPrice(item.price)}
          </Text>
          <View style={styles.changePercentContainer}>
            <Text style={[styles.changePercent, { color: getChangeColor(item.change) }]}>
              {formatPercentage(item.changePercent)}
            </Text>
            <Text style={[styles.changeSmall, { color: getChangeColor(item.change) }]}>
              {' '}{formatPrice(item.change)}
            </Text>
          </View>
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
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatVolume(item.volume)}</Text>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Market Cap:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatMarketCap(item.marketCap)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Avg Volume:</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatVolume(item.avgVolume)}</Text>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Vol Change:</Text>
          <Text style={[styles.detailValue, { color: getChangeColor(item.volumeChange) }]}>
            {formatPercentage(item.volumeChange)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trending-up" size={64} color={theme.colors.textTertiary} />
      <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>Loading stocks...</Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>Fetching stocks with highest volume</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <View style={styles.headerLeft} />
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.colors.headerText }]}>trackr</Text>
          <Text style={[styles.subtitle, { color: theme.colors.headerText }]}>
            {isSearching ? `Search: ${searchQuery}` : ''}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Ionicons 
            name="settings-outline" 
            size={20} 
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

      {/* Filter Section */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setShowTimeFilter(true)}
          >
            <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.filterButtonText, { color: theme.colors.text }]}>
              {timeFilter === '5m' ? '5 Min' : 
               timeFilter === '1h' ? '1 Hour' : 
               timeFilter === '6h' ? '6 Hours' : '24 Hours'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setShowSortFilter(true)}
          >
            <Ionicons name="swap-vertical" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.filterButtonText, { color: theme.colors.text }]}>
              {sortFilter === 'volatility' ? 'Volatility' :
               sortFilter === 'volume' ? 'Volume' :
               sortFilter === 'price' ? 'Price' : 'Market Cap'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Volume Bar */}
      <View style={[styles.volumeBar, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.volumeBarContent}>
          <Text style={[styles.volumeBarLabel, { color: theme.colors.textSecondary }]}>Total Volume:</Text>
          <Text style={[styles.volumeBarValue, { color: theme.colors.text }]}>
            ${formatVolume(totalVolume)}
          </Text>
        </View>
        <View style={[styles.volumeBarFill, { 
          backgroundColor: theme.colors.primary,
          width: `${Math.min(100, (totalVolume / 1e9) * 10)}%`
        }]} />
      </View>
      
      <FlatList
        data={filteredWatchlist}
        keyExtractor={(item) => item.symbol}
        renderItem={renderStockItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredWatchlist.length === 0 ? styles.emptyContainer : null}
      />

      {/* Time Filter Modal */}
      <Modal
        visible={showTimeFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimeFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimeFilter(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Time Period</Text>
            {['5m', '1h', '6h', '24h'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.modalItem,
                  timeFilter === period && { backgroundColor: theme.colors.primary + '20' }
                ]}
                onPress={() => handleTimeFilterChange(period)}
              >
                <Text style={[styles.modalItemText, { color: theme.colors.text }]}>
                  {period === '5m' ? '5 Minutes' : 
                   period === '1h' ? '1 Hour' : 
                   period === '6h' ? '6 Hours' : '24 Hours'}
                </Text>
                {timeFilter === period && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Filter Modal */}
      <Modal
        visible={showSortFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortFilter(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortFilter(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Sort By</Text>
            {['volatility', 'volume', 'price', 'marketCap'].map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.modalItem,
                  sortFilter === sort && { backgroundColor: theme.colors.primary + '20' }
                ]}
                onPress={() => handleSortFilterChange(sort)}
              >
                <Text style={[styles.modalItemText, { color: theme.colors.text }]}>
                  {sort === 'volatility' ? 'Volatility' :
                   sort === 'volume' ? 'Volume' :
                   sort === 'price' ? 'Price' : 'Market Cap'}
                </Text>
                {sortFilter === sort && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 10,
    paddingTop: 25,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 0,
    borderBottomWidth: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  volumeBar: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  volumeBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    zIndex: 2,
  },
  volumeBarLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  volumeBarValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  volumeBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    opacity: 0.2,
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  modalItemText: {
    fontSize: 16,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  changePercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  change: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  changeSmall: {
    fontSize: 12,
    marginLeft: 4,
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
