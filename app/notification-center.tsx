import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';

const { width } = Dimensions.get('window');

const SwipeableCard = ({ notif, children, onClear, onRead, themeColors }: any) => {
  const [pan] = useState(new Animated.Value(0));
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dx < 0) {
          pan.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx < -80) {
          Animated.timing(pan, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClear());
        } else {
          Animated.spring(pan, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;

  return (
    <View style={{ marginBottom: 12, overflow: 'hidden', borderRadius: 16 }}>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 25, borderRadius: 16 }}>
        <Ionicons name="trash" size={24} color="#FFF" />
      </View>
      
      <Animated.View
        style={{ transform: [{ translateX: pan }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => onRead()}
          style={[
            styles.card, 
            { backgroundColor: themeColors.card, borderColor: themeColors.border, marginBottom: 0 },
            !notif.isRead && styles.unreadCard
          ]}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function NotificationCenterScreen() {
  const { isDark } = useTheme();
  const { notifications, markAsRead, markAllAsRead, clearNotification, fetchNotifications } = useAppStore();
  
  const { fromMode } = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Meals', 'Fitness', 'Health', 'Achievements', 'Unread'];

  useEffect(() => {
    if (fromMode === 'gym') {
      setActiveFilter('Fitness');
    } else if (fromMode === 'health') {
      setActiveFilter('Health');
    }
  }, [fromMode]);

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
    // Health Dashboard should not prioritize workout notifications
    if (fromMode === 'health' && activeFilter === 'All') {
       if (n.type?.includes('workout') || n.type?.includes('gym') || n.title?.toLowerCase().includes('workout')) {
           return false;
       }
    }
    
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !n.isRead;
    if (activeFilter === 'Meals') return n.type?.includes('meal') || n.title?.toLowerCase().includes('meal');
    if (activeFilter === 'Fitness') return n.type?.includes('workout') || n.type?.includes('gym') || n.title?.toLowerCase().includes('workout');
    if (activeFilter === 'Health') return n.type?.includes('water') || n.type?.includes('sleep') || n.type?.includes('insight');
    if (activeFilter === 'Achievements') return n.type?.includes('streak') || n.type?.includes('goal') || n.title?.toLowerCase().includes('achiev');
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
                      <SwipeableCard
                        key={notif.id}
                        notif={notif}
                        themeColors={themeColors}
                        onRead={() => { if (!notif.isRead) markAsRead(notif.id); }}
                        onClear={() => clearNotification(notif.id)}
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
                          <Text style={[styles.cardTitle, { color: themeColors.text, fontWeight: notif.isRead ? '600' : '800' }]}>
                            {notif.title}
                          </Text>
                          <Text style={[styles.cardDesc, { color: themeColors.subText }]}>
                            {notif.message}
                          </Text>
                          <Text style={[styles.cardTime, { color: themeColors.accent }]}>
                            {formatTime(notif.createdAt)}
                          </Text>
                        </View>
                        
                        {!notif.isRead && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>NEW</Text>
                          </View>
                        )}
                        <TouchableOpacity 
                          style={styles.deleteInlineBtn} 
                          onPress={() => clearNotification(notif.id)}
                        >
                          <Ionicons name="close-circle-outline" size={24} color={themeColors.subText} />
                        </TouchableOpacity>
                      </SwipeableCard>
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
  card: { flexDirection: 'row', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  unreadCard: { shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  cardLeft: { marginRight: 15 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 17, marginBottom: 6 },
  cardDesc: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  cardTime: { fontSize: 12, fontWeight: 'bold' },
  unreadBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, position: 'absolute', top: -10, left: -5 },
  unreadBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  deleteInlineBtn: { padding: 5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
