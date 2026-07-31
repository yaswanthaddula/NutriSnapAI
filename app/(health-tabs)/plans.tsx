import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../_layout';
import { useVideoPlayer, VideoView } from 'expo-video';
import useAppStore from '../../src/store/useAppStore';

const { width } = Dimensions.get('window');

// Simple Video Component for the list
const CardVideo = ({ url, isDark }: { url: string, isDark: boolean }) => {
  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView 
      player={player} 
      style={styles.cardVideo} 
      nativeControls={false}
      allowsFullscreen={false}
    />
  );
};

 export default function HealthPlans() {
  const { isDark } = useTheme();
  const { workouts } = useAppStore();

  const days = [
    { 
      id: 1, day: 'Monday', task: '8,000 Steps + Stretching', icon: 'shoe-print', iconType: 'MCI', color: '#E3F2FD', path: '/monday-detail',
      videoId: null
    },
    { 
      id: 2, day: 'Tuesday', task: 'Low Sugar Day + 3L Water', icon: 'water', iconType: 'Ionicons', color: '#E1F5FE', path: '/tuesday-detail',
      videoId: null
    },
    { 
      id: 3, day: 'Wednesday', task: '30 Min Walk + Early Sleep', icon: 'walk', iconType: 'Ionicons', color: '#E8F5E9', path: '/wednesday-detail',
      videoId: 'lCg_gh_fuyI'
    },
    { 
      id: 4, day: 'Thursday', task: 'Yoga + Balanced Meals', icon: 'self-improvement', iconType: 'Material', color: '#F3E5F5', path: '/thursday-detail',
      videoId: 'v7AYKMP6rOE'
    },
    { 
      id: 5, day: 'Friday', task: 'Cardio Walk + Stress Relief', icon: 'heart', iconType: 'Ionicons', color: '#FCE4EC', path: '/friday-detail',
      videoId: 'X65504ISbxA'
    },
    { 
      id: 6, day: 'Saturday', task: 'Outdoor Activity + Fruit Focus', icon: 'tree', iconType: 'MCI', color: '#F1F8E9', path: '/saturday-detail',
      videoId: 'ml6cT4AZdqI'
    },
    { 
      id: 7, day: 'Sunday', task: 'Recovery + Relaxation', icon: 'flower', iconType: 'MCI', color: '#FFF3E0', path: '/sunday-detail',
      videoId: 'f_6v9Wn_XmY'
    },
  ];

  // Calculate dynamic progress based on "Present Day"
  const today = new Date();
  const dayIndex = today.getDay(); // 0 (Sun) to 6 (Sat)
  const presentDayOf7 = dayIndex === 0 ? 7 : dayIndex; // 1 (Mon) to 7 (Sun)

  // Also calculate completed days for checkmarks
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const thisWeekCompleted = workouts.filter(w => {
    if (w.type !== 'health') return false;
    const d = new Date(w.date);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const completedDayIds = thisWeekCompleted.map(w => {
    const dayObj = days.find(d => d.day === w.day);
    return dayObj ? dayObj.id : null;
  }).filter((id): id is number => id !== null);

  const handleDayPress = (item: any) => {
    router.push({
      pathname: item.path,
      params: { 
        videoId: item.videoId,
        day: item.day,
        task: item.task
      }
    });
  };

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    border: isDark ? '#333333' : '#F0F0F0',
    headerBg: isDark ? '#1A1A1A' : '#FFFFFF',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Weekly Health Plan 🌿</Text>
        <Text style={[styles.headerSub, { color: theme.subText }]}>Your personalized wellness journey</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <View style={styles.focusIconBg}>
              <Text style={{fontSize: 24}}>🎯</Text>
            </View>
            <View style={{marginLeft: 15}}>
              <Text style={styles.focusTitle}>This Week's Focus</Text>
              <Text style={styles.focusSub}>Build sustainable healthy habits</Text>
            </View>
          </View>
          
          <View style={styles.progressRow}>
            {days.map((item) => (
              <View 
                key={item.id} 
                style={[styles.progressSegment, item.id <= presentDayOf7 && styles.segmentActive]} 
              />
            ))}
          </View>
          <Text style={styles.progressText}>{presentDayOf7}/7 days progress</Text>
        </View>

        {days.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => handleDayPress(item)} 
            activeOpacity={0.7}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2A2A' : item.color }]}>
                {item.iconType === 'MCI' && <MaterialCommunityIcons name={item.icon as any} size={24} color={isDark ? '#00C853' : '#555'} />}
                {item.iconType === 'Ionicons' && <Ionicons name={item.icon as any} size={24} color={isDark ? '#00C853' : '#555'} />}
                {item.iconType === 'Material' && <MaterialCommunityIcons name="meditation" size={24} color={isDark ? '#00C853' : '#555'} />}
              </View>

              <View style={styles.dayInfo}>
                <Text style={[styles.dayLabel, { color: theme.subText }]}>{item.day}</Text>
                <Text style={[styles.taskText, { color: theme.text }]}>{item.task}</Text>
              </View>

              <View style={styles.checkArea}>
                {completedDayIds.includes(item.id) ? (
                  <Ionicons name="checkmark-circle" size={28} color="#00C853" />
                ) : (
                  <Ionicons name="play-circle" size={28} color="#00C853" />
                )}
              </View>
            </View>

            {/* PREVIEW IMAGE (YouTube Thumbnail) */}
            {item.videoId ? (
              <View style={[styles.videoWrapper, { borderColor: theme.border }]}>
                 {Platform.OS === 'web' ? (
                   <iframe 
                     src={`https://www.youtube.com/embed/${item.videoId}?controls=0`} 
                     style={{ width: '100%', height: '100%', border: 'none' }} 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                   />
                 ) : (
                   <>
                     <Image 
                      source={{ uri: `https://img.youtube.com/vi/${item.videoId}/0.jpg` }} 
                      style={styles.cardVideo}
                      resizeMode="cover"
                     />
                     <View style={styles.videoOverlay}>
                        <Ionicons name="play" size={20} color="white" />
                     </View>
                   </>
                 )}
              </View>
            ) : (
              <View style={[styles.videoWrapper, { borderColor: theme.border, backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="videocam-off-outline" size={32} color={theme.subText} style={{ marginBottom: 5 }} />
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }}>Video not available for this task</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingTop: Platform.OS === 'android' ? 45 : 25 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSub: { fontSize: 14, marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 100, width: '100%', maxWidth: 800, alignSelf: 'center' },
  focusCard: { backgroundColor: '#00C853', borderRadius: 25, padding: 20, marginBottom: 25, elevation: 5, shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  focusIconBg: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  focusTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  focusSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressSegment: { height: 6, flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 2, borderRadius: 3 },
  segmentActive: { backgroundColor: '#FFF' },
  progressText: { color: 'white', fontSize: 12, fontWeight: '600' },
  dayCard: { 
    borderRadius: 25, 
    padding: 15, 
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  dayInfo: { flex: 1, marginLeft: 15 },
  dayLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  taskText: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  checkArea: { width: 40, alignItems: 'center' },
  videoWrapper: { width: '100%', height: 160, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1 },
  cardVideo: { width: '100%', height: '100%' },
  videoOverlay: { position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});