import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Platform, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../_layout';
import useAppStore from '../../src/store/useAppStore';
import { WORKOUT_PLANS } from '../../src/data/workoutPlans';

export default function Progress() {
  const { isDark } = useTheme();
  const { userProfile, meals, workouts, weightHistory, steps, caloriesBurned, loadStoredData } = useAppStore();
  
  React.useEffect(() => {
    loadStoredData();
  }, []);

  // --- DATA CALCULATION FOR GRAPHS ---
  
  const getLast7Days = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  };

  const last7Days = getLast7Days();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Re-order day names based on today
  const getOrderedDayNames = () => {
    const today = new Date().getDay(); // 0 is Sunday
    const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(shortNames[d.getDay()]);
    }
    return result;
  };
  const orderedDayNames = getOrderedDayNames();

  // 1. Protein Data
  const proteinData = last7Days.map(date => {
    const dayMeals = meals.filter(m => m.date === date);
    const totalProtein = dayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
    // Scale for bar height (max target is 100% height)
    const target = userProfile.proteinTarget || 100;
    const height = Math.min(100, Math.max(10, (totalProtein / target) * 100));
    return { height, value: totalProtein };
  });

  const avgProteinPercent = Math.round(
    proteinData.reduce((sum, d) => sum + d.height, 0) / 7
  );

  // 2. Weight Data
  const weightData = last7Days.map(date => {
    const entry = weightHistory.find(h => h.date === date);
    let weight = entry ? entry.weight : userProfile.weight;
    
    // If no entry, look for the most recent previous one
    if (!entry) {
        const previousEntries = weightHistory.filter(h => h.date < date).sort((a, b) => b.date.localeCompare(a.date));
        if (previousEntries.length > 0) weight = previousEntries[0].weight;
    }

    // Scale for bar height (relative to a base)
    // Let's say base is 90% of current weight
    const base = userProfile.weight * 0.9;
    const height = Math.min(100, Math.max(20, ((weight - base) / (userProfile.weight * 0.2)) * 100));
    return { height, weight };
  });

  const weightChangeNum = weightData.length > 1 
    ? weightData[6].weight - weightData[0].weight
    : 0;
  const weightChange = weightChangeNum.toFixed(1);

  // --- END DATA CALCULATION ---

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#707070',
    border: isDark ? '#333333' : '#E0E0E0',
    accent: '#00C853'
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const todayWorkoutData = WORKOUT_PLANS.find(p => p.dayOfWeek === todayName) || WORKOUT_PLANS[0];
  const todayStr = new Date().toISOString().split('T')[0];
  
  const workoutCalories = workouts
    .filter(w => w.date === todayStr)
    .reduce((sum, w) => sum + (w.calories || 0), 0);

  const totalCalories = caloriesBurned + workoutCalories;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Activity Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#00C853' }]}>
            <Ionicons name="footsteps" size={24} color="#FFF" />
            <Text style={styles.summaryValue}>{steps}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FF6D00' }]}>
            <Ionicons name="flame" size={24} color="#FFF" />
            <Text style={styles.summaryValue}>{totalCalories}</Text>
            <Text style={styles.summaryLabel}>Total Kcal</Text>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.detailRow}>
             <Text style={[styles.detailLabel, { color: theme.subText }]}>Steps Burned</Text>
             <Text style={[styles.detailValue, { color: theme.text }]}>{caloriesBurned} kcal</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.detailRow}>
             <Text style={[styles.detailLabel, { color: theme.subText }]}>Workout Burned</Text>
             <Text style={[styles.detailValue, { color: theme.text }]}>{workoutCalories} kcal</Text>
          </View>
        </View>

        {/* WEEKLY ANALYSIS SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Analysis</Text>
        
        <View style={[styles.analysisCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Protein Intake</Text>
            <Text style={styles.chartPercent}>{avgProteinPercent}% avg</Text>
          </View>
          <View style={styles.barRow}>
            {proteinData.map((d, i) => (
              <View key={i} style={styles.barContainer}>
                <View style={[styles.bar, { height: d.height, backgroundColor: '#448AFF' }]} />
                <Text style={styles.dayLabel}>{orderedDayNames[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.analysisCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Weight Progress</Text>
            <Text style={[styles.chartPercent, { color: weightChangeNum <= 0 ? '#00C853' : '#FF5252' }]}>
                {weightChangeNum > 0 ? `+${weightChange}` : weightChange} kg
            </Text>
          </View>
          <View style={styles.barRow}>
            {weightData.map((d, i) => (
              <View key={i} style={styles.barContainer}>
                <View style={[styles.bar, { height: d.height, backgroundColor: '#00C853' }]} />
                <Text style={styles.dayLabel}>{orderedDayNames[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TODAY'S WORKOUT CARD */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 30 }]}>Today's Workout</Text>
        <TouchableOpacity 
          style={[styles.workoutCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push({ pathname: '/workout-detail', params: { day: todayName } })}
        >
          <View style={styles.workoutEmoji}>
            <Text style={{ fontSize: 24 }}>{todayWorkoutData.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.workoutName, { color: theme.text }]}>{todayWorkoutData.name}</Text>
            <Text style={[styles.workoutDay, { color: theme.subText }]}>{todayName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: workouts.find(w => w.date === todayStr && w.day === todayName) ? '#E8F5E9' : '#FFF3E0' }]}>
            <Text style={[styles.statusText, { color: workouts.find(w => w.date === todayStr && w.day === todayName) ? '#00C853' : '#FF9800' }]}>
                {workouts.find(w => w.date === todayStr && w.day === todayName) ? 'Done' : 'Pending'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* WORKOUT HISTORY */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Workout History</Text>
        {workouts.length > 0 ? (
          workouts.map((item, index) => (
            <View key={index} style={[styles.historyItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.historyIcon}>
                <MaterialCommunityIcons name="arm-flex" size={24} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.historyDate, { color: theme.subText }]}>
                  {item.date} • {formatDuration(item.durationSeconds)}
                </Text>
              </View>
              <Text style={styles.historyCals}>+{item.calories} kcal</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>No workouts recorded yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold' },
  scroll: { padding: 25, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryCard: { width: '48%', borderRadius: 24, padding: 20, alignItems: 'center', elevation: 4 },
  summaryValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  detailCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 30 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  workoutCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, borderWidth: 1, marginBottom: 30 },
  workoutEmoji: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  workoutName: { fontSize: 16, fontWeight: 'bold' },
  workoutDay: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  historyIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  historyName: { fontSize: 15, fontWeight: 'bold' },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyCals: { fontSize: 14, fontWeight: 'bold', color: '#00C853' },
  emptyState: { alignItems: 'center', marginTop: 20 },
  emptyText: { marginTop: 10, fontSize: 14 },
  
  // Analysis Styles
  analysisCard: { borderRadius: 25, padding: 20, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: 'bold' },
  chartPercent: { color: '#00C853', fontWeight: 'bold' },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  barContainer: { width: '12%', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 6 },
  dayLabel: { fontSize: 10, color: '#AAA', marginTop: 10 }
});