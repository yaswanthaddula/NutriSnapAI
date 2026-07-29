import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';

export default function NotificationCenterScreen() {
  const { isDark } = useTheme();
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useAppStore();
  
  const { fromMode } = useLocalSearchParams();
  const initialFilter = fromMode === 'gym' ? 'Fitness' : (fromMode === 'health' ? 'Health' : 'All');
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const filters = ['All', 'Health', 'Fitness'];

  useEffect(() => {
    if (fromMode === 'gym') setActiveFilter('Fitness');
    else if (fromMode === 'health') setActiveFilter('Health');
  }, [fromMode]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const themeColors = {
    bg: isDark ? '#111827' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    subText: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? '#374151' : '#E5E7EB',
    accent: isDark ? '#3B82F6' : '#2563EB',
    iconBg: isDark ? '#374151' : '#F3F4F6'
  };

  const activeNotifs = notifications.filter(n => n.status !== 'cleared');

  const filteredNotifications = activeNotifs.filter((n) => {
    if (activeFilter === 'Health') {
      return n.type?.match(/meal|breakfast|lunch|dinner|snack|water|medicine|pill|sleep|recover|insight|bmi/i) || n.title?.match(/meal|breakfast|lunch|dinner|snack|water|medicine|pill|sleep|recover|insight|bmi/i);
    }
    if (activeFilter === 'Fitness') {
      return n.type?.match(/workout|gym|protein|exercise|calorie|streak/i) || n.title?.match(/workout|gym|protein|exercise|calorie|streak/i);
    }
    return true;
  });

  // Sort by newest first
  const sortedNotifications = filteredNotifications.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const getIconForType = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const txt = (title || '').toLowerCase();
    if (t.includes('breakfast')) return { emoji: '🍳', color: '#F59E0B' };
    if (t.includes('lunch')) return { emoji: '🍱', color: '#10B981' };
    if (t.includes('dinner')) return { emoji: '🍽️', color: '#8B5CF6' };
    if (t.includes('water')) return { emoji: '💧', color: '#3B82F6' };
    if (t.includes('medicine') || t.includes('pill')) return { emoji: '💊', color: '#EF4444' };
    if (t.includes('workout') || t.includes('gym')) return { emoji: '🏋', color: '#EF4444' };
    if (t.includes('insight') || txt.includes('ai')) return { emoji: '🤖', color: '#6366F1' };
    if (t.includes('streak') || txt.includes('achieve')) return { emoji: '🏆', color: '#F59E0B' };
    if (t.includes('report')) return { emoji: '📊', color: '#10B981' };
    if (t.includes('sleep') || t.includes('recover')) return { emoji: '😴', color: '#8B5CF6' };
    return { emoji: '🔔', color: themeColors.accent };
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) {
      if (date.getDate() === now.getDate()) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return 'Yesterday';
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const handleNotificationTap = (notif: any) => {
    if (!notif.isRead) markAsRead(notif.id);
    
    const t = (notif.type || '').toLowerCase();
    if (t.includes('meal') || t.includes('breakfast') || t.includes('lunch') || t.includes('dinner') || t.includes('snack')) {
      router.push('/health-food-selection');
    } else if (t.includes('workout') || t.includes('gym')) {
      router.push('/(tabs)/gym-home');
    } else if (t.includes('water') || t.includes('sleep') || t.includes('medicine')) {
      router.push('/(health-tabs)/health-home');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.bg }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <View style={styles.iconCircle}>
              <Ionicons name="arrow-back" size={22} color={themeColors.text} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notifications</Text>
          <View style={{ width: 40 }} /> {/* Spacer to center title */}
        </View>

        {/* Filters */}
        <View style={styles.filterScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {filters.map(f => {
              const isActive = activeFilter === f;
              return (
                <TouchableOpacity 
                  key={f} 
                  style={[
                    styles.filterChip, 
                    { 
                      backgroundColor: isActive ? themeColors.accent : (isDark ? '#374151' : '#F3F4F6'),
                      borderColor: isActive ? themeColors.accent : themeColors.border
                    }
                  ]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text style={[
                    styles.filterText, 
                    { color: isActive ? '#FFF' : themeColors.subText, fontWeight: isActive ? '600' : '500' }
                  ]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {sortedNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 50, marginBottom: 15 }}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>You're all caught up!</Text>
            <Text style={[styles.emptySub, { color: themeColors.subText }]}>No new notifications.</Text>
          </View>
        ) : (
          sortedNotifications.map((notif: any) => {
            const iconInfo = getIconForType(notif.type, notif.title);
            
            return (
              <TouchableOpacity 
                key={notif.id}
                activeOpacity={0.7}
                onPress={() => handleNotificationTap(notif)}
                style={[
                  styles.notificationItem, 
                  { 
                    backgroundColor: notif.isRead ? themeColors.bg : (isDark ? '#1F2937' : '#EFF6FF'),
                    borderBottomColor: themeColors.border 
                  }
                ]}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.emojiIcon}>{iconInfo.emoji}</Text>
                </View>
                <View style={styles.contentContainer}>
                  <Text style={[styles.titleText, { color: themeColors.text, fontWeight: notif.isRead ? '500' : '700' }]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.descText, { color: themeColors.subText }]} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <Text style={[styles.timeText, { color: themeColors.subText }]}>
                    {getRelativeTime(notif.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 15, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { padding: 5, marginLeft: -5 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: 0.2 },
  filterScrollWrapper: { marginTop: 15 },
  filterScroll: { paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginHorizontal: 4 },
  filterText: { fontSize: 13, letterSpacing: 0.3 },
  listContent: { paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, letterSpacing: 0.5 },
  emptySub: { fontSize: 16 },
  notificationItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1 },
  iconContainer: { marginRight: 16, justifyContent: 'center' },
  emojiIcon: { fontSize: 28 },
  contentContainer: { flex: 1, justifyContent: 'center' },
  titleText: { fontSize: 16, marginBottom: 4 },
  descText: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  timeText: { fontSize: 12, fontWeight: '500' }
});
