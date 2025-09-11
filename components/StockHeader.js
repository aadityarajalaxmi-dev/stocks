import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { formatPrice, formatPercentage, getChangeColor } from '../utils/fibonacciUtils';

const StockHeader = ({ stock, onBack }) => {
  const { theme } = useTheme();

  if (!stock) return null;

  const getCompanyName = (symbol) => {
    const companyNames = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices',
      'CRM': 'Salesforce Inc.',
      'ADBE': 'Adobe Inc.',
      'PYPL': 'PayPal Holdings Inc.',
      'UBER': 'Uber Technologies Inc.',
      'LYFT': 'Lyft Inc.',
      'SQ': 'Block Inc.',
      'ROKU': 'Roku Inc.',
      'ZM': 'Zoom Video Communications',
      'PTON': 'Peloton Interactive',
      'SPOT': 'Spotify Technology',
      'SNAP': 'Snap Inc.',
      'PINS': 'Pinterest Inc.',
      'SHOP': 'Shopify Inc.',
      'OKTA': 'Okta Inc.',
      'DDOG': 'Datadog Inc.',
      'SNOW': 'Snowflake Inc.',
      'PLTR': 'Palantir Technologies',
      'CRWD': 'CrowdStrike Holdings',
      'ZS': 'Zscaler Inc.',
      'NET': 'Cloudflare Inc.',
      'FSLY': 'Fastly Inc.',
      'DOCU': 'DocuSign Inc.',
      'WDAY': 'Workday Inc.',
      'NOW': 'ServiceNow Inc.',
      'TEAM': 'Atlassian Corporation',
      'MDB': 'MongoDB Inc.',
      'ESTC': 'Elastic N.V.',
      'SPLK': 'Splunk Inc.',
      'VMW': 'VMware Inc.',
      'ORCL': 'Oracle Corporation',
      'IBM': 'International Business Machines',
      'CSCO': 'Cisco Systems Inc.',
      'QCOM': 'QUALCOMM Incorporated',
      'AVGO': 'Broadcom Inc.',
      'TXN': 'Texas Instruments Incorporated',
      'AMAT': 'Applied Materials Inc.',
      'LRCX': 'Lam Research Corporation',
      'MU': 'Micron Technology Inc.',
      'ADI': 'Analog Devices Inc.',
      'MCHP': 'Microchip Technology Inc.',
      'KLAC': 'KLA Corporation',
      'SNPS': 'Synopsys Inc.',
      'CDNS': 'Cadence Design Systems Inc.',
      'ANSS': 'ANSYS Inc.',
      'FTNT': 'Fortinet Inc.',
      'PANW': 'Palo Alto Networks Inc.'
    };
    return companyNames[symbol] || `${symbol} Corporation`;
  };

  const getExchangeName = (symbol) => {
    // Most tech stocks are on NASDAQ
    const nasdaqStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'CRM', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SQ', 'ROKU', 'ZM', 'PTON', 'SPOT', 'SNAP', 'PINS', 'SHOP', 'OKTA', 'DDOG', 'SNOW', 'PLTR', 'CRWD', 'ZS', 'NET', 'FSLY', 'DOCU', 'WDAY', 'NOW', 'TEAM', 'MDB', 'ESTC', 'SPLK', 'VMW', 'ORCL', 'IBM', 'CSCO', 'QCOM', 'AVGO', 'TXN', 'AMAT', 'LRCX', 'MU', 'ADI', 'MCHP', 'KLAC', 'SNPS', 'CDNS', 'ANSS', 'FTNT', 'PANW'];
    return nasdaqStocks.includes(symbol) ? 'NASDAQ' : 'NYSE';
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

  const getChangeIcon = (change) => {
    if (change > 0) return 'trending-up';
    if (change < 0) return 'trending-down';
    return 'remove';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with back button, logo, and ticker */}
      <View style={[styles.topHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.symbolContainer}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.logoText, { color: theme.colors.text }]}>
              {stock.symbol.charAt(0)}
            </Text>
          </View>
          <View style={styles.tickerInfo}>
            <Text style={[styles.ticker, { color: theme.colors.text }]}>{stock.symbol}</Text>
            <Text style={[styles.companyName, { color: theme.colors.textSecondary }]}>
              {getCompanyName(stock.symbol)}
            </Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Price and change section */}
      <View style={[styles.priceSection, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.priceRow}>
          <View style={styles.priceInfo}>
            <Text style={[styles.currentPrice, { color: theme.colors.text }]}>
              {formatPrice(stock.price)}
            </Text>
            <View style={[styles.exchangeBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.exchangeText, { color: theme.colors.textInverse }]}>
                {getExchangeName(stock.symbol)}
              </Text>
            </View>
          </View>
          <View style={styles.changeContainer}>
            <Ionicons 
              name={getChangeIcon(stock.change)} 
              size={16} 
              color={getChangeColor(stock.change)} 
            />
            <View style={styles.changeTextContainer}>
              <Text style={[styles.changePercent, { color: getChangeColor(stock.change) }]}>
                {formatPercentage(stock.changePercent)}
              </Text>
              <Text style={[styles.changeAmountSmall, { color: getChangeColor(stock.change) }]}>
                {' '}{formatPrice(stock.change)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* 24h stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>24h High</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatPrice(stock.high)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>24h Low</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatPrice(stock.low)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>24h Volume</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{formatVolume(stock.volume)}</Text>
          </View>
        </View>
      </View>

      {/* Additional metrics */}
      <View style={[styles.metricsSection, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Market Cap</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {formatMarketCap(stock.marketCap)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Avg Volume</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {formatVolume(stock.avgVolume)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Day Open</Text>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {formatPrice(stock.openPrice || stock.previousClose)}
            </Text>
          </View>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  symbolContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tickerInfo: {
    flex: 1,
  },
  ticker: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 12,
    marginTop: 2,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exchangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  exchangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  priceSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  changeAmountSmall: {
    fontSize: 12,
    marginLeft: 4,
  },
  changePercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StockHeader;
