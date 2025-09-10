import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StockService from '../services/stockService';

const StockSelector = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Popular stock symbols for quick selection
  const popularStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ADBE', 'PYPL', 'UBER', 'SPOT', 'SQ',
    'ROKU', 'ZM', 'PTON', 'DOCU', 'SNOW', 'PLTR', 'CRWD', 'OKTA'
  ];

  const handleSearch = async (query) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Filter popular stocks based on search query
      const filtered = popularStocks.filter(stock => 
        stock.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for stocks');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddStock = async (symbol) => {
    try {
      // Check if stock already exists in watchlist
      const existingStock = StockService.getWatchlist().find(stock => stock.symbol === symbol);
      if (existingStock) {
        Alert.alert('Already Added', `${symbol} is already in your watchlist`);
        return;
      }

      // Add to watchlist
      StockService.addToWatchlist(symbol);
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      
      Alert.alert('Success', `${symbol} added to watchlist`);
    } catch (error) {
      console.error('Add stock error:', error);
      Alert.alert('Error', 'Failed to add stock to watchlist');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={[styles.searchResultItem, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => handleAddStock(item)}
    >
      <View style={styles.searchResultContent}>
        <Text style={[styles.searchResultSymbol, { color: theme.colors.text }]}>{item}</Text>
        <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderPopularStock = ({ item }) => (
    <TouchableOpacity
      style={[styles.popularStockItem, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => handleAddStock(item)}
    >
      <Text style={[styles.popularStockText, { color: theme.colors.primary }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Add Stock</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search for a stock symbol..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearch(text);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor={theme.colors.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchQuery.length === 0 ? (
          <View style={styles.popularSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Popular Stocks</Text>
            <FlatList
              data={popularStocks}
              keyExtractor={(item) => item}
              renderItem={renderPopularStock}
              numColumns={4}
              contentContainerStyle={styles.popularGrid}
            />
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {isSearching ? 'Searching...' : 'Search Results'}
            </Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item}
              renderItem={renderSearchResult}
              ListEmptyComponent={
                !isSearching && searchQuery.length > 0 ? (
                  <View style={styles.noResults}>
                    <Text style={[styles.noResultsText, { color: theme.colors.textSecondary }]}>No stocks found</Text>
                    <Text style={[styles.noResultsSubtext, { color: theme.colors.textTertiary }]}>
                      Try searching with a different symbol
                    </Text>
                  </View>
                ) : null
              }
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  popularSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  popularGrid: {
    paddingBottom: 20,
  },
  popularStockItem: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  popularStockText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsSection: {
    flex: 1,
    padding: 16,
  },
  searchResultItem: {
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  searchResultSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
  },
});

export default StockSelector;
