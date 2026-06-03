import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AIRecommendation() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // --- NEW AI PREDICTION LOGIC ---
  const age = parseInt(params.userAge as string) || 25;
  const gender = (params.userGender as string || 'Male').toLowerCase();
  const bmi = parseFloat(params.bmi as string) || 20.8;
  const goalStr = (params.goal as string || '').toLowerCase();
  const activityStr = (params.activityLevel as string || '').toLowerCase();

  // Gym Goal triggers
  const isGymGoal = 
    goalStr.includes('weight gain') || 
    goalStr.includes('muscle gain') || 
    goalStr.includes('fitness improvement') ||
    goalStr.includes('strength') || 
    goalStr.includes('build') ||
    goalStr.includes('workout') ||
    goalStr.includes('transform') ||
    (goalStr.includes('gain') && !goalStr.includes('loss') && !goalStr.includes('lose'));

  // Health Goal triggers
  const isHealthGoal = 
    goalStr.includes('weight loss') || 
    goalStr.includes('maintain weight') || 
    goalStr.includes('general health') ||
    goalStr.includes('lose') || 
    goalStr.includes('loss') || 
    goalStr.includes('maintain') || 
    goalStr.includes('wellness') || 
    goalStr.includes('hydration') || 
    goalStr.includes('sleep') || 
    goalStr.includes('health');

  let modeKey = 'Health';

  // Priority 1: Goal (Highest Priority)
  if (isGymGoal && !isHealthGoal) {
    modeKey = 'Gym';
  } else if (isHealthGoal && !isGymGoal) {
    modeKey = 'Health';
  } else {
    // Priority 2: Activity Level
    const isActivityHigh = 
      activityStr === 'active' || 
      activityStr === 'very active' || 
      activityStr.includes('moderate') || 
      activityStr.includes('high') || 
      activityStr.includes('heavy') ||
      (activityStr.includes('active') && !activityStr.includes('light'));

    const isActivityLow = 
      activityStr.includes('sedentary') || 
      activityStr.includes('light') || 
      activityStr.includes('low');

    if (isActivityHigh) {
      modeKey = 'Gym';
    } else if (isActivityLow) {
      modeKey = 'Health';
    } else {
      // Priority 3: BMI
      if (bmi < 18.5) {
        modeKey = 'Gym';
      } else if (bmi >= 25.0) {
        modeKey = 'Health';
      } else {
        // Priority 4: Age
        if (age > 50) {
          modeKey = 'Health';
        } else {
          // Priority 5: Gender / Fallback
          if (isGymGoal && isHealthGoal && gender === 'male') {
            modeKey = 'Gym';
          } else {
            modeKey = 'Health';
          }
        }
      }
    }
  }

  const recommendedMode = modeKey + ' Mode';

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingSafe}>
        <View style={styles.progressContainer}>
           <View style={[styles.progressDash, styles.dashActive]} />
           <View style={[styles.progressDash, styles.dashActive]} />
           <View style={[styles.progressDash, styles.dashActive]} />
           <View style={[styles.progressDash, styles.dashActive]} />
        </View>
        <Text style={styles.title}>Smart Analysis</Text>
        <Text style={styles.subtitle}>AI is analyzing your profile</Text>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={styles.loaderText}>Predicting the best mode for your BMI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="arrow-back" size={28} color="#0A1629" />
        </TouchableOpacity>

        <Text style={styles.title}>AI Recommendation</Text>
        <Text style={styles.subtitle}>We've analyzed your profile</Text>

        <View style={styles.checkContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Ionicons name="checkmark-sharp" size={45} color="#00C853" />
            </View>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.recLabel}>AI Suggested Mode</Text>
          <Text style={styles.recValue}>{recommendedMode}</Text>
          <Text style={styles.recDesc}>
            With a BMI of {params.bmi}, {recommendedMode} is best to help you {params.goal?.toString().toLowerCase() || 'gain weight'}.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Profile Summary:</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Age:</Text>
            <Text style={styles.sumValue}>{params.userAge} years</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>BMI:</Text>
            <Text style={styles.sumValue}>{params.bmi}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Activity:</Text>
            <Text style={styles.sumValue}>{params.activityLevel || "Moderate Active"}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Goal:</Text>
            <Text style={[styles.sumValue, { color: '#00C853' }]}>{params.goal}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.finalBtn} 
          onPress={() => router.push({
            pathname: '/profile-mode',
            params: { 
                ...params, 
                selectedMode: modeKey, // Pass the AI suggestion to the next page
                aiRecommended: modeKey 
            } 
          })}
        >
          <Text style={styles.finalBtnText}>Continue to Selection</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  loadingSafe: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 25 },
  scroll: { paddingHorizontal: 25, paddingBottom: 30, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginTop: 10, marginBottom: 10, width: 50, height: 50, justifyContent: 'center', marginLeft: -10 },
  progressContainer: { flexDirection: 'row', marginTop: 20, marginBottom: 35 },
  progressDash: { height: 5, width: 60, backgroundColor: '#E0E0E0', borderRadius: 5, marginRight: 8 },
  dashActive: { backgroundColor: '#00C853' },
  title: { fontSize: 32, fontWeight: '700', color: '#0A1629', alignSelf: 'flex-start' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 8, alignSelf: 'flex-start', marginBottom: 10 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 20, color: '#7D8592', fontSize: 14 },
  checkContainer: { alignItems: 'center', marginVertical: 30 },
  outerCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  recommendationCard: { backgroundColor: '#00C853', borderRadius: 30, padding: 25, width: '100%', alignItems: 'center', marginBottom: 25 },
  recLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  recValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 10 },
  recDesc: { color: '#FFF', fontSize: 13, textAlign: 'center', opacity: 0.9, lineHeight: 18 },
  summaryCard: { backgroundColor: '#FAFAFA', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: '#F0F0F0' },
  summaryTitle: { fontSize: 14, color: '#7D8592', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 15, color: '#7D8592' },
  sumValue: { fontSize: 15, fontWeight: '700', color: '#0A1629' },
  finalBtn: { backgroundColor: '#00C853', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 30 },
  finalBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});