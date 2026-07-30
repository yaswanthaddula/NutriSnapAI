import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Animated,
  PanResponder,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;

const SwipeableNotification = ({ notif, onComplete, onDismiss, onMarkRead, iconInfo, themeColors, accentColor, isDark }: any) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const itemHeight = useRef(new Animated.Value(0)).current;
  const [isDeleted, setIsDeleted] = useState(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          pan.x.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Trigger Delete Animation
          Animated.timing(pan.x, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: false
          }).start(() => {
            setIsDeleted(true);
            Animated.timing(itemHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false
            }).start(() => {
              onDismiss(notif);
            });
          });
        } else {
          // Reset
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const handleLongPress = () => {
    Alert.alert("Notification Options", notif.title, [
      { text: "Cancel", style: "cancel" },
      { text: notif.isRead ? "Mark as Unread" : "Mark as Read", onPress: () => onMarkRead(notif.id) },
      { text: "Delete", style: "destructive", onPress: () => {
          setIsDeleted(true);
          onDismiss(notif);
      }}
    ]);
  };

  if (isDeleted) return <Animated.View style={{ height: itemHeight }} />;

  const isUnread = !notif.isRead;
  
  // Set Category color border based on type
  const typeLower = (notif.type || '').toLowerCase();
  let categoryColor = themeColors.healthAccent; // default
  if (typeLower.includes('miss') || typeLower.includes('warn')) categoryColor = '#F44336';
  else if (typeLower.includes('complet')) categoryColor = '#4CAF50';
  else if (typeLower.includes('remind') || typeLower.includes('water')) categoryColor = '#2196F3';
  else if (typeLower.includes('insight') || typeLower.includes('ai')) categoryColor = '#9C27B0';
  else if (typeLower.includes('workout') || typeLower.includes('gym')) categoryColor = '#FF9800';

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Background Delete Button */}
      <View style={[styles.deleteBackground, { backgroundColor: '#FF3B30' }]}>
        <Ionicons name="trash-outline" size={24} color="#FFF" />
        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700', marginTop: 4 }}>Delete</Text>
      </View>
      
      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.swipeCard, 
          { 
            backgroundColor: isUnread ? (isDark ? '#2C2C2E' : '#FFFFFF') : (isDark ? '#1C1C1E' : '#F9FAFB'),
            transform: [{ translateX: pan.x }],
            borderLeftColor: categoryColor,
          }
        ]}
      >
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => onComplete(notif)} 
          onLongPress={handleLongPress}
          style={styles.cardInner}
        >
          {isUnread && <View style={[styles.unreadIndicator, { backgroundColor: accentColor }]} />}
          
          <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
             <Text style={{ fontSize: 24 }}>{iconInfo.emoji}</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: themeColors.text, fontWeight: isUnread ? '800' : '600' }]} numberOfLines={1}>
                {notif.title}
              </Text>
              <Text style={[styles.cardTime, { color: themeColors.subText }]}>{notif.relativeTime}</Text>
            </View>
            <Text style={[styles.cardDesc, { color: themeColors.subText }]} numberOfLines={2}>
              {notif.message}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};


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
    if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    if (diffDays === 1 || (diffHours >= 24 && diffHours < 48)) return 'Yesterday';
    if (diffDays < 7) {
       return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Pre-calculate relative times to inject into object
  const notificationsWithTime = sortedNotifications.map(n => ({
      ...n,
      relativeTime: getRelativeTime(n.createdAt)
  }));

  // Grouping logic
  const now = new Date();
  const groups = {
    'Today': [] as any[],
    'Yesterday': [] as any[],
    'Earlier': [] as any[]
  };

  notificationsWithTime.forEach(notif => {
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

  const handleComplete = (notif: any) => {
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
          return (
            <SwipeableNotification 
              key={notif.id}
              notif={notif}
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onMarkRead={markAsRead}
              iconInfo={iconInfo}
              themeColors={themeColors}
              accentColor={accentColor}
              isDark={isDark}
            />
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
  groupTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1.2 },
  
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center'
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  emptySub: { fontSize: 16, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 }
});
