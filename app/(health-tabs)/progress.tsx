import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../_layout';
import useAppStore from '../../src/store/useAppStore';

const { width } = Dimensions.get('window');

// Reusable Chart Component
const WeeklyBarChart = ({ title, data, labels, color, subValue, theme }: any) => (
  <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <View style={styles.chartHeader}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.chartSubValue, { color }]}>{subValue}</Text>
    </View>
    <View style={styles.barContainer}>
      {data.map((val: number, i: number) => (
        <View key={i} style={styles.barWrapper}>
          <View style={[styles.bar, { height: Math.max(5, val), backgroundColor: color }]} />
          <Text style={styles.dayLabel}>{labels ? labels[i] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
        </View>
      ))}
    </View>
  </View>
);

export default function HealthProgress() {
  const { isDark } = useTheme();
  const { steps, caloriesBurned, meals, activityHistory, loadStoredData } = useAppStore();

  React.useEffect(() => {
    loadStoredData();
  }, []);

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    border: isDark ? '#333333' : '#E0E0E0'
  };

  // --- REAL DATA CALCULATIONS ---
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const stepsData = last7Days.map(date => {
    const day = activityHistory.find(h => h.date === date);
    return day ? Math.min(100, (day.steps / 10000) * 100) : 0;
  });

  const burnedData = last7Days.map(date => {
    const day = activityHistory.find(h => h.date === date);
    return day ? Math.min(100, (day.caloriesBurned / 500) * 100) : 0;
  });

  const consumedData = last7Days.map(date => {
    const dayMeals = meals.filter(m => m.date === date && m.mode === 'health');
    const total = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
    return Math.min(100, (total / 2000) * 100);
  });

  const dayLabels = last7Days.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'narrow' });
  });

  // Smart Insights Logic
  const getStepInsight = () => {
    if (steps < 5000) return "Try walking 20–30 minutes today.";
    if (steps < 10000) return "You're close to your goal! Keep going.";
    return "Daily goal crushed! Excellent work.";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Weekly Analytics</Text>
        <Text style={[styles.headerSub, { color: theme.subText }]}>Your real-time health progress</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* STEPS BANNER */}
        <View style={styles.caloriesBanner}>
          <Text style={styles.bannerLabel}>Total Steps Today</Text>
          <Text style={styles.bannerValue}>{steps.toLocaleString()}</Text>
          <Text style={styles.bannerSub}>{getStepInsight()}</Text>
          <View style={[styles.bannerProgress, { width: `${Math.min(100, (steps / 10000) * 100)}%` }]} />
        </View>

        {/* CHARTS SECTION */}
        <WeeklyBarChart 
          title="Daily Steps" 
          data={stepsData} 
          labels={dayLabels}
          color="#00C853" 
          subValue={`${Math.round((steps / 10000) * 100)}% of today's goal`} 
          theme={theme}
        />

        <WeeklyBarChart 
          title="Calories Consumed" 
          data={consumedData} 
          labels={dayLabels}
          color="#2196F3" 
          subValue="Nutritional intake this week" 
          theme={theme}
        />

        <WeeklyBarChart 
          title="Activity Calories" 
          data={burnedData} 
          labels={dayLabels}
          color="#FF9800" 
          subValue={`${caloriesBurned} kcal burned today`} 
          theme={theme}
        />

        {/* HEALTH GOALS GRID */}
        <View style={[styles.goalsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Step Goal Progress</Text>
          <View style={styles.goalRow}>
            <Text style={[styles.goalLabel, { color: theme.subText }]}>0 to 10k steps</Text>
            <View style={styles.dotRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                <View key={d} style={[styles.dot, d <= (steps / 1000) ? { backgroundColor: '#00C853' } : { backgroundColor: theme.border }]} />
              ))}
            </View>
          </View>
          <View style={styles.completionBox}>
            <Text style={styles.completionText}>{steps >= 10000 ? "Goal reached!" : `${(10000 - steps).toLocaleString()} steps to go`}</Text>
          </View>
        </View>

        {/* BOTTOM STATS GRID */}
        <View style={styles.row}>
           <View style={[styles.miniCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF3E0' }]}>
              <Ionicons name="flame" size={20} color="#FF9800" />
              <Text style={[styles.miniValue, { color: theme.text }]}>{caloriesBurned}</Text>
              <Text style={[styles.miniLabel, { color: theme.subText }]}>kcal burned</Text>
           </View>
           <View style={[styles.miniCard, { backgroundColor: isDark ? '#1E1E1E' : '#E8F5E9' }]}>
              <Ionicons name="footsteps" size={20} color="#00C853" />
              <Text style={[styles.miniValue, { color: theme.text }]}>{steps.toLocaleString()}</Text>
              <Text style={[styles.miniLabel, { color: theme.subText }]}>steps today</Text>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 25, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSub: { fontSize: 14, color: '#7D8592', marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 100 },

  caloriesBanner: { backgroundColor: '#00C853', borderRadius: 20, padding: 20, marginBottom: 20 },
  bannerLabel: { color: 'white', fontSize: 14 },
  bannerValue: { color: 'white', fontSize: 36, fontWeight: 'bold', marginVertical: 5 },
  bannerSub: { color: 'white', fontSize: 14, opacity: 0.8 },
  bannerProgress: { height: 4, backgroundColor: 'white', borderRadius: 2, marginTop: 15, width: '90%' },

  chartCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: 'bold' },
  chartSubValue: { fontSize: 14, fontWeight: '600' },
  barContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barWrapper: { alignItems: 'center' },
  bar: { width: 30, borderRadius: 6 },
  dayLabel: { fontSize: 10, color: '#AAA', marginTop: 8 },

  goalsCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  goalLabel: { fontSize: 12, color: '#555', flex: 1 },
  dotRow: { flexDirection: 'row' },
  dot: { width: 20, height: 12, borderRadius: 3, marginLeft: 4 },
  completionBox: { backgroundColor: '#F1FDF5', padding: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  completionText: { color: '#00C853', fontWeight: 'bold', fontSize: 13 },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  miniCard: { width: '48%', padding: 15, borderRadius: 15 },
  miniValue: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  miniLabel: { fontSize: 12, color: '#7D8592' },
});