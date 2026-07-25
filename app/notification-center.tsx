import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated,
  Platform,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';

export default function NotificationCenterScreen() {
  const { isDark } = useTheme();
  const { notifications, markAsRead, markAllAsRead, clearNotification, fetchNotifications } = useAppStore();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Meals', 'Fitness', 'Health', 'Achievements', 'Unread'];

  // Ensure notifications are up to date
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
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.isRead;
    if (activeFilter === 'Meals') return n.type?.includes('meal') || n.title?.toLowerCase().includes('meal');
    if (activeFilter === 'Fitness') return n.type?.includes('workout') || n.type?.includes('gym');
    if (activeFilter === 'Health') return n.type?.includes('water') || n.type?.includes('sleep');
    if (activeFilter === 'Achievements') return n.type?.includes('streak') || n.type?.includes('goal');
    return true;
  });

  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
    const date = new Date(notif.createdAt || Date.now());
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group = 'Earlier';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(notif);
    return acc;
  }, {} as Record<string, any[]>);

  // Sorting helper
  const sortGroup = (group: any[]) => group.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const getIconForType = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const txt = (title || '').toLowerCase();
    if (t.includes('breakfast')) return { name: 'egg-fried', color: '#F59E0B' };
    if (t.includes('lunch')) return { name: 'food-variant', color: '#10B981' };
    if (t.includes('dinner')) return { name: 'silverware-fork-knife', color: '#8B5CF6' };
    if (t.includes('water')) return { name: 'water-drop', color: '#3B82F6', isMaterial: false };
    if (t.includes('workout') || t.includes('gym')) return { name: 'dumbbell', color: '#EF4444' };
    if (t.includes('insight') || txt.includes('ai')) return { name: 'robot', color: '#6366F1' };
    if (t.includes('streak') || txt.includes('achieve')) return { name: 'trophy', color: '#F59E0B' };
    if (t.includes('report')) return { name: 'chart-box', color: '#10B981' };
    return { name: 'bell-outline', color: themeColors.accent };
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Read",
      "Are you sure you want to remove all read notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            activeNotifs.forEach(n => {
              if (n.isRead) clearNotification(n.id);
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>🔔 Notifications</Text>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <MaterialCommunityIcons name="playlist-remove" size={26} color={themeColors.subText} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { color: themeColors.subText }]}>
          Stay updated with your health and fitness activities.
        </Text>

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
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 50, marginBottom: 15 }}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>You're all caught up!</Text>
            <Text style={[styles.emptySub, { color: themeColors.subText }]}>No new notifications.</Text>
          </View>
        ) : (
          ['Today', 'Yesterday', 'Earlier'].map((group) => {
            if (!groupedNotifications[group] || groupedNotifications[group].length === 0) return null;
            return (
              <View key={group} style={styles.groupContainer}>
                <Text style={[styles.groupTitle, { color: themeColors.text }]}>{group}</Text>
                {sortGroup(groupedNotifications[group]).map((notif: any) => {
                  const iconInfo = getIconForType(notif.type, notif.title);
                  
                  return (
                      <TouchableOpacity 
                        key={notif.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (!notif.isRead) markAsRead(notif.id);
                        }}
                        style={[
                          styles.card, 
                          { backgroundColor: themeColors.card, borderColor: themeColors.border },
                          !notif.isRead && styles.unreadCard
                        ]}
                      >
                        <View style={styles.cardLeft}>
                          <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + '15' }]}>
                            {iconInfo.isMaterial === false ? (
                              <Ionicons name={iconInfo.name as any} size={22} color={iconInfo.color} />
                            ) : (
                              <MaterialCommunityIcons name={iconInfo.name as any} size={22} color={iconInfo.color} />
                            )}
                          </View>
                        </View>
                        <View style={styles.cardBody}>
                          <Text style={[styles.cardTitle, { color: themeColors.text, fontWeight: notif.isRead ? '600' : 'bold' }]}>
                            {notif.title}
                          </Text>
                          <Text style={[styles.cardDesc, { color: themeColors.subText }]}>
                            {notif.message}
                          </Text>
                          <Text style={[styles.cardTime, { color: themeColors.subText }]}>
                            {formatTime(notif.createdAt)}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteInlineBtn} 
                          onPress={() => clearNotification(notif.id)}
                        >
                          <Ionicons name="trash-outline" size={20} color={themeColors.subText} />
                        </TouchableOpacity>
                        {!notif.isRead && (
                          <View style={styles.unreadDot} />
                        )}
                      </TouchableOpacity>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { padding: 5, marginLeft: -5 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  clearBtn: { padding: 5, marginRight: -5 },
  headerSubtitle: { fontSize: 14, paddingHorizontal: 20, marginTop: 8 },
  filterScrollWrapper: { marginTop: 20 },
  filterScroll: { paddingHorizontal: 15, paddingBottom: 5 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, borderWidth: 1 },
  filterText: { fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 50 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { fontSize: 15 },
  groupContainer: { marginBottom: 25 },
  groupTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, marginLeft: 5 },
  card: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  unreadCard: { shadowOpacity: 0.1, shadowRadius: 8 },
  cardLeft: { marginRight: 15 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, marginBottom: 4 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  cardTime: { fontSize: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', position: 'absolute', top: 16, right: 16 },
  deleteInlineBtn: { padding: 5, justifyContent: 'center', alignItems: 'center' }
});
