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
          onLongPress={() => {
            Alert.alert(
              "Notification Options",
              notif.title,
              [
                { text: "Cancel", style: "cancel" },
                { text: notif.isRead ? "Mark Unread" : "Mark Read", onPress: () => onRead() },
                { text: "Delete", style: "destructive", onPress: () => onClear() }
              ]
            );
          }}
          style={[
            styles.card, 
            { 
              backgroundColor: notif.isRead ? themeColors.card : (themeColors.accent + '15'), 
              borderColor: notif.isRead ? themeColors.border : themeColors.accent, 
              marginBottom: 0,
              shadowColor: notif.isRead ? '#000' : themeColors.accent,
              shadowOffset: { width: 0, height: notif.isRead ? 4 : 8 },
              shadowOpacity: notif.isRead ? 0.05 : 0.2,
              shadowRadius: notif.isRead ? 10 : 15,
              elevation: notif.isRead ? 3 : 8
            }
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
  const initialFilter = fromMode === 'gym' ? 'Fitness' : (fromMode === 'health' ? 'Health' : 'All');
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const filters = ['All', 'Health', 'Fitness'];

  useEffect(() => {
    if (fromMode === 'gym') setActiveFilter('Fitness');
    else if (fromMode === 'health') setActiveFilter('Health');
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
    if (activeFilter === 'Health') {
      return n.type?.match(/meal|breakfast|lunch|dinner|snack|water|medicine|pill|sleep|recover|insight|bmi/i) || n.title?.match(/meal|breakfast|lunch|dinner|snack|water|medicine|pill|sleep|recover|insight|bmi/i);
    }
    if (activeFilter === 'Fitness') {
      return n.type?.match(/workout|gym|protein|exercise|calorie|streak/i) || n.title?.match(/workout|gym|protein|exercise|calorie|streak/i);
    }
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
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <View style={styles.iconCircle}>
              <Ionicons name="arrow-back" size={22} color={themeColors.text} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Notifications</Text>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="playlist-remove" size={24} color={themeColors.subText} />
            </View>
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
                        onRead={() => handleNotificationTap(notif)}
                        onClear={() => clearNotification(notif.id)}
                      >
                        <View style={styles.cardBody}>
                          <View style={styles.cardHeaderRow}>
                            <View style={styles.cardTitleContainer}>
                              <Text style={styles.emojiIcon}>{iconInfo.emoji}</Text>
                              <Text style={[styles.cardTitle, { color: themeColors.text, fontWeight: notif.isRead ? '600' : '800' }]} numberOfLines={1}>
                                {notif.title}
                              </Text>
                            </View>
                            <Text style={[styles.cardTime, { color: themeColors.subText }]}>
                              {getRelativeTime(notif.createdAt)}
                            </Text>
                          </View>
                          
                          <Text style={[styles.cardDesc, { color: themeColors.subText }]}>
                            {notif.message}
                          </Text>
                        </View>
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
  header: { paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 20, borderBottomWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5, backgroundColor: 'rgba(255,255,255,0.9)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { padding: 5, marginLeft: -5 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  clearBtn: { padding: 5, marginRight: -5 },
  headerSubtitle: { fontSize: 14, paddingHorizontal: 25, marginTop: 12, fontWeight: '500' },
  filterScrollWrapper: { marginTop: 25 },
  filterScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginHorizontal: 6, borderWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  filterText: { fontSize: 14, letterSpacing: 0.3 },
  listContent: { padding: 20, paddingBottom: 80 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, letterSpacing: 0.5 },
  emptySub: { fontSize: 16 },
  groupContainer: { marginBottom: 30 },
  groupTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, marginLeft: 5, letterSpacing: 0.5, opacity: 0.8 },
  card: { flexDirection: 'row', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1 },
  unreadCard: { shadowOpacity: 0.2, shadowRadius: 20, elevation: 10, borderColor: 'rgba(59, 130, 246, 0.4)' },
  cardBody: { flex: 1, justifyContent: 'center' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emojiIcon: { fontSize: 24, marginRight: 12, backgroundColor: 'rgba(0,0,0,0.03)', padding: 8, borderRadius: 16, overflow: 'hidden' },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 17, flexShrink: 1, letterSpacing: 0.3 },
  cardTime: { fontSize: 12, fontWeight: '600', opacity: 0.7 },
  cardDesc: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginTop: 2 }
});
