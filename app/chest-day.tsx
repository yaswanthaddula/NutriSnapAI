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

export default function ChestDayScreen() {
  const { isDark } = useTheme();
  const [isDone, setIsDone] = useState(false);

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  // Unique images for Chest Day equipment
  const exercises = [
    { 
      id: 1, 
      name: 'Bench Press', 
      sets: 4, 
      reps: 10, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548530.png' // Barbell
    },
    { 
      id: 2, 
      name: 'Incline Dumbbell Press', 
      sets: 4, 
      reps: 12, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548440.png' // Dumbbells
    },
    { 
      id: 3, 
      name: 'Cable Flyes', 
      sets: 3, 
      reps: 15, 
      image: 'https://cdn-icons-png.flaticon.com/512/10405/10405459.png' // Cable Machine
    },
    { 
      id: 4, 
      name: 'Push-ups', 
      sets: 3, 
      reps: 20, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548480.png' // Bodyweight/Floor
    },
    { 
      id: 5, 
      name: 'Dips', 
      sets: 3, 
      reps: 12, 
      image: 'https://cdn-icons-png.flaticon.com/512/2548/2548437.png' // Dip Station
    },
  ];

  const handleMarkComplete = () => {
    setIsDone(true);
    Alert.alert(
      "Chest Day Done! 💪",
      "Excellent work on your chest and triceps. Rest up!",
      [{ text: "Back to Home", onPress: () => router.push('/gym-home') }]
    );
  };

  const handleReplace = () => {
    Alert.alert(
      "Replace Workout",
      "Select a variation:",
      [
        { text: "Dumbbell Only", onPress: () => console.log("DB variation") },
        { text: "Machine Focus", onPress: () => console.log("Machine variation") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerArea}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>💪</Text>
            <Text style={[styles.title, { color: theme.text }]}>Chest Day</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.subText }]}>5 exercises • 45 min</Text>
        </View>

        {exercises.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
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