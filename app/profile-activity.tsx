import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './_layout';

export default function DailyActivity() {
  const { isDark } = useTheme();
  const themeColors = {
    gradient: isDark ? ['#121212', '#1B281E', '#0A120D'] as const : ['#E8F5E9', '#C8E6C9', '#A5D6A7'] as const,
    glass: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    text: isDark ? '#E8F5E9' : '#1B5E20',
    subText: isDark ? '#A5D6A7' : '#388E3C',
    inputBg: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
    inputBorder: isDark ? '#333' : '#C8E6C9',
    cardActiveBorder: isDark ? '#4CAF50' : '#4CAF50',
    cardActiveBg: isDark ? 'rgba(76, 175, 80, 0.1)' : '#E8F5E9',
    btnDisabled: isDark ? '#333' : '#A5D6A7',
    backBtnBg: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
    iconColor: isDark ? '#FFF' : '#000',
  };

  const params = useLocalSearchParams();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const activityOptions = [
    { id: 'sedentary', title: 'Sedentary', desc: 'Little or no exercise', multiplier: 1.2, icon: '🛋️' },
    { id: 'light', title: 'Light Active', desc: '1-3 days/week', multiplier: 1.375, icon: '🚶' },
    { id: 'moderate', title: 'Moderate Active', desc: '3-5 days/week', multiplier: 1.55, icon: '🏃' },
    { id: 'highly', title: 'Highly Active', desc: '6-7 days/week', multiplier: 1.725, icon: '💪' },
  ];

  // Logic for the Dark Green button
  const isFormValid = selectedLevel !== null;

  const handleContinue = () => {
    if (!selectedLevel) return;

    const levelData = activityOptions.find(opt => opt.id === selectedLevel);
    
    // Pass everything to the Smart Analysis page
    router.push({
      pathname: '/profile-analysis',
      params: { 
        ...params, 
        activityMultiplier: 1.5,
      }
    });
  };

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
              <View style={[styles.progressDash, { backgroundColor: themeColors.inputBorder }]} />
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>Daily Activity</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>How active are you?</Text>

            <View style={styles.list}>
              {activityOptions.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  activeOpacity={0.7}
                  style={[
                    styles.card, 
                    { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder },
                    selectedLevel === item.id && { borderColor: themeColors.cardActiveBorder, backgroundColor: themeColors.cardActiveBg, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedLevel(item.id)}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.emojiIcon}>{item.icon}</Text>
                    <View style={styles.textGroup}>
                      <Text style={[styles.label, { color: themeColors.subText }, selectedLevel === item.id && styles.labelActive]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.subText, { color: themeColors.subText }, selectedLevel === item.id && styles.subTextActive]}>{item.desc}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.continueBtnWrapper}
              onPress={handleContinue}
              disabled={!isFormValid}
            >
              <View style={[styles.continueBtn, !isFormValid && { backgroundColor: themeColors.btnDisabled }]}>
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
  list: { flex: 1 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    borderRadius: 16, 
    marginBottom: 16, 
    backgroundColor: 'rgba(255,255,255,0.9)' 
  },
  cardActive: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9', borderWidth: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  emojiIcon: { fontSize: 24, marginRight: 16 },
  textGroup: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  labelActive: { color: '#1B5E20', fontWeight: '900' },
  subText: { fontSize: 14, color: '#666', marginTop: 4, fontWeight: '500' },
  subTextActive: { color: '#388E3C' },
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
  btnDisabled: { backgroundColor: '#A5D6A7', elevation: 0 },
  continueBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});