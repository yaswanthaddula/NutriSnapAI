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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Ionicons name="arrow-back" size={28} color="#0A1629" />
        </TouchableOpacity>

        <Text style={styles.title}>Choose Your Mode</Text>
        <Text style={styles.subtitle}>You can change this anytime</Text>

        {/* --- Health Mode Card --- */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.card, selectedMode === 'Health' && styles.cardActive]}
          onPress={() => setSelectedMode('Health')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="heart-outline" size={24} color="#00C853" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.modeTitle}>Health Mode</Text>
              <Text style={styles.modeDesc}>Focus on wellness, nutrition, and sustainable fitness</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>Calorie tracking</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Wellness tips</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Meal balance</Text></View>
          </View>
        </TouchableOpacity>

        {/* --- Gym Mode Card --- */}
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
              <Text style={styles.modeTitle}>Gym Mode</Text>
              <Text style={styles.modeDesc}>Build muscle, track workouts, and transform your body</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>Weekly plans</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Protein tracking</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Progress stats</Text></View>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1, minHeight: 100 }} />

        {/* --- Get Started Button --- */}
        <TouchableOpacity 
          style={[
            styles.startBtn, 
            { backgroundColor: selectedMode ? '#00C853' : '#81E19E' }
          ]} 
          onPress={handleGetStarted}
          disabled={!selectedMode}
        >
          <Text style={styles.startBtnText}>Get Started</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 20 },
  backBtn: { alignSelf: 'flex-start', marginTop: 10, marginBottom: 10, width: 50, height: 50, justifyContent: 'center', marginLeft: -10 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#011627', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#707070', marginTop: 10, marginBottom: 40 },
  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  cardActive: {
    borderColor: '#00C853',
    borderWidth: 2,
    backgroundColor: '#F1FBF2',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: { flex: 1 },
  modeTitle: { fontSize: 20, fontWeight: 'bold', color: '#011627' },
  modeDesc: { fontSize: 14, color: '#707070', marginTop: 4, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
  tag: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  tagText: { fontSize: 12, color: '#555' },
  startBtn: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});