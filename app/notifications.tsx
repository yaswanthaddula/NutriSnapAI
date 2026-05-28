import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Switch, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';

export default function NotificationsScreen() {
  const { isDark } = useTheme();

  const { notificationPrefs, updateNotificationPrefs } = useAppStore();

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  // Helper to render each notification row
  const NotificationOption = ({ title, sub, value, onToggle }: any) => (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.optionSub, { color: theme.subText }]}>{sub}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#DDD', true: '#00C853' }} 
        thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        {/* Title Section */}
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Manage your notification preferences</Text>
        </View>

        {/* Options List */}
        <View style={styles.listContainer}>
          <NotificationOption 
            title="Meal Reminders" 
            sub="Get reminded to log your meals" 
            value={notificationPrefs.meals} 
            onToggle={(val: boolean) => updateNotificationPrefs('meals', val)} 
          />
          <NotificationOption 
            title="Workout Reminders" 
            sub="Daily workout notifications" 
            value={notificationPrefs.workout} 
            onToggle={(val: boolean) => updateNotificationPrefs('workout', val)} 
          />
          <NotificationOption 
            title="Water Reminders" 
            sub="Stay hydrated throughout the day" 
            value={notificationPrefs.water} 
            onToggle={(val: boolean) => updateNotificationPrefs('water', val)} 
          />
          <NotificationOption 
            title="Goal Achievements" 
            sub="Celebrate your milestones" 
            value={notificationPrefs.goals} 
            onToggle={(val: boolean) => updateNotificationPrefs('goals', val)} 
          />
          <NotificationOption 
            title="Weekly Reports" 
            sub="Get weekly progress summaries" 
            value={notificationPrefs.reports} 
            onToggle={(val: boolean) => updateNotificationPrefs('reports', val)} 
          />
          <NotificationOption 
            title="Motivational Quotes" 
            sub="Daily inspiration" 
            value={notificationPrefs.quotes} 
            onToggle={(val: boolean) => updateNotificationPrefs('quotes', val)} 
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  backBtn: { marginBottom: 20, marginLeft: -10 },
  headerText: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
  listContainer: { marginTop: 10 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15,
    // Android Shadow
    elevation: 2,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  optionTitle: { fontSize: 18, fontWeight: 'bold' },
  optionSub: { fontSize: 14, marginTop: 4 }
});