import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  Alert,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 

export default function LegDayScreen() {
  const { isDark } = useTheme();
  const [isDone, setIsDone] = useState(false);

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  // Unique images for Leg Day exercises
  const exercises = [
    { 
      id: 1, 
      name: 'Squats', 
      sets: 4, 
      reps: 12, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548530.png' // Barbell icon
    },
    { 
      id: 2, 
      name: 'Leg Press', 
      sets: 4, 
      reps: 10, 
      image: 'https://cdn-icons-png.flaticon.com/512/10405/10405459.png' // Machine icon
    },
    { 
      id: 3, 
      name: 'Lunges', 
      sets: 3, 
      reps: 12, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548440.png' // Dumbbell icon
    },
    { 
      id: 4, 
      name: 'Hamstring Curl', 
      sets: 3, 
      reps: 15, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548425.png' // Bench/Leg machine
    },
    { 
      id: 5, 
      name: 'Calf Raises', 
      sets: 4, 
      reps: 20, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548537.png' // Weight plate
    },
  ];

  const handleMarkComplete = () => {
    setIsDone(true);
    Alert.alert(
      "Workout Finished! 🎉",
      "Great session, yashu! Your Leg Day stats have been saved.",
      [{ text: "Back to Home", onPress: () => router.push('/gym-home') }]
    );
  };

  const handleReplace = () => {
    Alert.alert(
      "Replace Workout",
      "Choose a replacement for Leg Day:",
      [
        { text: "Quad Focus", onPress: () => console.log("Quad selected") },
        { text: "Glute Focus", onPress: () => console.log("Glute selected") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Navigation */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.headerArea}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>🦵</Text>
            <Text style={[styles.title, { color: theme.text }]}>Leg Day</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.subText }]}>5 exercises • 45 min</Text>
        </View>

        {/* Exercise Cards */}
        {exercises.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            {/* Visual Guide Image */}
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

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.mainBtn, { backgroundColor: '#00C853' }]} 
            onPress={handleMarkComplete}
          >
            <Text style={styles.mainBtnText}>Mark Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.outlineBtn, { borderColor: theme.border }]} 
            onPress={handleReplace}
          >
            <Text style={[styles.outlineBtnText, { color: theme.text }]}>Replace Workout</Text>
          </TouchableOpacity>
        </View>

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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
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
    width: 40,
    height: 40,
    resizeMode: 'contain'
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 18, fontWeight: 'bold' },
  exerciseStats: { fontSize: 14, marginTop: 4 },

  buttonContainer: { marginTop: 10, marginBottom: 40 },
  mainBtn: { 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 4
  },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  outlineBtn: { 
    height: 65, 
    borderRadius: 20, 
    borderWidth: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  outlineBtnText: { fontSize: 16, fontWeight: '600' }
});