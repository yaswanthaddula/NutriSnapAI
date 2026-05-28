import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { foodSuggestionService } from '../src/services/foodSuggestionService';
import { useTheme } from './_layout';

export default function PreWorkoutScreen() {
  const { isDark } = useTheme();
  const meals = useMemo(() => foodSuggestionService.getSuggestions('pre'), []);

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#707070',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#EEE',
    infoBox: isDark ? '#1A2E22' : '#F1FBF2',
    infoBorder: isDark ? '#2E3D31' : '#E8F5E9',
    infoTitle: isDark ? '#FFFFFF' : '#333',
    infoSub: isDark ? '#AAAAAA' : '#555',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Pre-Workout Meals</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Fuel your training session</Text>

        <View style={[styles.infoBoxGreen, { backgroundColor: theme.infoBox, borderColor: theme.infoBorder }]}>
          <Ionicons name="information-circle" size={24} color="#00C853" />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: theme.infoTitle }]}>Personalized Fuel</Text>
            <Text style={[styles.infoSub, { color: theme.infoSub }]}>Based on your goals and today's workout</Text>
          </View>
        </View>

        {meals.map((meal, index) => (
          <View key={index} style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
              <Text style={styles.timeTextGreen}>{meal.time}</Text>
            </View>
            <Text style={[styles.statsText, { color: theme.subText }]}>{meal.kcal} kcal   •   {meal.carbs || meal.protein}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backBtn: { padding: 5 },
  scroll: { paddingHorizontal: 25, paddingBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginBottom: 25 },
  infoBoxGreen: { 
    flexDirection: 'row', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: 25, 
    alignItems: 'center' 
  },
  infoText: { marginLeft: 15 },
  infoTitle: { fontWeight: 'bold', fontSize: 16 },
  infoSub: { fontSize: 14 },
  mealCard: { padding: 20, borderWidth: 1, borderRadius: 20, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealName: { fontSize: 18, fontWeight: 'bold' },
  timeTextGreen: { color: '#00C853', fontWeight: '600' },
  statsText: { fontSize: 14 }
});