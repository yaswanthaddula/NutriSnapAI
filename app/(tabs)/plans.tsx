import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WORKOUT_PLANS } from '../../src/data/workoutPlans';
import { useTheme } from '../_layout';

export default function PlansScreen() {
  const { isDark } = useTheme();
  const handleNavigation = (day: string) => {
    router.push({ pathname: '/workout-day-detail', params: { day } });
  };

  const getModernIcon = (day: string) => {
    switch (day.toUpperCase()) {
      case 'CHEST DAY': return { icon: 'weight-lifter', color: '#FF5722', bg: 'rgba(255, 87, 34, 0.1)' };
      case 'BACK DAY': return { icon: 'human-handsdown', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.1)' };
      case 'SHOULDER DAY': return { icon: 'dumbbell', color: '#E91E63', bg: 'rgba(233, 30, 99, 0.1)' };
      case 'LEG DAY': return { icon: 'shoe-sneaker', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.1)' };
      case 'ARMS DAY': return { icon: 'arm-flex', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)' };
      case 'FULL BODY': return { icon: 'human-handsup', color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.1)' };
      case 'REST DAY': return { icon: 'flower', color: '#00BCD4', bg: 'rgba(0, 188, 212, 0.1)' };
      default: return { icon: 'fitness-center', color: '#00C853', bg: 'rgba(0, 200, 83, 0.1)' };
    }
  };

  const theme = {
    background: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#707070',
    border: isDark ? '#333333' : '#F0F0F0',
    headerBg: isDark ? '#1A1A1A' : '#FFFFFF',
    btnBg: isDark ? '#2A2A2A' : '#F5F5F5'
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.navHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.btnBg }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>Gym Plans</Text>
          <Text style={[styles.subTitle, { color: theme.subText }]}>Select a workout day to begin</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {WORKOUT_PLANS.map((item, index) => {
          const iconConfig = getModernIcon(item.day);
          return (
          <TouchableOpacity 
            key={index} 
            style={[styles.planCard, { backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#CCC' }]}
            onPress={() => handleNavigation(item.day)}
            activeOpacity={0.7}
          >
            <View style={[styles.emojiContainer, { backgroundColor: iconConfig.bg }]}>
              <MaterialCommunityIcons name={iconConfig.icon as any} size={32} color={iconConfig.color} />
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.dayName}>{item.day}</Text>
              <Text style={[styles.workoutName, { color: theme.text }]}>{item.day === 'Rest Day' ? 'Recovery' : item.day}</Text>
              <Text style={[styles.details, { color: theme.subText }]}>
                {item.exercises.length} exercises • {item.duration}
              </Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#444' : '#CCC'} />
          </TouchableOpacity>
        )})}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  navHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 45 : 10, 
    paddingBottom: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F5F5F5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { alignItems: 'center' },
  mainTitle: { fontSize: 18, fontWeight: 'bold' },
  subTitle: { fontSize: 12, color: '#707070' },
  scroll: { padding: 20 },
  planCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 25, 
    padding: 18, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  emoji: { fontSize: 28 },
  cardContent: { flex: 1 },
  dayName: { color: '#00C853', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  workoutName: { fontSize: 18, fontWeight: 'bold', color: '#011627' },
  details: { color: '#AAA', fontSize: 13, marginTop: 4 }
});