import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Platform,
  Image
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WORKOUT_PLANS } from '../src/data/workoutPlans';
import { useTheme } from './_layout';

export default function WorkoutDayDetailScreen() {
  const { day } = useLocalSearchParams();
  const { isDark } = useTheme();

  const dayData = WORKOUT_PLANS.find(p => p.day === day) || WORKOUT_PLANS[0];

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#707070',
    border: isDark ? '#333333' : '#F0F0F0',
    accent: '#00C853'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{dayData.day}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Exercises</Text>
            <Text style={styles.summaryValue}>{dayData.exercises.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{dayData.duration}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Est. Burn</Text>
            <Text style={styles.summaryValue}>{dayData.calories} kcal</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exercises</Text>

        {dayData.exercises.map((exercise, index) => (
          <TouchableOpacity 
            key={exercise.id} 
            style={[styles.exCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push({ 
                pathname: '/exercise-detail', 
                params: { day: dayData.day, exerciseId: exercise.id } 
            })}
          >
            <Image 
                source={{ uri: exercise.thumbnail }} 
                style={styles.exThumbnail}
                resizeMode="cover"
            />
            <View style={styles.exInfo}>
              <Text style={[styles.exName, { color: theme.text }]}>{exercise.name}</Text>
              <Text style={[styles.exTarget, { color: theme.subText }]}>{exercise.targetMuscle}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statTag}>
                    <Text style={styles.statTagText}>{exercise.sets} sets</Text>
                </View>
                <View style={styles.statTag}>
                    <Text style={styles.statTagText}>{exercise.reps} reps</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
                style={styles.viewDemoBtn}
                onPress={() => router.push({ 
                    pathname: '/exercise-detail', 
                    params: { day: dayData.day, exerciseId: exercise.id } 
                })}
            >
              <Text style={styles.viewDemoText}>View</Text>
              <Ionicons name="play-circle" size={20} color="#00C853" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 45 : 10, 
    paddingBottom: 15,
    backgroundColor: 'transparent'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  scroll: { padding: 20 },
  summaryCard: { 
    flexDirection: 'row', 
    backgroundColor: '#00C853', 
    borderRadius: 25, 
    padding: 20, 
    justifyContent: 'space-between',
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 5 },
  summaryValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  exCard: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    marginBottom: 15, 
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    alignItems: 'center'
  },
  exThumbnail: { 
    width: 80, 
    height: 80, 
    borderRadius: 15,
    backgroundColor: '#EEE'
  },
  exInfo: { flex: 1, marginLeft: 15 },
  exName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  exTarget: { fontSize: 13, marginBottom: 8 },
  statsRow: { flexDirection: 'row' },
  statTag: { 
    backgroundColor: '#F0F0F0', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginRight: 8 
  },
  statTagText: { fontSize: 11, color: '#555', fontWeight: '600' },
  viewDemoBtn: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  viewDemoText: { 
    fontSize: 12, 
    color: '#00C853', 
    fontWeight: 'bold',
    marginBottom: 2
  }
});
