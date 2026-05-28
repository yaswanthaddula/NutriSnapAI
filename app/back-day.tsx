import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, // <-- Added Image component
  Platform, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 

export default function BackDayScreen() {
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  // Added "image" property for each workout
  const exercises = [
    { 
      id: 1, 
      name: 'Deadlifts', 
      sets: 4, 
      reps: 8, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548537.png' // Use instrument icons or workout photos
    },
    { 
      id: 2, 
      name: 'Pull-ups', 
      sets: 4, 
      reps: 10, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548440.png' 
    },
    { 
      id: 3, 
      name: 'Barbell Rows', 
      sets: 4, 
      reps: 12, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548530.png' 
    },
    { 
      id: 4, 
      name: 'Lat Pulldown', 
      sets: 3, 
      reps: 12, 
      image: 'https://cdn-icons-png.flaticon.com/512/10405/10405459.png' 
    },
    { 
      id: 5, 
      name: 'Face Pulls', 
      sets: 3, 
      reps: 15, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548425.png' 
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerArea}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>🏋️‍♂️</Text>
            <Text style={[styles.title, { color: theme.text }]}>Back Day</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Visual Guide • 5 exercises</Text>
        </View>

        {exercises.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            {/* Workout Image / Icon */}
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.image }} style={styles.workoutImg} />
            </View>

            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, { color: theme.text }]}>
                {item.id}. {item.name}
              </Text>
              <Text style={[styles.exerciseStats, { color: theme.subText }]}>
                {item.sets} sets × {item.reps} reps
              </Text>
            </View>
            
            <Ionicons name="information-circle-outline" size={22} color="#00C853" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[styles.mainBtn, { backgroundColor: '#00C853' }]} 
          onPress={() => Alert.alert("Saved!", "Workout progress tracked.")}
        >
          <Text style={styles.mainBtnText}>Mark Complete</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  backBtn: { marginBottom: 15, marginLeft: -10 },
  headerArea: { marginBottom: 30 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 35, marginRight: 15 },
  title: { fontSize: 34, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 5 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 22, 
    borderWidth: 1, 
    marginBottom: 15,
    elevation: 2 
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  workoutImg: {
    width: 45,
    height: 45,
    resizeMode: 'contain'
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 17, fontWeight: 'bold' },
  exerciseStats: { fontSize: 13, marginTop: 4 },
  mainBtn: { 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    marginBottom: 40 
  },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});