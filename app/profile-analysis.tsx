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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './_layout';

export default function SmartAnalysis() {
  const { isDark } = useTheme();
  const themeColors = {
    gradient: isDark ? ['#121212', '#1B281E', '#0A120D'] as const : ['#E8F5E9', '#C8E6C9', '#A5D6A7'] as const,
    glass: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDark ? '#E8F5E9' : '#1B5E20',
    subText: isDark ? '#A5D6A7' : '#388E3C',
    cardBg: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
    cardBorder: isDark ? '#333' : '#C8E6C9',
    heroBg: isDark ? 'rgba(76, 175, 80, 0.1)' : '#E8F5E9',
    backBtnBg: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    iconColor: isDark ? '#FFF' : '#000',
  };

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
      goal = 'Weight Gain';
    } else if (finalBmi >= 18.5 && finalBmi <= 24.9) {
      status = 'Normal';
      goal = 'Maintain Weight';
    } else if (finalBmi >= 25 && finalBmi <= 29.9) {
      status = 'Overweight';
      goal = 'Weight Loss';
    } else {
      status = 'Obese';
      goal = 'Weight Loss';
    }

    // 3. Mifflin-St Jeor (Calories)
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = gender === 'Male' ? bmr + 5 : bmr - 161;
    const maintenance = bmr * multiplier;

    let targetCals = maintenance;
    const goalLower = goal.toLowerCase();
    if (goalLower.includes('gain')) targetCals += 400;
    if (goalLower.includes('loss') || goalLower.includes('lose')) targetCals -= 400;

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
    <LinearGradient colors={themeColors.gradient} style={styles.gradientBg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: themeColors.backBtnBg }]} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="arrow-back" size={28} color={themeColors.iconColor} />
          </TouchableOpacity>

          <View style={[styles.glassContainer, { backgroundColor: themeColors.glass }]}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDash, styles.dashActive]} />
              <View style={[styles.progressDash, styles.dashActive]} />
              <View style={[styles.progressDash, styles.dashActive]} />
              <View style={[styles.progressDash, styles.dashActive]} />
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>Smart Analysis</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>AI is analyzing your profile</Text>

            <View style={[styles.bmiHero, { backgroundColor: themeColors.heroBg, borderColor: themeColors.cardBorder }]}>
              <Text style={styles.bmiBigVal}>{results.bmi}</Text>
              <Text style={[styles.bmiSubLabel, { color: themeColors.subText }]}>Body Mass Index</Text>
            </View>

            <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: themeColors.subText }]}>Body Status</Text>
              <Text style={[styles.cardMainVal, { color: themeColors.text }]}>{results.status}</Text>
            </View>

            <View style={[styles.card, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.cardLabel, { color: themeColors.subText }]}>Suggested Goal</Text>
              <Text style={[styles.cardMainVal, { color: '#00C853' }]}>{results.goal}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.card, { flex: 1, marginRight: 12, backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
                <Text style={[styles.cardLabel, { color: themeColors.subText }]}>Daily Calories</Text>
                <Text style={[styles.cardMainVal, { color: themeColors.text }]}>{results.calories} kcal</Text>
              </View>
              <View style={[styles.card, { flex: 1, backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
                <Text style={[styles.cardLabel, { color: themeColors.subText }]}>Daily Protein</Text>
                <Text style={[styles.cardMainVal, { color: themeColors.text }]}>{results.protein}g</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.continueBtnWrapper} 
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
              <View style={styles.continueBtn}>
                <Text style={styles.continueBtnText}>Continue</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  gradientBg: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 30, justifyContent: 'center' },
  glassContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    paddingHorizontal: 25,
    paddingVertical: 30,
  },
  backBtn: { marginTop: 10, marginBottom: 10, marginLeft: 20, width: 40, height: 40, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, alignItems: 'center', zIndex: 10 },
  progressContainer: { flexDirection: 'row', marginBottom: 25 },
  progressDash: { height: 6, flex: 1, backgroundColor: '#C8E6C9', borderRadius: 3, marginRight: 8 },
  dashActive: { backgroundColor: '#4CAF50', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 32, fontWeight: '900', color: '#1B5E20' },
  subtitle: { fontSize: 16, color: '#388E3C', marginTop: 10, marginBottom: 30, fontWeight: '600' },
  bmiHero: { backgroundColor: '#E8F5E9', borderRadius: 24, padding: 35, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#C8E6C9' },
  bmiBigVal: { fontSize: 56, fontWeight: '700', color: '#00C853' },
  bmiSubLabel: { fontSize: 14, color: '#2E7D32', fontWeight: '700' },
  card: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#C8E6C9', marginBottom: 16 },
  cardLabel: { fontSize: 13, color: '#388E3C', marginBottom: 6, fontWeight: '600' },
  cardMainVal: { fontSize: 18, fontWeight: '800', color: '#1B5E20' },
  statsRow: { flexDirection: 'row' },
  continueBtnWrapper: {
    marginTop: 10,
  },
  continueBtn: { 
    backgroundColor: '#4CAF50', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  continueBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});