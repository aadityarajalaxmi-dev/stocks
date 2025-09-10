import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
  Alert
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

  const notificationIntervals = [
    { value: '5min', label: '5 minutes' },
    { value: '10min', label: '10 minutes' },
    { value: '30min', label: '30 minutes' },
    { value: '1hr', label: '1 hour' },
    { value: '3hr', label: '3 hours' },
    { value: '6hr', label: '6 hours' },
    { value: '24hr', label: '24 hours' }
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
        <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingsContent}>
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
          </View>
        </View>
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
    width: '85%',
    borderRadius: 16,
    maxHeight: '60%',
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
});

export default SettingsModal;
