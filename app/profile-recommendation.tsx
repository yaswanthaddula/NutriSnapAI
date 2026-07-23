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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './_layout';

export default function AIRecommendation() {
  const { isDark } = useTheme();
  const themeColors = {
    gradient: isDark ? ['#121212', '#1B281E', '#0A120D'] as const : ['#E8F5E9', '#C8E6C9', '#A5D6A7'] as const,
    glass: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDark ? '#E8F5E9' : '#1B5E20',
    subText: isDark ? '#A5D6A7' : '#388E3C',
    cardBg: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
    cardBorder: isDark ? '#333' : '#C8E6C9',
    outerCircle: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(232, 245, 233, 0.8)',
    innerCircle: isDark ? '#333' : '#FFF',
    backBtnBg: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    iconColor: isDark ? '#FFF' : '#000',
  };

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
      <LinearGradient colors={themeColors.gradient} style={styles.gradientBg}>
        <SafeAreaView style={styles.loadingSafe}>
          <View style={[styles.glassContainer, { backgroundColor: themeColors.glass }]}>
            <View style={styles.progressContainer}>
               <View style={[styles.progressDash, styles.dashActive]} />
               <View style={[styles.progressDash, styles.dashActive]} />
               <View style={[styles.progressDash, styles.dashActive]} />
               <View style={[styles.progressDash, styles.dashActive]} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Smart Analysis</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>AI is analyzing your profile</Text>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loaderText}>Predicting the best mode for your BMI...</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={themeColors.gradient} style={styles.gradientBg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: themeColors.backBtnBg }]} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="arrow-back" size={28} color={themeColors.iconColor} />
          </TouchableOpacity>

          <View style={[styles.glassContainer, { backgroundColor: themeColors.glass }]}>
            <Text style={[styles.title, { color: themeColors.text }]}>AI Recommendation</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>We've analyzed your profile</Text>

            <View style={styles.checkContainer}>
              <View style={[styles.outerCircle, { backgroundColor: themeColors.outerCircle }]}>
                <View style={[styles.innerCircle, { backgroundColor: themeColors.innerCircle }]}>
                  <Ionicons name="checkmark-sharp" size={45} color="#4CAF50" />
                </View>
              </View>
            </View>

            <LinearGradient colors={isDark ? ['#1B281E', '#0A120D'] : ['#4CAF50', '#2E7D32']} style={styles.recommendationCard}>
              <Text style={styles.recLabel}>AI Suggested Mode</Text>
              <Text style={styles.recValue}>{recommendedMode}</Text>
              <Text style={styles.recDesc}>
                With a BMI of {params.bmi}, {recommendedMode} is best to help you {params.goal?.toString().toLowerCase() || 'gain weight'}.
              </Text>
            </LinearGradient>

            <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.summaryTitle, { color: themeColors.subText }]}>Your Profile Summary:</Text>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.sumLabel, { color: themeColors.subText }]}>Age:</Text>
                <Text style={[styles.sumValue, { color: themeColors.text }]}>{params.userAge} years</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.sumLabel, { color: themeColors.subText }]}>BMI:</Text>
                <Text style={[styles.sumValue, { color: themeColors.text }]}>{params.bmi}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.sumLabel, { color: themeColors.subText }]}>Activity:</Text>
                <Text style={[styles.sumValue, { color: themeColors.text }]}>{params.activityLevel || "Moderate Active"}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.sumLabel, { color: themeColors.subText }]}>Goal:</Text>
                <Text style={[styles.sumValue, { color: '#4CAF50' }]}>{params.goal}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.finalBtnWrapper} 
              onPress={() => router.push({
                pathname: '/profile-mode',
                params: { 
                    ...params, 
                    selectedMode: modeKey, // Pass the AI suggestion to the next page
                    aiRecommended: modeKey 
                } 
              })}
            >
              <View style={styles.finalBtn}>
                <Text style={styles.finalBtnText}>Continue to Selection</Text>
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
  loadingSafe: { flex: 1, backgroundColor: 'transparent' },
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
    marginTop: 20,
  },
  backBtn: { alignSelf: 'flex-start', marginTop: 10, marginBottom: 10, width: 40, height: 40, justifyContent: 'center', marginLeft: 20, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, alignItems: 'center' },
  progressContainer: { flexDirection: 'row', marginTop: 20, marginBottom: 35 },
  progressDash: { height: 6, flex: 1, backgroundColor: '#C8E6C9', borderRadius: 3, marginRight: 8 },
  dashActive: { backgroundColor: '#4CAF50', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 32, fontWeight: '900', color: '#1B5E20', alignSelf: 'center' },
  subtitle: { fontSize: 16, color: '#388E3C', marginTop: 8, alignSelf: 'center', marginBottom: 10, fontWeight: '600' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 },
  loaderText: { marginTop: 20, color: '#2E7D32', fontSize: 14, fontWeight: '600' },
  checkContainer: { alignItems: 'center', marginVertical: 30 },
  outerCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(232, 245, 233, 0.8)', justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  recommendationCard: { borderRadius: 30, padding: 25, width: '100%', alignItems: 'center', marginBottom: 25 },
  recLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  recValue: { color: '#FFF', fontSize: 36, fontWeight: '900', marginBottom: 10 },
  recDesc: { color: '#FFF', fontSize: 14, textAlign: 'center', opacity: 0.9, lineHeight: 20 },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 20, width: '100%', borderWidth: 1, borderColor: '#C8E6C9' },
  summaryTitle: { fontSize: 14, color: '#388E3C', marginBottom: 15, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 15, color: '#388E3C', fontWeight: '500' },
  sumValue: { fontSize: 15, fontWeight: '800', color: '#1B5E20' },
  finalBtnWrapper: { width: '100%', marginTop: 30 },
  finalBtn: { backgroundColor: '#4CAF50', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  finalBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});