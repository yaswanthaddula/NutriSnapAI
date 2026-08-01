import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  Vibration
} from 'react-native';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WORKOUT_PLANS } from '../src/data/workoutPlans';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';
import analyticsService from '../src/services/analyticsService';

const { width } = Dimensions.get('window');

export default function ExerciseDetailScreen() {
  const { day, exerciseId } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { completeWorkout, addNotification } = useAppStore();

  const dayData = WORKOUT_PLANS.find(p => p.day === day) || WORKOUT_PLANS[0];
  const exercise = dayData.exercises.find(e => e.id === exerciseId) || dayData.exercises[0];

  const [playing, setPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showGuide, setShowGuide] = useState(!exercise.videoId && !exercise.youtubeUrl);

  // Helper to extract YouTube Video ID
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 1. Prioritize videoId field
  // 2. Extract from youtubeUrl or video field
  // 3. Use generic fallback (Squats demo) if nothing found
  const youtubeId = exercise.videoId || getYoutubeId(exercise.youtubeUrl || exercise.video) || 'aclHkVaku9U';
  const isYoutube = !!youtubeId;

  // Fallback for non-YouTube (MP4) - strictly if isYoutube is false (which shouldn't happen now)
  const videoSource = !isYoutube && (exercise.youtubeUrl || exercise.video) ? (exercise.youtubeUrl || exercise.video) : 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4';
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
  });

  useEffect(() => {
    if (!isYoutube) {
      player.play();
    }
  }, [player, isYoutube]);

  useEffect(() => {
    analyticsService.logActivity('VIDEO_PLAY', `Played ${exercise.name} video`);
  }, []);

  // Stop video when leaving screen
  useEffect(() => {
    return () => {
      setPlaying(false);
      try {
        // Only pause the expo-video player if it's currently being used (non-YouTube)
        if (!isYoutube && player) {
          player.pause();
        }
      } catch (error) {
        // Silently handle cases where the shared player object is already released
        console.log("Video Player cleanup handled.");
      }
    };
  }, [player, isYoutube]);

  // Timer Logic
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const timerRef = useRef(null);

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#707070',
    border: isDark ? '#333333' : '#F0F0F0',
    accent: '#00C853',
    timer: '#FF6D00'
  };

  const playAlarm = async () => {
    try {
      Vibration.vibrate([0, 500, 200, 500]);
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
      );
      await sound.playAsync();
      setTimeout(() => {
        sound.unloadAsync().catch(() => {});
      }, 3000);
    } catch (error) {
      console.log("Alarm sound error:", error);
    }
  };

  useEffect(() => {
    if (isResting && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime(prev => prev - 1);
      }, 1000);
    } else if (restTime === 0) {
      clearInterval(timerRef.current);
      setIsResting(false);
      setRestTime(60);
      playAlarm(); // TRIGGER ALARM HERE
      
      if (currentSet < exercise.sets) {
        setCurrentSet(prev => prev + 1);
      } else {
        Alert.alert("Exercise Complete!", "You've finished all sets for this exercise.");
      }
    }

    return () => clearInterval(timerRef.current);
  }, [isResting, restTime]);

  const handleCompleteSet = () => {
    if (currentSet < exercise.sets) {
      setIsResting(true);
    } else {
      Alert.alert(
        "Workout Progress",
        "Exercise completed! Do you want to finish the entire workout session?",
        [
          { text: "Keep Going", style: "cancel" },
          { 
            text: "Finish Workout", 
            onPress: () => {
              // Ensure we record the workout in the global store for the dashboard
              // We'll set a temporary active workout if none exists, then complete it
              useAppStore.setState(state => ({
                activeWorkout: {
                  day: dayData.day,
                  name: dayData.day,
                  calories: dayData.calories,
                  id: Date.now(),
                  startTime: Date.now(),
                  totalPausedTime: 0,
                  status: 'running'
                }
              }));
              
              completeWorkout(0); 
              
              addNotification({
                title: "Workout Completed!",
                message: `You crushed your ${dayData.day} session!`,
                type: "success"
              });
              router.push('/(tabs)/gym-home');
            } 
          }
        ]
      );
    }
  };

  const handleStartTimer = () => {
    setIsResting(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{exercise.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* MEDIA SECTION */}
        {showGuide ? (
          <View style={[styles.guideContainer, { backgroundColor: isDark ? '#222' : '#F5F5F5', borderColor: theme.border }]}>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
               <Text style={{ fontSize: 24, marginRight: 10 }}>💡</Text>
               <View>
                 <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Form & Technique Guide</Text>
                 <Text style={{ color: theme.subText, fontSize: 13 }}>Follow the instructions below carefully</Text>
               </View>
             </View>
             <View style={styles.guideTip}>
                <Ionicons name="information-circle" size={20} color="#2196F3" style={{ marginRight: 8 }} />
                <Text style={{ color: theme.text, fontSize: 14, flex: 1 }}>Focus on your breathing and maintain a steady pace. Quality over quantity.</Text>
             </View>
             {(exercise.videoId || exercise.youtubeUrl) && (
               <TouchableOpacity onPress={() => { setShowGuide(false); setVideoError(false); }} style={{ marginTop: 15, alignSelf: 'flex-start', padding: 8, backgroundColor: 'rgba(0,200,83,0.1)', borderRadius: 8 }}>
                 <Text style={{ color: '#00C853', fontWeight: 'bold', fontSize: 12 }}>🔄 Try Loading Video Again</Text>
               </TouchableOpacity>
             )}
          </View>
        ) : (
          <View style={[styles.videoContainer, { backgroundColor: '#000' }]}>
            {isYoutube ? (
              <YoutubePlayer
                height={width * 0.6}
                width={width}
                play={playing}
                videoId={youtubeId}
                onError={() => { setVideoError(true); setShowGuide(true); }}
                onChangeState={(event) => {
                  if (event === 'ended') setPlaying(false);
                }}
              />
            ) : (
              <VideoView
                player={player}
                style={styles.video}
                nativeControls={true}
              />
            )}
            
            <TouchableOpacity 
              style={styles.brokenVideoBtn}
              onPress={() => setShowGuide(true)}
            >
               <Text style={styles.brokenVideoText}>Video Broken? View Guide</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.mainInfo}>
            <View>
              <Text style={[styles.targetMuscle, { color: theme.subText }]}>Target Muscle</Text>
              <Text style={[styles.targetValue, { color: theme.text }]}>{exercise.targetMuscle}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={[styles.targetMuscle, { color: theme.subText }]}>Equipment</Text>
              <Text style={[styles.targetValue, { color: theme.text }]}>{exercise.equipment}</Text>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Sets</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{exercise.sets}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Reps</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{exercise.reps}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.subText }]}>Rest</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>60s</Text>
            </View>
          </View>

          {/* TIMER / TRACKER */}
          <View style={[styles.trackerSection, { backgroundColor: isResting ? theme.timer : theme.accent }]}>
            {isResting ? (
              <View style={styles.timerContent}>
                <Text style={styles.timerLabel}>REST TIME</Text>
                <Text style={styles.timerValue}>{restTime}s</Text>
                <TouchableOpacity style={styles.skipBtn} onPress={() => setRestTime(0)}>
                  <Text style={styles.skipText}>Skip Rest</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.trackerContent}>
                <View>
                  <Text style={styles.trackerLabel}>CURRENT SET</Text>
                  <Text style={styles.trackerValue}>{currentSet} / {exercise.sets}</Text>
                </View>
                <TouchableOpacity style={styles.completeSetBtn} onPress={handleCompleteSet}>
                  <Text style={styles.completeSetText}>Complete Set</Text>
                  <Ionicons name="checkmark-done" size={24} color={theme.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* INSTRUCTIONS */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Instructions</Text>
          {exercise.instructions.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
            </View>
          ))}

          {/* COMMON MISTAKES */}
          <Text style={[styles.sectionTitle, { color: '#FF5252', marginTop: 25 }]}>Common Mistakes</Text>
          {exercise.mistakes.map((mistake, idx) => (
            <View key={idx} style={styles.mistakeRow}>
              <Ionicons name="close-circle" size={20} color="#FF5252" />
              <Text style={[styles.mistakeText, { color: theme.text }]}>{mistake}</Text>
            </View>
          ))}

          <TouchableOpacity style={[styles.startTimerBtn, { backgroundColor: theme.timer }]} onPress={handleStartTimer}>
            <Ionicons name="stopwatch-outline" size={24} color="#FFF" />
            <Text style={styles.startTimerText}>Start Exercise Timer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 45 : 10, 
    paddingBottom: 15 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  scroll: { paddingBottom: 40 },
  videoContainer: { 
    width: width, 
    height: width * 0.6, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  video: { width: width, height: width * 0.6 },
  brokenVideoBtn: { 
    position: 'absolute', 
    bottom: 10, 
    right: 10, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  brokenVideoText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  guideContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  guideTip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 5
  },
  videoFallback: { alignItems: 'center' },
  fallbackText: { color: '#666', marginTop: 10, fontSize: 16 },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  infoSection: { padding: 20 },
  mainInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  targetMuscle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  targetValue: { fontSize: 16, fontWeight: 'bold' },
  divider: { width: 1, height: 30, backgroundColor: '#DDD', marginHorizontal: 20 },
  statsCard: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    justifyContent: 'space-between',
    marginBottom: 25
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  trackerSection: { 
    borderRadius: 25, 
    padding: 25, 
    marginBottom: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  trackerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  trackerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold' },
  trackerValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  completeSetBtn: { 
    backgroundColor: '#FFF', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center'
  },
  completeSetText: { color: '#00C853', fontWeight: 'bold', marginRight: 8 },
  timerContent: { alignItems: 'center' },
  timerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 'bold' },
  timerValue: { color: '#FFF', fontSize: 48, fontWeight: '900', marginVertical: 5 },
  skipBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  skipText: { color: '#FFF', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  stepRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  stepNumber: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
    marginTop: 2
  },
  stepNumberText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
  mistakeRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  mistakeText: { marginLeft: 10, fontSize: 14 },
  startTimerBtn: { 
    flexDirection: 'row', 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20 
  },
  startTimerText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }
});
