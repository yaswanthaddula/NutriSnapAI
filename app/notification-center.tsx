import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';

export default function NotificationCenterScreen() {
  const { isDark } = useTheme();
  const { notifications, markAsRead, clearNotification, fetchNotifications } = useAppStore();
  const { fromMode } = useLocalSearchParams();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const mode = fromMode === 'gym' ? 'gym' : 'health';

  const themeColors = {
    bg: isDark ? '#121212' : '#F4F7FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#011627',
    subText: isDark ? '#9CA3AF' : '#7D8592',
    border: isDark ? '#333333' : '#E0E6ED',
    healthAccent: '#4CAF50',
    gymAccent: '#FF9800',
    iconBg: isDark ? '#2A2A2A' : '#F3F4F6'
  };

  const accentColor = mode === 'gym' ? themeColors.gymAccent : themeColors.healthAccent;

  const activeNotifs = notifications.filter(n => n.status !== 'cleared');

  // Exact filtering based on User's explicit requirements
  const filteredNotifications = activeNotifs.filter((n) => {
    const title = (n.title || '').toLowerCase();
    const type = (n.type || '').toLowerCase();
    
    if (mode === 'health') {
      // ONLY: Breakfast, Lunch, Dinner, Water, Medicine, Sleep, BMI Update, Health Tips
      return /(breakfast|lunch|dinner|snack|meal|water|medicine|pill|sleep|recover|bmi|tip|insight)/.test(type) ||
             /(breakfast|lunch|dinner|snack|meal|water|medicine|pill|sleep|recover|bmi|tip|insight)/.test(title);
    }
    
    if (mode === 'gym') {
      // ONLY: Workout, Exercise, Protein, Calories Burned, Fitness Progress, Weekly Fitness Report
      return /(workout|gym|exercise|protein|calorie|fitness|streak|report)/.test(type) ||
             /(workout|gym|exercise|protein|calorie|fitness|streak|report)/.test(title);
    }
    return false;
  });

  // Sort by newest first
  const sortedNotifications = filteredNotifications.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Grouping logic
  const now = new Date();
  const groups = {
    'Today': [] as any[],
    'Yesterday': [] as any[],
    'Earlier': [] as any[]
  };

  sortedNotifications.forEach(notif => {
    const d = new Date(notif.createdAt || 0);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      groups['Today'].push(notif);
    } else if (diffDays === 1 || (diffDays === 0 && d.getDate() !== now.getDate())) {
      groups['Yesterday'].push(notif);
    } else {
      groups['Earlier'].push(notif);
    }
  });

  const getIconForType = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const txt = (title || '').toLowerCase();
    if (t.includes('breakfast')) return { emoji: '🍳', color: '#F59E0B', bg: '#FEF3C7' };
    if (t.includes('lunch')) return { emoji: '🍱', color: '#10B981', bg: '#D1FAE5' };
    if (t.includes('dinner')) return { emoji: '🍽️', color: '#8B5CF6', bg: '#EDE9FE' };
    if (t.includes('water')) return { emoji: '💧', color: '#3B82F6', bg: '#DBEAFE' };
    if (t.includes('medicine') || t.includes('pill')) return { emoji: '💊', color: '#EF4444', bg: '#FEE2E2' };
    if (t.includes('workout') || t.includes('gym') || t.includes('exercise')) return { emoji: '🏋', color: '#EF4444', bg: '#FEE2E2' };
    if (t.includes('insight') || txt.includes('ai') || t.includes('tip')) return { emoji: '🤖', color: '#6366F1', bg: '#E0E7FF' };
    if (t.includes('streak') || txt.includes('achieve') || t.includes('progress')) return { emoji: '🏆', color: '#F59E0B', bg: '#FEF3C7' };
    if (t.includes('report')) return { emoji: '📊', color: '#10B981', bg: '#D1FAE5' };
    if (t.includes('sleep') || t.includes('recover')) return { emoji: '😴', color: '#8B5CF6', bg: '#EDE9FE' };
    if (t.includes('protein')) return { emoji: '🥩', color: '#F43F5E', bg: '#FFE4E6' };
    if (t.includes('calorie')) return { emoji: '🔥', color: '#F97316', bg: '#FFEDD5' };
    return { emoji: '🔔', color: accentColor, bg: isDark ? '#333' : '#E8F5E9' };
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleComplete = (notif: any) => {
    if (!notif.isRead) markAsRead(notif.id);
    clearNotification(notif.id);
    
    const t = (notif.type || '').toLowerCase();
    if (t.includes('meal') || t.includes('breakfast') || t.includes('lunch') || t.includes('dinner') || t.includes('snack')) {
      router.push('/health-food-selection');
    } else if (t.includes('workout') || t.includes('gym')) {
      router.push('/(tabs)/gym-home');
    } else if (t.includes('water') || t.includes('sleep') || t.includes('medicine')) {
      router.push('/(health-tabs)/health-home');
    }
  };

  const handleDismiss = (notif: any) => {
    clearNotification(notif.id);
  };

  const renderGroup = (title: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <View key={title} style={styles.groupContainer}>
        <Text style={[styles.groupTitle, { color: themeColors.subText }]}>{title}</Text>
        {items.map(notif => {
          const iconInfo = getIconForType(notif.type, notif.title);
          const isUnread = !notif.isRead;
          
          return (
            <View key={notif.id} style={[styles.card, { backgroundColor: themeColors.card, shadowColor: isDark ? '#000' : '#888' }]}>
              {isUnread && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}
              
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? themeColors.iconBg : iconInfo.bg }]}>
                  <Text style={styles.emojiIcon}>{iconInfo.emoji}</Text>
                </View>
                
                <View style={styles.textContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.titleText, { color: themeColors.text, fontWeight: isUnread ? '800' : '600' }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={[styles.timeText, { color: themeColors.subText }]}>
                      {getRelativeTime(notif.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.descText, { color: themeColors.subText }]} numberOfLines={2}>
                    {notif.message}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.actionsRow, { borderTopColor: themeColors.border }]}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleComplete(notif)}>
                  <Text style={[styles.actionBtnText, { color: accentColor, fontWeight: '700' }]}>Complete</Text>
                </TouchableOpacity>
                <View style={[styles.actionDivider, { backgroundColor: themeColors.border }]} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDismiss(notif)}>
                  <Text style={[styles.actionBtnText, { color: themeColors.subText, fontWeight: '600' }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={[styles.header, { backgroundColor: themeColors.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <View style={[styles.iconCircle, { backgroundColor: themeColors.card }]}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notifications</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {sortedNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyCircle, { backgroundColor: isDark ? '#2A2A2A' : '#E8F5E9' }]}>
              <Ionicons name="notifications-off-outline" size={50} color={themeColors.subText} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>All Caught Up!</Text>
            <Text style={[styles.emptySub, { color: themeColors.subText }]}>No new notifications right now.</Text>
          </View>
        ) : (
          <>
            {renderGroup('Today', groups['Today'])}
            {renderGroup('Yesterday', groups['Yesterday'])}
            {renderGroup('Earlier', groups['Earlier'])}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: Platform.OS === 'android' ? 50 : 20, 
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  backBtn: { padding: 0 },
  iconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  groupContainer: { marginBottom: 25 },
  groupTitle: { fontSize: 15, fontWeight: '700', marginBottom: 15, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  unreadDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 10
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 18,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiIcon: { fontSize: 28 },
  textContent: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  titleText: { fontSize: 17, flex: 1, paddingRight: 10 },
  timeText: { fontSize: 13, fontWeight: '500' },
  descText: { fontSize: 15, lineHeight: 22 },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: 50,
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDivider: {
    width: 1,
    height: '100%',
  },
  actionBtnText: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  emptySub: { fontSize: 16, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 }
});
