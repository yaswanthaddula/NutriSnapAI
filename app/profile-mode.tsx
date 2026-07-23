import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';

export default function ProfileMode() {
  const params = useLocalSearchParams();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const { userProfile, setUserProfile, saveStoredData } = useAppStore();

const handleGetStarted = async () => {
  if (!selectedMode) return;

  // Save everything from the profile setup baton
  const profileData = {
    ...userProfile,
    name: (params.userName as string) || (params.name as string) || userProfile.name,
    age: parseInt(params.userAge as string) || userProfile.age,
    height: parseFloat(params.height as string) || userProfile.height,
    weight: parseFloat(params.weight as string) || userProfile.weight,
    gender: (params.userGender as string) || userProfile.gender,
    activityLevel: (params.activityLevel as string) || userProfile.activityLevel,
    goal: (params.goal as string) || userProfile.goal,
    selected_mode: selectedMode,
    suggested_mode: (params.aiRecommended as string) || selectedMode,
  };

  // 1. Save to Backend First
  try {
    await apiService.saveProfile(profileData);
  } catch (error) {
    console.warn("Backend profile sync failed, data saved locally only.");
  }

  // 2. Update Local Store
  setUserProfile(profileData);
  await saveStoredData();

  if (selectedMode === 'Gym') {
    router.push({
      pathname: '/(tabs)/gym-home', 
      params: { selectedMode: 'Gym' }
    });
  } else {
    router.push({
      pathname: '/health-welcome',
      params: { selectedMode: 'Health' }
    });
  }
};

  return (
    <LinearGradient colors={['#E8F5E9', '#4CAF50']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>

          <View style={styles.glassContainer}>
            <Text style={styles.title}>Choose Your Mode</Text>
            <Text style={styles.subtitle}>You can change this anytime</Text>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.card, selectedMode === 'Health' && styles.cardActive]}
              onPress={() => setSelectedMode('Health')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="heart-outline" size={24} color="#4CAF50" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modeTitle, selectedMode === 'Health' && styles.modeTitleActive]}>Health Mode</Text>
                  <Text style={[styles.modeDesc, selectedMode === 'Health' && styles.modeDescActive]}>Focus on wellness, nutrition, and sustainable fitness</Text>
                </View>
              </View>
              <View style={styles.tagRow}>
                <View style={[styles.tag, selectedMode === 'Health' && styles.tagActive]}><Text style={[styles.tagText, selectedMode === 'Health' && styles.tagTextActive]}>Calorie tracking</Text></View>
                <View style={[styles.tag, selectedMode === 'Health' && styles.tagActive]}><Text style={[styles.tagText, selectedMode === 'Health' && styles.tagTextActive]}>Wellness tips</Text></View>
                <View style={[styles.tag, selectedMode === 'Health' && styles.tagActive]}><Text style={[styles.tagText, selectedMode === 'Health' && styles.tagTextActive]}>Meal balance</Text></View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.card, selectedMode === 'Gym' && styles.cardActive]}
              onPress={() => setSelectedMode('Gym')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="flash-outline" size={24} color="#2196F3" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modeTitle, selectedMode === 'Gym' && styles.modeTitleActive]}>Gym Mode</Text>
                  <Text style={[styles.modeDesc, selectedMode === 'Gym' && styles.modeDescActive]}>Build muscle, track workouts, and transform your body</Text>
                </View>
              </View>
              <View style={styles.tagRow}>
                <View style={[styles.tag, selectedMode === 'Gym' && styles.tagActive]}><Text style={[styles.tagText, selectedMode === 'Gym' && styles.tagTextActive]}>Weekly plans</Text></View>
                <View style={[styles.tag, selectedMode === 'Gym' && styles.tagActive]}><Text style={[styles.tagText, selectedMode === 'Gym' && styles.tagTextActive]}>Protein tracking</Text></View>
                <View style={[styles.tag, selectedMode === 'Gym' && styles.tagActive]}><Text style={[styles.tagText, selectedMode === 'Gym' && styles.tagTextActive]}>Progress stats</Text></View>
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1, minHeight: 20 }} />

            <TouchableOpacity 
              style={styles.startBtnWrapper} 
              onPress={handleGetStarted}
              disabled={!selectedMode}
            >
              <View style={[styles.startBtn, !selectedMode && styles.btnDisabled]}>
                <Text style={styles.startBtnText}>Get Started</Text>
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
    marginTop: 10,
  },
  backBtn: { alignSelf: 'flex-start', marginTop: 10, marginBottom: 10, width: 40, height: 40, justifyContent: 'center', marginLeft: 20, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: '#1B5E20', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#388E3C', marginTop: 10, marginBottom: 30, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardActive: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#E8F5E9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: { flex: 1 },
  modeTitle: { fontSize: 20, fontWeight: '800', color: '#2E7D32' },
  modeTitleActive: { color: '#1B5E20' },
  modeDesc: { fontSize: 14, color: '#666', marginTop: 4, lineHeight: 20, fontWeight: '500' },
  modeDescActive: { color: '#388E3C' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
  tag: {
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  tagActive: {
    borderColor: '#81C784',
    backgroundColor: '#C8E6C9',
  },
  tagText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  tagTextActive: { color: '#1B5E20', fontWeight: '700' },
  startBtnWrapper: {
    marginTop: 10,
  },
  startBtn: {
    backgroundColor: '#4CAF50',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  btnDisabled: { backgroundColor: '#A5D6A7', elevation: 0 },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});