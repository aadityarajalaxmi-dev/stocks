import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal, PanResponder } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 80; // Account for margins and y-axis labels
const CHART_HEIGHT = 120;
const EXPANDED_CHART_WIDTH = screenWidth * 3; // Much wider for horizontal scrolling
const EXPANDED_CHART_HEIGHT = screenHeight * 0.6; // Use 60% of screen height

// Simple Line Chart Component
const SimpleLineChart = ({ data, title, yAxisLabel, color = '#2196F3', theme }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const range = maxValue - minValue || 1;

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - ((item.value - minValue) / range) * CHART_HEIGHT;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.colors.cardBackground }]}>
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.chartWrapper}>
        <View style={styles.chart}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            {/* Background */}
            <Rect width="100%" height="100%" fill={theme.colors.background} />
            
            {/* RSI/MACD line */}
            <Path
              d={`M ${points.split(' ').map((point, index) => {
                if (index === 0) return point;
                return `L ${point}`;
              }).join(' ')}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * CHART_WIDTH;
              const y = CHART_HEIGHT - ((item.value - minValue) / range) * CHART_HEIGHT;
              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={color}
                />
              );
            })}
          </Svg>
        </View>
        
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>
            {maxValue.toFixed(1)}
          </Text>
          <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>
            {((maxValue + minValue) / 2).toFixed(1)}
          </Text>
          <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>
            {minValue.toFixed(1)}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.yAxisTitle, { color: theme.colors.textSecondary }]}>
        {yAxisLabel}
      </Text>
    </View>
  );
};

// RSI Chart Component
export const RSIChart = ({ rsiData, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  if (!rsiData || rsiData.length === 0) {
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>RSI (14)</Text>
        <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No RSI data available</Text>
      </View>
    );
  }

  const currentRSI = rsiData[rsiData.length - 1]?.value || 0;
  const rsiSignal = getRSISignal(currentRSI);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isExpanded,
    onMoveShouldSetPanResponder: () => isExpanded,
    onPanResponderGrant: (evt) => {
      if (isExpanded) {
        const { locationX, locationY } = evt.nativeEvent;
        setDragPosition({ x: locationX, y: locationY });
        updateTooltipData(locationX, locationY, EXPANDED_CHART_WIDTH, EXPANDED_CHART_HEIGHT);
      }
    },
    onPanResponderMove: (evt) => {
      if (isExpanded) {
        const { locationX, locationY } = evt.nativeEvent;
        setDragPosition({ x: locationX, y: locationY });
        updateTooltipData(locationX, locationY, EXPANDED_CHART_WIDTH, EXPANDED_CHART_HEIGHT);
      }
    },
    onPanResponderRelease: () => {
      if (isExpanded) {
        setTimeout(() => {
          setDragPosition(null);
          setTooltipData(null);
        }, 2000);
      }
    },
  });

  const updateTooltipData = (x, y, chartWidth, chartHeight) => {
    const dataIndex = Math.round((x / chartWidth) * (rsiData.length - 1));
    const dataPoint = rsiData[dataIndex];
    
    if (dataPoint) {
      const rsiAtY = 100 - (y / chartHeight) * 100;
      
      setTooltipData({
        rsi: dataPoint.value,
        rsiAtCursor: rsiAtY,
        index: dataIndex,
        date: dataPoint.date || `Point ${dataIndex + 1}`
      });
    }
  };

  const renderChart = (width, height, isExpandedView = false) => {
    const chartWidth = width;
    const chartHeight = height;

    return (
      <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background */}
          <Rect width="100%" height="100%" fill={theme.colors.surfaceVariant} />
          
          {/* RSI line */}
          <Path
            d={`M ${rsiData.map((item, index) => {
              const x = (index / (rsiData.length - 1)) * chartWidth;
              const y = chartHeight - (item.value / 100) * chartHeight;
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#2196F3"
            strokeWidth={isExpandedView ? "3" : "2"}
          />
          
          {/* Overbought/Oversold lines */}
          <Line x1="0" y1={chartHeight * 0.3} x2={chartWidth} y2={chartHeight * 0.3} stroke="#F44336" strokeWidth="1" strokeDasharray="5,5" />
          <Line x1="0" y1={chartHeight * 0.7} x2={chartWidth} y2={chartHeight * 0.7} stroke="#F44336" strokeWidth="1" strokeDasharray="5,5" />
          
          {/* Data points */}
          {rsiData.map((item, index) => {
            const x = (index / (rsiData.length - 1)) * chartWidth;
            const y = chartHeight - (item.value / 100) * chartHeight;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={isExpandedView ? "3" : "2"}
                fill="#2196F3"
              />
            );
          })}

          {/* Crosshair lines for expanded view */}
          {isExpandedView && dragPosition && (
            <>
              <Line x1={dragPosition.x} y1="0" x2={dragPosition.x} y2={chartHeight} stroke={theme.colors.text} strokeWidth="1" opacity="0.7" />
              <Line x1="0" y1={dragPosition.y} x2={chartWidth} y2={dragPosition.y} stroke={theme.colors.text} strokeWidth="1" opacity="0.7" />
            </>
          )}
        </Svg>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.chartContainer, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.7}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>RSI (14)</Text>
          <View style={styles.signalContainer}>
            <Text style={[styles.currentValue, { color: theme.colors.text }]}>
              {currentRSI.toFixed(1)}
            </Text>
            <Text style={[styles.signal, { color: rsiSignal.color }]}>
              {rsiSignal.signal}
            </Text>
            <Ionicons name="expand" size={16} color={theme.colors.textSecondary} style={styles.expandIcon} />
          </View>
        </View>
        
        <View style={styles.chartWrapper}>
          {renderChart(CHART_WIDTH, CHART_HEIGHT)}
          
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>100</Text>
            <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>70</Text>
            <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>50</Text>
            <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>30</Text>
            <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>0</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Chart Modal */}
      <Modal
        visible={isExpanded}
        transparent={false}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={[styles.expandedChartContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>RSI (14) - Detailed View</Text>
              <TouchableOpacity onPress={() => setIsExpanded(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.scrollContainer}
            >
              <View 
                style={[styles.expandedChart, { backgroundColor: theme.colors.surfaceVariant }]}
                {...panResponder.panHandlers}
              >
                {renderChart(EXPANDED_CHART_WIDTH, EXPANDED_CHART_HEIGHT, true)}
                
                {/* Y-axis labels for expanded view */}
                <View style={styles.expandedYAxisLabels}>
                  <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>100</Text>
                  <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>70</Text>
                  <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>50</Text>
                  <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>30</Text>
                  <Text style={[styles.yAxisLabel, { color: theme.colors.textSecondary }]}>0</Text>
                </View>
              </View>
            </ScrollView>

            {/* Tooltip for expanded view */}
            {tooltipData && (
              <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.tooltipTitle, { color: theme.colors.text }]}>
                  {tooltipData.date instanceof Date ? tooltipData.date.toLocaleDateString() : tooltipData.date}
                </Text>
                <View style={styles.tooltipRow}>
                  <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>RSI:</Text>
                  <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                    {tooltipData.rsi.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>At cursor:</Text>
                  <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
                    {tooltipData.rsiAtCursor.toFixed(1)}
                  </Text>
                </View>
              </View>
            )}
        </View>
      </Modal>
    </>
  );
};

// MACD Chart Component
export const MACDChart = ({ macdData, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  if (!macdData || !macdData.macd || macdData.macd.length === 0) {
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>MACD</Text>
        <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No MACD data available</Text>
      </View>
    );
  }

  const currentMACD = macdData.macd[macdData.macd.length - 1]?.value || 0;
  const currentSignal = macdData.signal[macdData.signal.length - 1]?.value || 0;
  const macdSignal = getMACDSignal(currentMACD, currentSignal);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isExpanded,
    onMoveShouldSetPanResponder: () => isExpanded,
    onPanResponderGrant: (evt) => {
      if (isExpanded) {
        const { locationX, locationY } = evt.nativeEvent;
        setDragPosition({ x: locationX, y: locationY });
        updateTooltipData(locationX, locationY, EXPANDED_CHART_WIDTH, EXPANDED_CHART_HEIGHT);
      }
    },
    onPanResponderMove: (evt) => {
      if (isExpanded) {
        const { locationX, locationY } = evt.nativeEvent;
        setDragPosition({ x: locationX, y: locationY });
        updateTooltipData(locationX, locationY, EXPANDED_CHART_WIDTH, EXPANDED_CHART_HEIGHT);
      }
    },
    onPanResponderRelease: () => {
      if (isExpanded) {
        setTimeout(() => {
          setDragPosition(null);
          setTooltipData(null);
        }, 2000);
      }
    },
  });

  const updateTooltipData = (x, y, chartWidth, chartHeight) => {
    const dataIndex = Math.round((x / chartWidth) * (macdData.macd.length - 1));
    const macdPoint = macdData.macd[dataIndex];
    const signalPoint = macdData.signal[dataIndex];
    
    if (macdPoint && signalPoint) {
      const macdAtY = (chartHeight / 2 - y) / 10; // Reverse scale calculation
      
      setTooltipData({
        macd: macdPoint.value,
        signal: signalPoint.value,
        macdAtCursor: macdAtY,
        index: dataIndex,
        date: macdPoint.date || `Point ${dataIndex + 1}`
      });
    }
  };

  const renderChart = (width, height, isExpandedView = false) => {
    const chartWidth = width;
    const chartHeight = height;

    return (
      <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background */}
          <Rect width="100%" height="100%" fill={theme.colors.surfaceVariant} />
          
          {/* MACD line */}
          <Path
            d={`M ${macdData.macd.map((item, index) => {
              const x = (index / (macdData.macd.length - 1)) * chartWidth;
              const y = chartHeight / 2 - (item.value * 10); // Scale for visibility
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#2196F3"
            strokeWidth={isExpandedView ? "3" : "2"}
          />
          
          {/* Signal line */}
          <Path
            d={`M ${macdData.signal.map((item, index) => {
              const x = (index / (macdData.signal.length - 1)) * chartWidth;
              const y = chartHeight / 2 - (item.value * 10); // Scale for visibility
              return `${x},${y}`;
            }).join(' L ')}`}
            fill="none"
            stroke="#FF9800"
            strokeWidth={isExpandedView ? "3" : "2"}
          />
          
          {/* Zero line */}
          <Line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke={theme.colors.border} strokeWidth="1" />
          
          {/* Data points */}
          {macdData.macd.map((item, index) => {
            const x = (index / (macdData.macd.length - 1)) * chartWidth;
            const y = chartHeight / 2 - (item.value * 10);
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={isExpandedView ? "3" : "2"}
                fill="#2196F3"
              />
            );
          })}

          {/* Crosshair lines for expanded view */}
          {isExpandedView && dragPosition && (
            <>
              <Line x1={dragPosition.x} y1="0" x2={dragPosition.x} y2={chartHeight} stroke={theme.colors.text} strokeWidth="1" opacity="0.7" />
              <Line x1="0" y1={dragPosition.y} x2={chartWidth} y2={dragPosition.y} stroke={theme.colors.text} strokeWidth="1" opacity="0.7" />
            </>
          )}
        </Svg>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.chartContainer, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.7}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>MACD (12,26,9)</Text>
          <View style={styles.signalContainer}>
            <Text style={[styles.currentValue, { color: theme.colors.text }]}>
              MACD: {currentMACD.toFixed(3)}
            </Text>
            <Text style={[styles.signal, { color: macdSignal.color }]}>
              {macdSignal.signal}
            </Text>
            <Ionicons name="expand" size={16} color={theme.colors.textSecondary} style={styles.expandIcon} />
          </View>
        </View>
        
        <View style={styles.chartWrapper}>
          {renderChart(CHART_WIDTH, CHART_HEIGHT)}
        </View>
      </TouchableOpacity>

      {/* Expanded Chart Modal */}
      <Modal
        visible={isExpanded}
        transparent={false}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={[styles.expandedChartContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>MACD (12,26,9) - Detailed View</Text>
              <TouchableOpacity onPress={() => setIsExpanded(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.scrollContainer}
            >
              <View 
                style={[styles.expandedChart, { backgroundColor: theme.colors.surfaceVariant }]}
                {...panResponder.panHandlers}
              >
                {renderChart(EXPANDED_CHART_WIDTH, EXPANDED_CHART_HEIGHT, true)}
              </View>
            </ScrollView>

            {/* Tooltip for expanded view */}
            {tooltipData && (
              <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.tooltipTitle, { color: theme.colors.text }]}>
                  {tooltipData.date instanceof Date ? tooltipData.date.toLocaleDateString() : tooltipData.date}
                </Text>
                <View style={styles.tooltipRow}>
                  <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>MACD:</Text>
                  <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                    {tooltipData.macd.toFixed(3)}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>Signal:</Text>
                  <Text style={[styles.tooltipValue, { color: theme.colors.text }]}>
                    {tooltipData.signal.toFixed(3)}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <Text style={[styles.tooltipLabel, { color: theme.colors.textSecondary }]}>At cursor:</Text>
                  <Text style={[styles.tooltipValue, { color: theme.colors.primary }]}>
                    {tooltipData.macdAtCursor.toFixed(3)}
                  </Text>
                </View>
              </View>
            )}
        </View>
      </Modal>
    </>
  );
};

// Helper functions
const getRSISignal = (rsiValue) => {
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
};

const getMACDSignal = (macd, signal) => {
  if (macd > signal) return { signal: 'Bullish', color: '#4CAF50' };
  if (macd < signal) return { signal: 'Bearish', color: '#F44336' };
  return { signal: 'Neutral', color: '#757575' };
};

const styles = StyleSheet.create({
  chartContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  signalContainer: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  signal: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chart: {
    flex: 1,
  },
  yAxisLabels: {
    width: 40,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  yAxisTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  expandIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  expandedChartContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingTop: 50, // Account for status bar
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 10,
  },
  expandedChart: {
    position: 'relative',
    minWidth: EXPANDED_CHART_WIDTH,
    height: EXPANDED_CHART_HEIGHT,
    borderRadius: 12,
  },
  expandedYAxisLabels: {
    position: 'absolute',
    right: 10,
    top: 0,
    height: EXPANDED_CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  tooltip: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default { RSIChart, MACDChart };
