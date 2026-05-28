import React, { useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SmartAnalysis() {
  const params = useLocalSearchParams();

  const results = useMemo(() => {
    const w = parseFloat(params.weight as string);
    const h = parseFloat(params.height as string);
    const a = parseFloat(params.userAge as string);
    const multiplier = parseFloat(params.activityMultiplier as string) || 1.2;
    const gender = params.userGender;

    // 1. BMI Calculation
    const heightInMeters = h / 100;
    const bmiValue = w / (heightInMeters * heightInMeters);
    const finalBmi = parseFloat(bmiValue.toFixed(1));

    // 2. APPLYING BMI CONDITIONS
    let status = '';
    let goal = '';

    if (finalBmi < 18.5) {
      status = 'Underweight';
      goal = 'Gain Weight';
    } else if (finalBmi >= 18.5 && finalBmi <= 24.9) {
      status = 'Normal';
      goal = 'Maintain';
    } else if (finalBmi >= 25 && finalBmi <= 29.9) {
      status = 'Overweight';
      goal = 'Lose Weight';
    } else {
      status = 'Obese';
      goal = 'Lose Weight';
    }

    // 3. Mifflin-St Jeor (Calories)
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = gender === 'Male' ? bmr + 5 : bmr - 161;
    const maintenance = bmr * multiplier;

    let targetCals = maintenance;
    if (goal === 'Gain Weight') targetCals += 400;
    if (goal === 'Lose Weight') targetCals -= 400;

    // 4. Protein (Gym vs Health mode)
    const proteinFactor = params.selectedMode === 'Gym' ? 1.8 : 1.3;
    const targetProtein = w * proteinFactor;

    return {
      bmi: finalBmi,
      status: status,
      calories: Math.round(targetCals),
      protein: Math.round(targetProtein),
      goal: goal
    };
  }, [params]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="arrow-back" size={28} color="#0A1629" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={[styles.progressDash, styles.dashActive]} />
          <View style={[styles.progressDash, styles.dashActive]} />
          <View style={[styles.progressDash, styles.dashActive]} />
          <View style={[styles.progressDash, styles.dashActive]} />
        </View>

        <Text style={styles.title}>Smart Analysis</Text>
        <Text style={styles.subtitle}>AI is analyzing your profile</Text>

        {/* BMI Results Header */}
        <View style={styles.bmiHero}>
          <Text style={styles.bmiBigVal}>{results.bmi}</Text>
          <Text style={styles.bmiSubLabel}>Body Mass Index</Text>
        </View>

        {/* Detail Cards */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Body Status</Text>
          <Text style={styles.cardMainVal}>{results.status}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Suggested Goal</Text>
          <Text style={[styles.cardMainVal, { color: '#00C853' }]}>{results.goal}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.card, { flex: 1, marginRight: 12 }]}>
            <Text style={styles.cardLabel}>Daily Calories</Text>
            <Text style={styles.cardMainVal}>{results.calories} kcal</Text>
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardLabel}>Daily Protein</Text>
            <Text style={styles.cardMainVal}>{results.protein}g</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.continueBtn} 
          onPress={() => router.push({
            pathname: '/profile-recommendation',
            params: { 
              ...params, 
              bmi: results.bmi,     
              bmiStatus: results.status, 
              goal: results.goal,
              calories: results.calories,
              protein: results.protein,
              selectedMode: params.selectedMode 
            }
          })}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 20 },
  backBtn: { marginTop: 10, marginBottom: 10, width: 50, height: 50, justifyContent: 'center', marginLeft: -10 },
  progressContainer: { flexDirection: 'row', marginBottom: 35 },
  progressDash: { height: 4, width: 40, backgroundColor: '#E9ECEF', borderRadius: 2, marginRight: 8 },
  dashActive: { backgroundColor: '#00C853' },
  title: { fontSize: 32, fontWeight: '700', color: '#0A1629' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 8, marginBottom: 30 },
  bmiHero: { backgroundColor: '#F1FBF2', borderRadius: 24, padding: 35, alignItems: 'center', marginBottom: 20 },
  bmiBigVal: { fontSize: 56, fontWeight: '700', color: '#00C853' },
  bmiSubLabel: { fontSize: 14, color: '#00C853', fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 16 },
  cardLabel: { fontSize: 13, color: '#7D8592', marginBottom: 6 },
  cardMainVal: { fontSize: 18, fontWeight: '700', color: '#0A1629' },
  statsRow: { flexDirection: 'row' },
  continueBtn: { 
    backgroundColor: '#00C853', 
    height: 60, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});