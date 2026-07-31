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
      id: 1, day: 'Monday', task: '8,000 Steps + Stretching', icon: '👣', iconType: 'emoji', color: '#E3F2FD', path: '/monday-detail',
      subtitle: 'Stay active and improve flexibility.', videoId: null
    },
    { 
      id: 2, day: 'Tuesday', task: 'Low Sugar Day + 3L Water', icon: '💧', iconType: 'emoji', color: '#E1F5FE', path: '/tuesday-detail',
      subtitle: 'Hydrate well and flush out toxins.', videoId: null
    },
    { 
      id: 3, day: 'Wednesday', task: '30 Min Walk + Early Sleep', icon: '🚶', iconType: 'emoji', color: '#E8F5E9', path: '/wednesday-detail',
      subtitle: 'Keep moving and rest up early.', videoId: 'lCg_gh_fuyI'
    },
    { 
      id: 4, day: 'Thursday', task: 'Yoga + Balanced Meals', icon: '🧘', iconType: 'emoji', color: '#F3E5F5', path: '/thursday-detail',
      subtitle: 'Focus on balance and nutrition.', videoId: 'v7AYKMP6rOE'
    },
    { 
      id: 5, day: 'Friday', task: 'Cardio Walk + Stress Relief', icon: '❤️', iconType: 'emoji', color: '#FCE4EC', path: '/friday-detail',
      subtitle: 'End the week with a strong heart.', videoId: 'X65504ISbxA'
    },
    { 
      id: 6, day: 'Saturday', task: 'Outdoor Activity + Fruit Focus', icon: '🌳', iconType: 'emoji', color: '#F1F8E9', path: '/saturday-detail',
      subtitle: 'Get some fresh air and vitamins.', videoId: 'ml6cT4AZdqI'
    },
    { 
      id: 7, day: 'Sunday', task: 'Recovery + Relaxation', icon: '🌙', iconType: 'emoji', color: '#FFF3E0', path: '/sunday-detail',
      subtitle: 'Recharge for the week ahead.', videoId: 'f_6v9Wn_XmY'
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

        {days.map((item) => {
          let statusText = "Upcoming";
          let statusBg = isDark ? '#333' : '#F5F5F5';
          let statusColor = isDark ? '#AAA' : '#777';
          
          if (completedDayIds.includes(item.id)) {
            statusText = "Completed";
            statusBg = isDark ? 'rgba(0,200,83,0.15)' : '#E8F5E9';
            statusColor = '#00C853';
          } else if (item.id === presentDayOf7) {
            statusText = "Today's Goal";
            statusBg = isDark ? 'rgba(33,150,243,0.15)' : '#E3F2FD';
            statusColor = '#2196F3';
          }

          return (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => handleDayPress(item)} 
            activeOpacity={0.8}
          >
            {/* BADGE ROW */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
               <Text style={[styles.dayLabel, { color: theme.subText }]}>{item.day.toUpperCase()}</Text>
               <View style={{ backgroundColor: statusBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 }}>
                 <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{statusText}</Text>
               </View>
            </View>

            {/* INFO ROW */}
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#2A2A2A' : item.color }]}>
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
              </View>

              <View style={styles.dayInfo}>
                <Text style={[styles.taskText, { color: theme.text }]}>{item.task}</Text>
                <Text style={[styles.subtitleText, { color: theme.subText }]} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </View>

            {/* PREVIEW IMAGE OR EXERCISE GUIDE */}
            {item.videoId ? (
              <View style={[styles.videoWrapper, { borderColor: theme.border }]}>
                 <Image 
                  source={{ uri: `https://img.youtube.com/vi/${item.videoId}/0.jpg` }} 
                  style={styles.cardVideo}
                  resizeMode="cover"
                 />
                 <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>15:00</Text>
                 </View>
                 <View style={styles.videoOverlay}>
                    <Ionicons name="play" size={26} color="white" style={{ marginLeft: 3 }} />
                 </View>
              </View>
            ) : (
              <View style={[styles.guideWrapper, { backgroundColor: isDark ? '#222' : '#F8F9FA', borderColor: theme.border }]}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <Text style={{ fontSize: 18, marginRight: 8 }}>🏃</Text>
                   <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Exercise Guide</Text>
                 </View>
                 
                 <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                   <View style={styles.guideStat}>
                     <Ionicons name="time-outline" size={16} color={theme.subText} />
                     <Text style={[styles.guideStatText, { color: theme.text }]}>30 Min</Text>
                   </View>
                   <View style={[styles.guideStat, { marginLeft: 18 }]}>
                     <Ionicons name="flame-outline" size={16} color="#FF9800" />
                     <Text style={[styles.guideStatText, { color: theme.text }]}>180 kcal</Text>
                   </View>
                 </View>

                 <Text style={{ color: theme.subText, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>Benefits</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                   <Ionicons name="checkmark-circle" size={14} color="#00C853" style={{ marginRight: 6 }} />
                   <Text style={{ color: theme.text, fontSize: 13 }}>Improves heart health</Text>
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                   <Ionicons name="checkmark-circle" size={14} color="#00C853" style={{ marginRight: 6 }} />
                   <Text style={{ color: theme.text, fontSize: 13 }}>Burns calories effectively</Text>
                 </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <Ionicons name="checkmark-circle" size={14} color="#00C853" style={{ marginRight: 6 }} />
                   <Text style={{ color: theme.text, fontSize: 13 }}>Supports better sleep & recovery</Text>
                 </View>
              </View>
            )}
          </TouchableOpacity>
          );
        })}

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
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    borderWidth: 1
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  dayInfo: { flex: 1, marginLeft: 16 },
  dayLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  taskText: { fontSize: 18, fontWeight: 'bold', marginTop: 3 },
  subtitleText: { fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  videoWrapper: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1 },
  cardVideo: { width: '100%', height: '100%' },
  videoOverlay: { position: 'absolute', top: '50%', left: '50%', marginTop: -24, marginLeft: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,200,83,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  guideWrapper: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1 },
  guideStat: { flexDirection: 'row', alignItems: 'center' },
  guideStatText: { fontSize: 14, fontWeight: '600', marginLeft: 6 }
});