import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform, 
  Alert,
  Animated
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';
import { WORKOUT_PLANS } from '../src/data/workoutPlans';
import { notificationService } from '../src/services/notificationService';

export default function WorkoutDetailScreen() {
  const { day } = useLocalSearchParams();
  const { isDark } = useTheme();
  const { activeWorkout, startWorkout, pauseWorkout, resumeWorkout, completeWorkout } = useAppStore();
  
  const workoutData = WORKOUT_PLANS.find(p => p.dayOfWeek === day || p.day === day) || WORKOUT_PLANS[0];
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#707070',
    border: isDark ? '#333333' : '#F0F0F0',
    accent: '#FF6D00'
  };

  useEffect(() => {
    if (activeWorkout && activeWorkout.day === day && activeWorkout.status === 'running') {
      const elapsed = Math.floor((Date.now() - activeWorkout.startTime - activeWorkout.totalPausedTime) / 1000);
      setSeconds(elapsed);
      
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (activeWorkout && activeWorkout.day === day && activeWorkout.status === 'paused') {
        const elapsed = Math.floor((activeWorkout.pausedAt - activeWorkout.startTime - activeWorkout.totalPausedTime) / 1000);
        setSeconds(elapsed);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout, day]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (activeWorkout && activeWorkout.status !== 'completed') {
      Alert.alert("Workout in progress", "Finish your current workout first!");
      return;
    }
    startWorkout({ day, name: workoutData.name, calories: workoutData.calories });
  };

  const handleComplete = () => {
    Alert.alert(
      "Complete Workout",
      "Are you sure you want to finish this session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Complete", 
          onPress: () => {
            completeWorkout(seconds);
            notificationService.checkAndGenerate();
            Alert.alert(`${workoutData.name} completed!`, "Great work today.");
            router.back();
          } 
        }
      ]
    );
  };

  const isCurrentWorkout = activeWorkout && activeWorkout.day === day;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (isCurrentWorkout && activeWorkout.status === 'running') {
                Alert.alert("Workout in progress", "Exit current session?", [
                    { text: "No", style: "cancel" },
                    { text: "Yes", onPress: () => router.back() }
                ]);
            } else {
                router.back();
            }
        }}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{workoutData.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.timerCard, { backgroundColor: theme.accent }]}>
          <Text style={styles.timerLabel}>Duration</Text>
          <Text style={styles.timerValue}>{isCurrentWorkout ? formatTime(seconds) : "00:00"}</Text>
          <View style={styles.timerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="flame" size={16} color="#FFF" />
              <Text style={styles.metaText}>{workoutData.calories} kcal</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#FFF" />
              <Text style={styles.metaText}>{workoutData.duration}</Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {!isCurrentWorkout ? (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <Ionicons name="play" size={24} color="#FFF" />
              <Text style={styles.btnText}>Start Workout</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              {activeWorkout.status === 'running' ? (
                <TouchableOpacity style={styles.pauseBtn} onPress={pauseWorkout}>
                  <Ionicons name="pause" size={24} color="#FFF" />
                  <Text style={styles.btnText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resumeBtn} onPress={resumeWorkout}>
                  <Ionicons name="play" size={24} color="#FFF" />
                  <Text style={styles.btnText}>Resume</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
                <Ionicons name="checkmark-done" size={24} color="#FFF" />
                <Text style={styles.btnText}>Complete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exercises</Text>
        {workoutData.exercises.map((ex, index) => (
          <View key={index} style={[styles.exCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.exIcon}>
              <Text style={{ fontSize: 24 }}>{ex.icon}</Text>
            </View>
            <View style={styles.exInfo}>
              <Text style={[styles.exName, { color: theme.text }]}>{ex.name}</Text>
              <Text style={[styles.exStats, { color: theme.subText }]}>{ex.sets} sets × {ex.reps} reps</Text>
            </View>
            <Ionicons name="checkbox-outline" size={24} color={isCurrentWorkout ? theme.accent : "#DDD"} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 10, paddingBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  scroll: { padding: 20 },
  timerCard: { borderRadius: 30, padding: 30, alignItems: 'center', marginBottom: 25, elevation: 8, shadowColor: '#FF6D00', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  timerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  timerValue: { color: '#FFF', fontSize: 64, fontWeight: '900', marginVertical: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  timerMeta: { flexDirection: 'row', marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  metaText: { color: '#FFF', marginLeft: 5, fontWeight: '600' },
  controls: { marginBottom: 30 },
  startBtn: { backgroundColor: '#00C853', flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  activeControls: { flexDirection: 'row', justifyContent: 'space-between' },
  pauseBtn: { backgroundColor: '#FFB300', flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flex: 0.45, elevation: 4 },
  resumeBtn: { backgroundColor: '#00C853', flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flex: 0.45, elevation: 4 },
  completeBtn: { backgroundColor: '#FF3D00', flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flex: 0.45, elevation: 4 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  exCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  exIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  exInfo: { flex: 1 },
  exName: { fontSize: 16, fontWeight: 'bold' },
  exStats: { fontSize: 13, marginTop: 2 }
});
