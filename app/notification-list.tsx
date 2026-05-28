import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  LayoutAnimation
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';
import { notificationService } from '../src/services/notificationService';

export default function NotificationList() {
  const { isDark } = useTheme();
  const { notifications, userProfile, markAllAsRead, clearNotifications } = useAppStore();
  
  const currentMode = (userProfile.selected_mode || 'gym').toLowerCase();
  // Show notifications for current mode, or those without a mode (for backward compatibility)
  const filteredNotifications = notifications.filter((n: any) => !n.mode || n.mode === currentMode);

  useEffect(() => {
    // Generate fresh notifications when opening the list
    notificationService.checkAndGenerate();
  }, []);

  const handleMarkAllRead = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    markAllAsRead();
  };

  const handleClear = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    clearNotifications();
  };

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#FFFFFF', 
    border: isDark ? '#333333' : '#F0F0F0',
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={handleMarkAllRead} style={{ marginRight: 15 }}>
             <Text style={styles.markRead}>Mark Read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear}>
             <Text style={[styles.markRead, { color: '#FF5252' }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleArea}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <Text style={[styles.subTitle, { color: theme.subText }]}>Stay updated</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item: any) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => useAppStore.getState().markAsRead(item.id)}
              style={[
                styles.card, 
                { backgroundColor: theme.card, borderColor: theme.border },
                !item.isRead && { borderLeftWidth: 4, borderLeftColor: '#00C853' }
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#333' : '#F9FAFB' }]}>
                <MaterialCommunityIcons name={(item as any).icon || 'bell'} size={28} color={(item as any).color || '#00C853'} />
              </View>
              <View style={styles.textContent}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.notifDesc, { color: theme.subText }]}>{item.message}</Text>
                <Text style={styles.notifTime}>{getTimeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={80} color="#CCC" />
            <Text style={[styles.emptyText, { color: theme.subText }]}>All caught up!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 40 : 10 
  },
  markRead: { color: '#00C853', fontWeight: 'bold', fontSize: 14 },
  titleArea: { paddingHorizontal: 25, marginVertical: 20 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subTitle: { fontSize: 16, marginTop: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  card: { 
    flexDirection: 'row', 
    padding: 18, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  iconBox: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15 
  },
  textContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 17, fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  notifDesc: { fontSize: 14, marginTop: 4 },
  notifTime: { fontSize: 12, color: '#AAAAAA', marginTop: 8 },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100 
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '500', 
    marginTop: 15 
  }
});