import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout';
import useAppStore from '../src/store/useAppStore';
import { calculateMealTotals } from '../src/utils/calculations';

export default function PlateBalanceScreen() {
  const { meals, userProfile } = useAppStore();
  const { isDark } = useTheme();
  
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter((m: any) => m.date === today && m.mode === 'health');
  const { totalCalories, totalProtein, totalCarbs, totalFats } = calculateMealTotals(todayMeals);

  const proteinTarget = userProfile.proteinTarget || 100;
  const carbsTarget = userProfile.carbsTarget || 250;
  const fatsTarget = userProfile.fatsTarget || 70;

  const proteinPct = Math.min(100, Math.round((totalProtein / (proteinTarget || 1)) * 100));
  const carbsPct = Math.min(100, Math.round((totalCarbs / (carbsTarget || 1)) * 100));
  const fatsPct = Math.min(100, Math.round((totalFats / (fatsTarget || 1)) * 100));

  // Score calculation
  const plateScore = totalCalories === 0 ? 0 : Math.min(10, parseFloat(((proteinPct + carbsPct + fatsPct) / 30).toFixed(1)));

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
        <Text style={[styles.title, { color: theme.text }]}>Plate Balance</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Your real-time meal score and suggestions</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Today's Meal Score</Text>
          <Text style={styles.scoreLarge}>{totalCalories > 0 ? `${plateScore}/10` : '--/10'}</Text>
          <Text style={styles.scoreFeedback}>{totalCalories > 0 ? (plateScore >= 8 ? 'Excellent balance!' : plateScore >= 5 ? 'Good start!' : 'Keep tracking!') : 'No meals logged today'}</Text>
        </View>

        <View style={[styles.compCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.compTitle, { color: theme.text }]}>Macro Distribution</Text>
          {[
            { label: 'Proteins', percent: proteinPct, color: '#2196F3' },
            { label: 'Carbs', percent: carbsPct, color: '#FF9800' },
            { label: 'Fats', percent: fatsPct, color: '#FF5252' },
          ].map((item, i) => (
            <View key={i} style={styles.compRow}>
              <View style={styles.rowLabel}>
                <Text style={[styles.labelTxt, { color: theme.subText }]}>{item.label}</Text>
                <Text style={[styles.percentTxt, { color: item.color }]}>{item.percent}% of target</Text>
              </View>
              <View style={[styles.track, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}><View style={[styles.bar, { width: `${item.percent}%`, backgroundColor: item.color }]} /></View>
            </View>
          ))}
        </View>

        <View style={[styles.suggestCard, { backgroundColor: isDark ? '#1A2E22' : '#F1FDF5', borderColor: '#00C853' }]}>
          <Text style={[styles.suggestTitle, { color: theme.text }]}>Insights</Text>
          {totalCalories === 0 ? (
            <View style={styles.suggestRow}>
              <Ionicons name="information-circle" size={20} color={theme.subText} />
              <Text style={[styles.suggestTxt, { color: theme.text }]}>Log your first meal to see insights.</Text>
            </View>
          ) : (
            <>
              <View style={styles.suggestRow}>
                <Ionicons name={proteinPct >= 80 ? "checkmark-circle" : "alert-circle"} size={20} color={proteinPct >= 80 ? "#00C853" : "#FF9800"} />
                <Text style={[styles.suggestTxt, { color: theme.text }]}>{proteinPct >= 80 ? "Great protein intake!" : "Aim for more protein in your next meal."}</Text>
              </View>
              <View style={styles.suggestRow}>
                <Ionicons name={carbsPct <= 100 ? "checkmark-circle" : "warning"} size={20} color={carbsPct <= 100 ? "#00C853" : "#FF5252"} />
                <Text style={[styles.suggestTxt, { color: theme.text }]}>{carbsPct <= 100 ? "Carb intake is within limits." : "Watch your carb intake for the rest of the day."}</Text>
              </View>
              <View style={styles.suggestRow}>
                <Ionicons name="bulb" size={20} color="#FFD600" />
                <Text style={[styles.suggestTxt, { color: theme.text }]}>Balanced meals help maintain steady energy levels.</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#7D8592', marginBottom: 25 },
  scoreCard: { backgroundColor: '#00C853', borderRadius: 25, padding: 30, alignItems: 'center', marginBottom: 20 },
  scoreTitle: { color: 'white', opacity: 0.9 },
  scoreLarge: { color: 'white', fontSize: 64, fontWeight: 'bold' },
  scoreFeedback: { color: 'white', fontWeight: '600' },
  compCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20 },
  compTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  compRow: { marginBottom: 15 },
  rowLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelTxt: { color: '#7D8592', fontWeight: '500' },
  percentTxt: { fontWeight: 'bold' },
  track: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
  bar: { height: '100%', borderRadius: 3 },
  suggestCard: { backgroundColor: '#F1FDF5', borderRadius: 20, padding: 20, borderLeftWidth: 5, borderLeftColor: '#00C853' },
  suggestTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  suggestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  suggestTxt: { marginLeft: 10, color: '#011627' }
});