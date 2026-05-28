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

import useAppStore from '../src/store/useAppStore';

const { width } = Dimensions.get('window');

export default function SundayDetail() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const { addNotification, completeHealthDay } = useAppStore();
  
  const dayName = 'Sunday';
  const planTitle = 'Recovery & Relaxation';
  const calorieBurn = 200;

  const [tasks, setTasks] = useState([
    { id: 1, text: '10 minute gentle stretching', icon: 'human-stretching', iconType: 'MCI', color: '#E8F5E9', completed: false },
    { id: 2, text: '15 minute deep relaxation', icon: 'meditation', iconType: 'MCI', color: '#FFF3E0', completed: false },
    { id: 3, text: 'Short recovery walk', icon: 'walk', iconType: 'MCI', color: '#E3F2FD', completed: false },
    { id: 4, text: 'Plan next week meals', icon: 'notebook-edit-outline', iconType: 'MCI', color: '#FFEBEE', completed: false },
    { id: 5, text: 'Sleep 8+ hours', icon: 'bed-outline', iconType: 'Ionicons', color: '#FFF9C4', completed: false },
  ]);

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      setTasks(prev => prev.map(t => t.id === 2 ? { ...t, completed: true } : t));
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

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
        title: "Week Complete!",
        message: `You've completed all Sunday health goals and the week!`,
        type: 'success',
        mode: 'health'
      });
      Alert.alert("Beautiful!", `You finished your recovery day for ${dayName}!`, [
        { text: "Awesome", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Relax!", `You still have ${tasks.length - completedCount} tasks to finish.`);
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
        
        {/* INTERACTIVE CONTENT */}
        <View style={[styles.interactiveCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.interactiveTitle, { color: theme.text }]}>Today's Health Activity</Text>
          
          {/* Relaxation Timer */}
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}><Ionicons name="timer-outline" size={24} color="#FF9800" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.activityLabel, { color: theme.text }]}>Relaxation Timer</Text>
              <Text style={[styles.activityVal, { color: theme.subText }]}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.timerBtn, { backgroundColor: timerActive ? '#FF5252' : '#00C853' }]} 
              onPress={() => setTimerActive(!timerActive)}
            >
              <Text style={styles.timerBtnTxt}>{timerActive ? 'Pause' : 'Start'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sleep Tip */}
          <View style={[styles.activityRow, { marginTop: 20 }]}>
            <View style={styles.activityIcon}><Ionicons name="moon-outline" size={24} color="#2196F3" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.activityLabel, { color: theme.text }]}>Sleep Tip</Text>
              <Text style={[styles.activityVal, { color: theme.subText }]}>Dim lights 1 hour before bed for better recovery.</Text>
            </View>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>{planTitle}</Text>
          <Text style={[styles.subTitle, { color: theme.subText }]}>Focus: Recovery & Quality Sleep</Text>
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
          <Text style={styles.btnText}>Mark as Completed</Text>
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
  scroll: { paddingHorizontal: 25, paddingBottom: 50 },
  interactiveCard: { padding: 20, borderRadius: 25, borderWidth: 1, marginBottom: 25 },
  interactiveTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  activityLabel: { fontSize: 14, fontWeight: '600' },
  activityVal: { fontSize: 12, marginTop: 2 },
  timerBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  timerBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 12 },
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