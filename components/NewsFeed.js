import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import NewsService from '../services/newsService';
import StockHeader from './StockHeader';

const NewsFeed = ({ symbol, onBack }) => {
  const { theme } = useTheme();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      loadNews();
    }
  }, [symbol]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newsData = await NewsService.getNewsForStock(symbol);
      setNews(newsData);
    } catch (error) {
      console.error('Error loading news:', error);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const formatTimeAgo = (date) => {
    if (!date || !(date instanceof Date)) {
      return 'Unknown time';
    }
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return theme.colors.textSecondary;
    
    switch (sentiment) {
      case 'positive':
        return '#4CAF50'; // Green
      case 'negative':
        return '#F44336'; // Red
      case 'neutral':
      default:
        return theme.colors.textSecondary;
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return 'remove';
    
    switch (sentiment) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      case 'neutral':
      default:
        return 'remove';
    }
  };

  const handleNewsPress = (newsItem) => {
    // In a real app, you would open the full article
    Alert.alert(
      newsItem.title,
      newsItem.summary,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Read More', onPress: () => {
          // In a real app, you would open the article URL
          console.log('Opening article:', newsItem.title);
        }}
      ]
    );
  };

  const renderNewsItem = (item) => {
    if (!item || !item.id) {
      return null;
    }
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.newsItem, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => handleNewsPress(item)}
      >
      <View style={styles.newsHeader}>
        <View style={styles.newsTitleContainer}>
          <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.title || 'No title available'}
          </Text>
          <View style={styles.newsMeta}>
            <Text style={[styles.newsSource, { color: theme.colors.textSecondary }]}>
              {item.source || 'Unknown source'}
            </Text>
            <Text style={[styles.newsTime, { color: theme.colors.textTertiary }]}>
              {formatTimeAgo(item.publishedAt)}
            </Text>
          </View>
        </View>
        <View style={styles.sentimentContainer}>
          <Ionicons
            name={getSentimentIcon(item.sentiment)}
            size={20}
            color={getSentimentColor(item.sentiment)}
          />
        </View>
      </View>
      
      <Text style={[styles.newsSummary, { color: theme.colors.textSecondary }]} numberOfLines={3}>
        {item.summary || 'No summary available'}
      </Text>
      
      <View style={styles.newsFooter}>
        <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(item.sentiment) + '20' }]}>
          <Text style={[styles.sentimentText, { color: getSentimentColor(item.sentiment) }]}>
            {item.sentiment ? item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1) : 'Unknown'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
      </View>
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="newspaper-outline" size={64} color={theme.colors.textTertiary} />
      <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
        No news available
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
        Check back later for the latest updates
      </Text>
    </View>
  );

  if (loading && news.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading news...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadNews}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.background }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StockHeader 
        stock={{ symbol, name: `${symbol} News` }} 
        onBack={onBack} 
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Latest News
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Stay updated with {symbol} news
          </Text>
        </View>

        {news.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.newsList}>
            {news.map(renderNewsItem)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  newsList: {
    paddingHorizontal: 16,
  },
  newsItem: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  newsSource: {
    fontSize: 12,
    fontWeight: '500',
  },
  newsTime: {
    fontSize: 12,
  },
  sentimentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NewsFeed;
