import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/notificationService';

const SettingsModal = ({ visible, onClose }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState('10min');
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const notificationIntervals = [
    { value: '5min', label: '5 minutes' },
    { value: '10min', label: '10 minutes' },
    { value: '30min', label: '30 minutes' },
    { value: '1hr', label: '1 hour' },
    { value: '3hr', label: '3 hours' },
    { value: '6hr', label: '6 hours' },
    { value: '24hr', label: '24 hours' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'legal', label: 'Legal', icon: 'document-text' }
  ];

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('notificationsEnabled');
      const interval = await AsyncStorage.getItem('notificationInterval');
      
      if (enabled !== null) {
        setNotificationsEnabled(JSON.parse(enabled));
      }
      if (interval) {
        setNotificationInterval(interval);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleNotificationToggle = async (value) => {
    if (value) {
      // Request permissions when enabling notifications
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive stock alerts.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
      // Restart notification service with new settings
      await NotificationService.restart();
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleIntervalChange = async (interval) => {
    setNotificationInterval(interval);
    setShowIntervalPicker(false);
    try {
      await AsyncStorage.setItem('notificationInterval', interval);
      // Restart notification service with new settings
      await NotificationService.restart();
    } catch (error) {
      console.error('Error saving notification interval:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Pressable 
          style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Tab Navigation */}
          <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  {
                    borderBottomColor: activeTab === tab.id ? theme.colors.primary : 'transparent'
                  }
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={20} 
                  color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary
                  }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'general' && (
              <>
                {/* Theme Setting */}
                <TouchableOpacity
                  style={[styles.settingItem, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={toggleTheme}
                >
                  <View style={styles.settingItemLeft}>
                    <Ionicons 
                      name={isDarkMode ? "moon" : "sunny"} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <View style={styles.settingItemText}>
                      <Text style={[styles.settingItemTitle, { color: theme.colors.text }]}>
                        Theme
                      </Text>
                      <Text style={[styles.settingItemSubtitle, { color: theme.colors.textSecondary }]}>
                        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>

                {/* Notifications Setting */}
                <View style={[styles.settingItem, { borderBottomColor: theme.colors.borderLight }]}>
                  <View style={styles.settingItemLeft}>
                    <Ionicons 
                      name="notifications" 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <View style={styles.settingItemText}>
                      <Text style={[styles.settingItemTitle, { color: theme.colors.text }]}>
                        Notifications
                      </Text>
                      <Text style={[styles.settingItemSubtitle, { color: theme.colors.textSecondary }]}>
                        Stock alerts for greatest changes
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={notificationsEnabled ? '#fff' : theme.colors.textSecondary}
                  />
                </View>

                {/* Notification Interval Setting */}
                {notificationsEnabled && (
                  <TouchableOpacity
                    style={[styles.settingItem, { borderBottomColor: theme.colors.borderLight }]}
                    onPress={() => setShowIntervalPicker(!showIntervalPicker)}
                  >
                    <View style={styles.settingItemLeft}>
                      <Ionicons 
                        name="time" 
                        size={24} 
                        color={theme.colors.primary} 
                      />
                      <View style={styles.settingItemText}>
                        <Text style={[styles.settingItemTitle, { color: theme.colors.text }]}>
                          Notification Interval
                        </Text>
                        <Text style={[styles.settingItemSubtitle, { color: theme.colors.textSecondary }]}>
                          {notificationIntervals.find(interval => interval.value === notificationInterval)?.label}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name={showIntervalPicker ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={theme.colors.textSecondary} 
                    />
                  </TouchableOpacity>
                )}

                {/* Interval Picker */}
                {notificationsEnabled && showIntervalPicker && (
                  <View style={[styles.intervalPicker, { backgroundColor: theme.colors.background }]}>
                    {notificationIntervals.map((interval) => (
                      <TouchableOpacity
                        key={interval.value}
                        style={[
                          styles.intervalOption,
                          { 
                            backgroundColor: notificationInterval === interval.value 
                              ? theme.colors.primary + '20' 
                              : 'transparent',
                            borderBottomColor: theme.colors.borderLight
                          }
                        ]}
                        onPress={() => handleIntervalChange(interval.value)}
                      >
                        <Text style={[
                          styles.intervalOptionText,
                          { 
                            color: notificationInterval === interval.value 
                              ? theme.colors.primary 
                              : theme.colors.text 
                          }
                        ]}>
                          {interval.label}
                        </Text>
                        {notificationInterval === interval.value && (
                          <Ionicons 
                            name="checkmark" 
                            size={20} 
                            color={theme.colors.primary} 
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {activeTab === 'legal' && (
              <Pressable 
                style={styles.legalContent}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={[styles.legalHeader, { borderBottomColor: theme.colors.borderLight }]}>
                  <Ionicons 
                    name="document-text" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                  <Text style={[styles.legalTitle, { color: theme.colors.text }]}>
                    Terms and Conditions
                  </Text>
                </View>
                
                <ScrollView 
                  style={styles.legalScrollContainer}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  scrollEventThrottle={16}
                  bounces={false}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <View style={styles.legalTextContainer}>
                    <Text style={[styles.legalText, { color: theme.colors.textSecondary }]}>
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>1. ACCEPTANCE OF TERMS{"\n\n"}</Text>
                      By accessing or using Trackr FX (the "App"), you acknowledge and agree to be bound by these Terms and Conditions. The App is provided solely for the purpose of delivering stock market and foreign exchange market data, analysis, and educational content, and does not constitute a broker-dealer, financial advisor, or investment adviser service, nor does it execute trades on behalf of users.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>2. DISCLAIMER AND RISK ACKNOWLEDGMENT{"\n\n"}</Text>
                      All information provided through the App is for informational purposes only and is not guaranteed as to accuracy, completeness, or timeliness, and no representation or warranty, express or implied, is made regarding future results. You acknowledge that all investment and trading decisions are undertaken at your sole discretion and risk.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>3. USER REQUIREMENTS AND RESPONSIBILITIES{"\n\n"}</Text>
                      You further agree that certain features of the App may be subject to subscription fees or other charges, which are disclosed prior to purchase and are non-refundable except as required by applicable law. Users must be at least eighteen (18) years of age to utilize the App and are solely responsible for maintaining the confidentiality of their account credentials and for refraining from unlawful, fraudulent, or otherwise prohibited use of the App.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>4. LIMITATION OF LIABILITY{"\n\n"}</Text>
                      To the maximum extent permitted by law, Trackr FX, its affiliates, and licensors disclaim all liability for any losses, damages, claims, or expenses, including but not limited to lost profits or trading losses, arising from or related to use of, or reliance upon, the App.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>5. INTELLECTUAL PROPERTY{"\n\n"}</Text>
                      All intellectual property, including without limitation trademarks, content, and design elements contained within the App, are the exclusive property of Trackr FX or its licensors and may not be copied, reproduced, or modified without prior written consent.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>6. TERMINATION AND DISPUTES{"\n\n"}</Text>
                      The Company reserves the right to suspend or terminate user access in the event of any violation of these Terms. All disputes arising out of or relating to these Terms shall be resolved by binding arbitration in accordance with the laws of [Jurisdiction], and you hereby waive the right to participate in class actions or jury trials to the fullest extent permitted by law.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>7. MODIFICATIONS{"\n\n"}</Text>
                      Continued use of the App following any modifications to these Terms constitutes acceptance of such modifications.
                      
                      {"\n\n"}
                      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>8. CONTACT INFORMATION{"\n\n"}</Text>
                      Questions or concerns regarding these Terms may be directed to aadityarajalaxmi@gmail.com
                      
                      {"\n\n"}
                      <Text style={[styles.lastUpdated, { color: theme.colors.textTertiary }]}>Last Updated: {new Date().toLocaleDateString()}</Text>
                    </Text>
                  </View>
                </ScrollView>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  settingsContent: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
  },
  intervalPicker: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  intervalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  intervalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  legalContent: {
    flex: 1,
    paddingTop: 8,
  },
  legalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  legalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  legalScrollContainer: {
    flex: 1,
    maxHeight: 300,
    backgroundColor: 'transparent',
  },
  legalTextContainer: {
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  legalText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  lastUpdated: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SettingsModal;
