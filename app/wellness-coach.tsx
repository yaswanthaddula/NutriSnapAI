import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import useAppStore from '../src/store/useAppStore';
import { useTheme } from './_layout';

export default function WellnessCoachScreen() {
  const { waterData, steps, todaySleep, streak, userProfile } = useAppStore();
  const { isDark } = useTheme();
  
  const [reminders, setReminders] = useState({
    hydration: true,
    sleep: true,
    walking: true,
    weight: false,
  });

  const toggleSwitch = (key: keyof typeof reminders) => {
    setReminders(prev => ({ 
      ...prev, 
      [key]: !prev[key] 
    }));
  };

  // Real calculations
  const waterGoal = waterData.waterGoal || 2500;
  const stepsGoal = 10000;
  const sleepGoal = 8;

  const waterLeft = Math.max(0, waterGoal - waterData.waterIntake);
  const stepsLeft = Math.max(0, stepsGoal - steps);

  const waterProgress = Math.min(100, (waterData.waterIntake / waterGoal) * 100);
  const stepsProgress = Math.min(100, (steps / stepsGoal) * 100);
  const sleepProgress = todaySleep === 0 ? 0 : Math.min(100, (todaySleep / sleepGoal) * 100);

  const wellnessScore = ((waterProgress + stepsProgress + sleepProgress) / 30).toFixed(1);

  const theme = {
    bg: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={theme.text} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Wellness Coach 🌿</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Your personalized health companion</Text>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreLabel}>Today's Wellness Score</Text>
              <Text style={styles.scoreSub}>Based on your real-time daily habits</Text>
            </View>
            <Text style={styles.scoreValue}>{wellnessScore}</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${(parseFloat(wellnessScore) * 10)}%` }]} /></View>
        </View>

        {/* Smart Reminders */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Reminders</Text>
        <View style={[styles.reminderContainer, { backgroundColor: theme.card }]}>
          {[
            { id: 'hydration', icon: 'water', color: '#2196F3', title: 'Hydration', desc: waterLeft > 0 ? `Drink ${waterLeft}ml more today` : 'Goal reached! Stay hydrated.' },
            { id: 'sleep', icon: 'moon', color: '#FF9800', title: 'Sleep', desc: todaySleep > 0 ? `${todaySleep}h tracked. Aim for 8h.` : 'Aim for 7-8 hours tonight' },
            { id: 'walking', icon: 'walk', color: '#4CAF50', title: 'Walking', desc: stepsLeft > 0 ? `${stepsLeft} steps left to reach goal` : 'Step goal crushed! 🔥' },
          ].map((item) => (
            <View key={item.id} style={styles.reminderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA' }]}><Ionicons name={item.icon as any} size={20} color={item.color} /></View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.itemDesc, { color: theme.subText }]}>{item.desc}</Text>
              </View>
              <Switch 
                value={reminders[item.id as keyof typeof reminders]} 
                onValueChange={() => toggleSwitch(item.id as keyof typeof reminders)} 
                trackColor={{ true: '#00C853', false: isDark ? '#333' : '#D1D5DB' }} 
              />
            </View>
          ))}
        </View>

        {/* Habit Streaks */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Habit Streaks 🔥</Text>
        <View style={styles.streakContainer}>
          {[
            { label: 'Consistency Streak', val: streak.toString(), color: isDark ? '#1A2E22' : '#E8F5E9', labelColor: isDark ? '#FFF' : '#011627' },
            { label: 'Water Goal Streak', val: (waterData.waterIntake >= waterGoal ? streak : 0).toString(), color: isDark ? '#1A2633' : '#E3F2FD', labelColor: isDark ? '#FFF' : '#011627' },
            { label: 'Step Goal Streak', val: (steps >= stepsGoal ? streak : 0).toString(), color: isDark ? '#2E3D31' : '#F1F8E9', labelColor: isDark ? '#FFF' : '#011627' },
          ].map((streakItem, i) => (
            <View key={i} style={[styles.streakItem, { backgroundColor: streakItem.color }]}>
              <Text style={[styles.streakLabel, { color: streakItem.labelColor }]}>{streakItem.label}</Text>
              <Text style={styles.streakVal}>{streakItem.val} 🔥</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#011627' },
  subtitle: { fontSize: 14, color: '#7D8592', marginBottom: 25 },
  scoreCard: { backgroundColor: '#00C853', borderRadius: 25, padding: 25, marginBottom: 30 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  scoreSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  scoreValue: { color: 'white', fontSize: 48, fontWeight: 'bold' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 20 },
  progressBar: { height: '100%', backgroundColor: 'white', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#011627', marginBottom: 15 },
  reminderContainer: { backgroundColor: 'white', borderRadius: 20, padding: 15, marginBottom: 25 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: 'bold' },
  itemDesc: { fontSize: 12, color: '#7D8592' },
  streakContainer: { gap: 10 },
  streakItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderRadius: 15 },
  streakLabel: { fontWeight: '600' },
  streakVal: { fontWeight: 'bold', color: '#FF5722' }
});