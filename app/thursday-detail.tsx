import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout'; 
import YoutubePlayer from 'react-native-youtube-iframe';
import useAppStore from '../src/store/useAppStore';

const { width } = Dimensions.get('window');

export default function ThursdayDetail() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const { addNotification, completeHealthDay } = useAppStore();
  
  const dayName = 'Thursday';
  const planTitle = 'Active Cardio Day';
  const calorieBurn = 450;
  const videoId = params.videoId as string || 'v7AYKMP6rOE';

  const [tasks, setTasks] = useState([
    { id: 1, text: '20 min Morning Jog', icon: 'run', iconType: 'MCI', color: '#E8F5E9', completed: false },
    { id: 2, text: 'Stretching & Mobility', icon: 'human-stretching', iconType: 'MCI', color: '#FFF3E0', completed: false },
    { id: 3, text: 'Drink 3 liters water', icon: 'water', iconType: 'Ionicons', color: '#E3F2FD', completed: false },
    { id: 4, text: 'Eat a protein-rich dinner', icon: 'food-variant', iconType: 'MCI', color: '#FFEBEE', completed: false },
    { id: 5, text: 'No social media 1h before bed', icon: 'cellphone-off', iconType: 'MCI', color: '#FFF9C4', completed: false },
  ]);

  const [playing, setPlaying] = useState(true);

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleComplete = () => {
    if (completedCount === tasks.length) {
      completeHealthDay(dayName, calorieBurn);
      addNotification({
        title: "Day Complete!",
        message: `You've completed all Thursday health goals!`,
        type: 'success'
      });
      Alert.alert("Awesome!", `You finished all your goals for ${dayName}!`, [
        { text: "Awesome", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Keep Going!", `You still have ${tasks.length - completedCount} tasks to finish.`);
    }
  };

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    card: isDark ? '#1E1E1E' : '#F8F9FA',
    border: isDark ? '#333333' : '#F0F0F0',
    subText: isDark ? '#AAAAAA' : '#7D8592',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#333' : '#F5F5F5' }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{dayName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.videoCard, { borderColor: theme.border }]}>
          <YoutubePlayer
            height={220}
            play={playing}
            videoId={videoId}
          />
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>{planTitle}</Text>
          <Text style={[styles.subTitle, { color: theme.subText }]}>Focus: Heart Health & Stamina</Text>
        </View>

        <View style={[styles.progressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.subText }]}>Completion Progress</Text>
            <Text style={styles.progressCount}>{completedCount}/{tasks.length}</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
            <View style={[styles.barFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Checklist</Text>

        {tasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => toggleTask(task.id)}
          >
            <View style={[styles.checkCircle, task.completed && styles.checkCircleActive]}>
              {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <View style={[styles.miniIconBox, { backgroundColor: task.color }]}>
               {task.iconType === 'MCI' ? (
                 <MaterialCommunityIcons name={task.icon as any} size={20} color="#555" />
               ) : (
                 <Ionicons name={task.icon as any} size={20} color="#555" />
               )}
            </View>
            <Text style={[styles.taskText, { color: theme.text }, task.completed && styles.taskTextDone]}>
              {task.text}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.btnText}>Complete Day</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.skipBtn, { borderColor: theme.border }]} onPress={() => router.back()}>
          <Text style={[styles.skipText, { color: theme.subText }]}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 10, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 25, paddingBottom: 50, width: '100%', maxWidth: 800, alignSelf: 'center' },
  videoCard: { width: '100%', height: 220, borderRadius: 25, overflow: 'hidden', backgroundColor: '#000', marginBottom: 20, borderWidth: 1 },
  video: { width: '100%', height: '100%' },
  titleSection: { marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: 'bold' },
  subTitle: { fontSize: 14, marginTop: 4 },
  progressCard: { padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14 },
  progressCount: { color: '#00C853', fontWeight: 'bold' },
  barBg: { height: 8, borderRadius: 4 },
  barFill: { height: '100%', backgroundColor: '#00C853', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  checkCircleActive: { backgroundColor: '#00C853', borderColor: '#00C853' },
  miniIconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  taskText: { fontSize: 15, marginLeft: 15, fontWeight: '500' },
  taskTextDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  completeBtn: { backgroundColor: '#00C853', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 3, shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  skipBtn: { height: 60, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  skipText: { fontWeight: '600' }
});