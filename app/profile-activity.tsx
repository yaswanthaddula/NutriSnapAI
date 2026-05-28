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

export default function DailyActivity() {
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Arrow & Progress */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={[styles.progressDash, styles.dashActive]} />
          <View style={[styles.progressDash, styles.dashActive]} />
          <View style={[styles.progressDash, styles.dashActive]} />
          <View style={styles.progressDash} />
        </View>

        <Text style={styles.title}>Daily Activity</Text>
        <Text style={styles.subtitle}>How active are you?</Text>

        <View style={styles.list}>
          {activityOptions.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.7}
              style={[
                styles.card, 
                selectedLevel === item.id && styles.cardActive
              ]}
              onPress={() => setSelectedLevel(item.id)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.emojiIcon}>{item.icon}</Text>
                <View style={styles.textGroup}>
                  <Text style={[styles.label, selectedLevel === item.id && styles.labelActive]}>
                    {item.title}
                  </Text>
                  <Text style={styles.subText}>{item.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Continue Button */}
        <TouchableOpacity 
          style={[
            styles.continueBtn, 
            { backgroundColor: isFormValid ? '#00C853' : '#81E19E' }
          ]} 
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  backBtn: { marginTop: 10, marginBottom: 10, width: 50, height: 50, justifyContent: 'center', marginLeft: -15 },
  progressContainer: { flexDirection: 'row', marginTop: 15, marginBottom: 32 },
  progressDash: { height: 4, width: 40, backgroundColor: '#E9ECEF', borderRadius: 2, marginRight: 8 },
  dashActive: { backgroundColor: '#2DCE89' },
  title: { fontSize: 32, fontWeight: '700', color: '#0A1629', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#7D8592', marginBottom: 32 },
  list: { flex: 1 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#D8E0F0', 
    borderRadius: 16, 
    marginBottom: 16, 
    backgroundColor: '#FFF' 
  },
  cardActive: { borderColor: '#00C853', backgroundColor: '#F1FBF2' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  emojiIcon: { fontSize: 24, marginRight: 16 },
  textGroup: { flex: 1 },
  label: { fontSize: 18, fontWeight: '700', color: '#0A1629' },
  labelActive: { color: '#00C853' },
  subText: { fontSize: 14, color: '#7D8592', marginTop: 4 },
  continueBtn: { 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});