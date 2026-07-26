import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Image,
  Animated,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Platform as RNPlatform } from 'react-native';
const LottieView = RNPlatform.OS !== 'web' ? require('lottie-react-native').default : null;
import { useTheme } from '../_layout';
import useAppStore from '../../src/store/useAppStore';
import { calculateMealTotals, formatTo12Hour } from '../../src/utils/calculations';
import { chatWithAi } from '../../src/services/chatGeminiService';
import { WORKOUT_PLANS } from '../../src/data/workoutPlans';
import { Pedometer } from 'expo-sensors';
import { notificationService } from '../../src/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../src/services/apiService';

export default function GymHomeScreen() {
  const params = useLocalSearchParams();
  const { isDark } = useTheme(); 

  // 1. GLOBAL STATE
  const { 
    userProfile, meals, steps, caloriesBurned, workouts, activeWorkout, notifications, 
    notificationPrefs, waterData, updateSteps, loadStoredData, saveStoredData, setMeals, 
    addWater, setWaterIntake, recalculateWaterGoal, fetchTodayReminders, todayReminders, reminders, checkNewDay, markAllAsRead
  } = useAppStore();
  
  const unreadCount = notifications.filter((n: any) => !n.isRead && n.status !== 'cleared' && (!n.mode || n.mode === 'gym')).length;

  // Helper to get nearest upcoming reminder
  const getNextReminder = () => {
    if (!todayReminders || todayReminders.length === 0) return null;
    const now = new Date();
    let next = null;
    let minDiff = Infinity;
    todayReminders.forEach((r: any) => {
      if (!r.is_enabled || r.status === 'done' || r.status === 'cleared') return;
      const timeStr = r.reminder_time;
      if (!timeStr) return;
      const match = timeStr.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i);
      if (match) {
        let hour = parseInt(match[1]);
        const min = parseInt(match[2]);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        const remDate = new Date(now);
        remDate.setHours(hour, min, 0, 0);
        const diff = remDate.getTime() - now.getTime();
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          next = r;
        }
      }
    });
    return next;
  };
  const upcomingReminder = getNextReminder();

  const currentHour = new Date().getHours();
  let greetingTitle = 'Good Night';
  if (currentHour >= 5 && currentHour < 12) greetingTitle = 'Good Morning';
  else if (currentHour >= 12 && currentHour < 17) greetingTitle = 'Good Afternoon';
  else if (currentHour >= 17 && currentHour < 21) greetingTitle = 'Good Evening';
  
  const getNotificationBadgeText = () => {
    const upcoming = todayReminders?.filter((r: any) => r.is_enabled && r.status !== 'Completed' && r.status !== 'Missed') || [];
    const count = upcoming.length;

    if (count > 1) {
      return `${count} Upcoming`;
    } else if (count === 1) {
      const r = upcoming[0];
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      
      const match = r.reminder_time?.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)$/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        const rMins = h * 60 + m;
        const diff = rMins - currentMins;
        
        let title = r.title || r.reminder_type || 'Reminder';
        title = title.replace(' Reminder', '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        if (diff > 0 && diff <= 60) {
          return `${title} in ${diff} min`;
        } else {
          return `${title} at ${r.reminder_time}`;
        }
      } else {
        let title = r.title || r.reminder_type || 'Reminder';
        title = title.charAt(0).toUpperCase() + title.slice(1);
        return `${title}`;
      }
    } else if (unreadCount > 0) {
      return `${unreadCount} Notifications`;
    }
    
    return '';
  };
  const badgeText = getNotificationBadgeText();
  
  // Calculate Today's Workout
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const todayWorkoutData = WORKOUT_PLANS.find(p => p.dayOfWeek === todayName) || WORKOUT_PLANS[0];
  
  // Check if today's workout is completed
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = workouts.find((w: any) => w.date === todayStr && (w.day === todayWorkoutData.day || w.day === todayName));
  
  const workoutStatus = completedToday ? 'Completed' : (activeWorkout && activeWorkout.day === todayWorkoutData.day ? 'In Progress' : 'Not Started');
  
  const workoutCalories = workouts
    .filter((w: any) => w.date === todayStr)
    .reduce((sum: number, w: any) => sum + (w.calories || 0), 0);

  const totalCaloriesBurned = caloriesBurned + workoutCalories;
  const [showWelcome, setShowWelcome] = useState(true); 
  const [isChatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [manualStepsVal, setManualStepsVal] = useState(steps.toString());
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [waterInputVal, setWaterInputVal] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: `Hi User! I'm your NutriSnap AI assistant. I can help you with nutrition advice, workout tips, and personalized recommendations. What would you like to know?`, isAi: true }
  ]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isHistoryVisible, setHistoryVisible] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const bellShakeAnim = React.useRef(new Animated.Value(0)).current;

  // 2. EFFECTS
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    if (unreadCount > 0 || (todayReminders && todayReminders.length > 0)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bellShakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(bellShakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(bellShakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(bellShakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.delay(2000)
        ])
      ).start();
    }

    const init = async () => {
      await loadStoredData();
      await syncBackendMeals();
      recalculateWaterGoal();
      subscribePedometer();
      // Check for real notifications on load
      notificationService.checkAndGenerate();
      loadChatHistory();
    };
    init();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkNewDay();
      fetchTodayReminders();
    }, [])
  );

  const syncBackendMeals = async () => {
    try {
      const backendMeals = await apiService.getTodayMeals();
      console.log("Fetched gym meals:", backendMeals);

      let mealImagesCache: any = {};
      try {
        const cacheStr = await AsyncStorage.getItem('nutrisnap_meal_images');
        if (cacheStr) mealImagesCache = JSON.parse(cacheStr);
      } catch(e) {}

      if (backendMeals) {
        const currentStoreMeals = useAppStore.getState().meals;
        const currentTodayMeals = currentStoreMeals.filter((m: any) => m.date === todayStr && m.mode === 'gym');
        const gymBackendMeals = backendMeals.filter((bm: any) => bm.mode === 'gym');

        const formattedMeals = gymBackendMeals.map((bm: any) => {
          const formattedTime = bm.time ? bm.time.slice(0, 5) : '00:00';
          const localMatch = currentTodayMeals.find((lm: any) => 
            lm.name === bm.food_name && lm.time === formattedTime
          );
          
          const cacheKey = `${bm.food_name}_${formattedTime}`;
          const cachedImage = mealImagesCache[cacheKey];

          return {
            id: bm.id,
            name: bm.food_name,
            calories: bm.calories,
            protein: bm.protein,
            carbs: bm.carbs,
            fat: bm.fat,
            quantity: bm.quantity,
            unit: bm.unit,
            emoji: localMatch?.emoji || '💪',
            imageUri: bm.meal_image_url || localMatch?.imageUri || cachedImage || bm.image_url,
            mode: 'gym',
            time: formattedTime,
            date: bm.date
          };
        });
        
        // Merge with local meals, replacing only today's gym meals
        const otherMeals = currentStoreMeals.filter((m: any) => !(m.date === todayStr && m.mode === 'gym'));
        setMeals([...formattedMeals, ...otherMeals]);
        await saveStoredData();
      }
    } catch (error) {
      console.log("Backend meal fetch failed in Gym Home");
    }
  };

  const gymMeals = meals.filter((m: any) => {
    const isToday = m.date === todayStr;
    return isToday && m.mode === 'gym';
  });

  useEffect(() => {
    const syncLog = async () => {
      try {
        const { totalCalories, totalProtein } = calculateMealTotals(gymMeals);
        await apiService.saveGymLog({
          protein_consumed: totalProtein,
          calories_consumed: totalCalories,
          protein_goal: userProfile.proteinTarget || 150,
          calories_goal: userProfile.calorieTarget || 2000,
          workout_calories_burned: workoutCalories,
          workout_status: completedToday ? 'completed' : 'pending'
        });
      } catch (e) {
        console.log("Failed to sync gym log:", e);
      }
    };
    if (userProfile.id) syncLog();
  }, [gymMeals.length, workoutCalories, completedToday]);

  const loadChatHistory = async () => {
    try {
      // 1. Fetch from Backend (Source of truth)
      console.log("Fetching AI chat history for mode: gym");
      const backendHistory = await apiService.getChatHistory('gym');
      console.log("Fetched AI chat history:", backendHistory);

      if (backendHistory && backendHistory.length > 0) {
        const formattedHistory = backendHistory.map((h: any) => ({
          id: h.id,
          question: h.question,
          answer: h.answer,
          createdAt: new Date(h.created_at).toLocaleString()
        }));
        setChatHistory(formattedHistory);
        // Sync to local storage as cache
        await AsyncStorage.setItem('gym_chat_history_list', JSON.stringify(formattedHistory));
        return;
      }

      // 2. Fallback to local storage
      const stored = await AsyncStorage.getItem('gym_chat_history_list');
      if (stored) {
        setChatHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load chat history", e);
      // Fallback to local storage on error
      const stored = await AsyncStorage.getItem('gym_chat_history_list');
      if (stored) {
        setChatHistory(JSON.parse(stored));
      }
    }
  };

  const saveChatHistoryItem = async (question: string, answer: string) => {
    try {
      const newItem = {
        id: Date.now(),
        question,
        answer,
        createdAt: new Date().toLocaleString()
      };
      
      const updatedHistory = [newItem, ...chatHistory].slice(0, 50);
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem('gym_chat_history_list', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to save chat history item", e);
    }
  };

  const clearChatHistory = async () => {
    try {
      Alert.alert(
        "Clear History",
        "Are you sure you want to clear your AI chat history?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Clear", 
            style: "destructive",
            onPress: async () => {
              await apiService.clearChatHistory('gym');
              setChatHistory([]);
              await AsyncStorage.removeItem('gym_chat_history_list');
            }
          }
        ]
      );
    } catch (e) {
      console.warn("Failed to clear history", e);
    }
  };

  useEffect(() => {
    // Only for web fallback
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    
    let lastStepTime = 0;
    const handleMotion = (event: any) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
      if (mag > 11.5) { 
        const now = Date.now();
        if (now - lastStepTime > 300) {
           lastStepTime = now;
           const store = useAppStore.getState();
           store.updateSteps(store.steps + 1);
        }
      }
    };
    
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  const subscribePedometer = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    
    if (isAvailable) {
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        setIsPedometerAvailable('unavailable');
        return;
      }
      
      setIsPedometerAvailable('available');

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const initialSteps = useAppStore.getState().steps;

      const fetchTodaySteps = async () => {
        try {
          const end = new Date();
          const result = await Pedometer.getStepCountAsync(start, end);
          if (result) {
            updateSteps(result.steps);
          }
        } catch (error) {
          console.log("Historical steps not supported, using real-time offset.");
        }
      };

      // Initial fetch for today
      await fetchTodaySteps();

      // Real-time updates
      return Pedometer.watchStepCount(result => {
        // use cumulative steps from watch + initial steps in store
        updateSteps(initialSteps + result.steps);
      });
    } else {
      setIsPedometerAvailable('unavailable');
    }
  };

  useEffect(() => {
    if (userProfile.name) {
      setMessages(prev => [
        { ...prev[0], text: `Hi ${userProfile.name}! I'm your NutriSnap AI assistant. I can help you with nutrition advice, workout tips, and personalized recommendations. What would you like to know?` },
        ...prev.slice(1)
      ]);
    }
  }, [userProfile.name]);

  useEffect(() => {
    loadStoredData();
    notificationService.checkAndGenerate();
    
    // Check if coming from meal scanner
    if (params.newMealName) {
      const newEntry = {
        id: Date.now(),
        name: String(params.newMealName),
        calories: parseInt(String(params.newMealCalories)),
        emoji: String(params.newMealEmoji),
        mode: 'gym',
        time: String(params.mealTimestamp)
      };
      
      const exists = useAppStore.getState().meals.find((m: any) => m.time === newEntry.time && m.name === newEntry.name);
      if (!exists) {
        useAppStore.getState().addMeal(newEntry);
        saveStoredData();
      }
    }

    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [params.newMealName, params.mealTimestamp]);

  // 3. CHAT LOGIC
  const handleSendMessage = async () => {
    if (chatInput.trim() === '' || isChatLoading) return;
    
    setIsChatLoading(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    const userMsg = { id: Date.now(), text: chatInput, isAi: false, timestamp: timeStr };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');

    try {
      // Real AI Call
      const aiResponse = await chatWithAi(currentInput, messages);
      
      const aiMsg = { 
        id: Date.now() + 1, 
        text: aiResponse, 
        isAi: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
      };
      
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        // Save current session history to AsyncStorage
        AsyncStorage.setItem('gym_chat_session', JSON.stringify(updated)).catch(e => console.warn("Failed to save chat session", e));
        return updated;
      });

      // Save to History List (Task 6)
      saveChatHistoryItem(currentInput, aiResponse);

      // Save to Backend
      const payload = {
        mode: 'gym',
        question: currentInput,
        answer: aiResponse
      };
      console.log("Saving AI chat:", payload);
      apiService.saveChatHistory(payload).catch(e => console.log("Backend chat save failed:", e));

    } catch (error: any) {
      const errorMsg = { 
        id: Date.now() + 1, 
        text: error.message || "AI assistant temporarily unavailable.", 
        isAi: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Load session history on mount
  useEffect(() => {
    AsyncStorage.getItem('gym_chat_session').then(stored => {
      if (stored) setMessages(JSON.parse(stored));
    });
  }, []);

  const handleManualSteps = () => {
    const s = parseInt(manualStepsVal) || 0;
    updateSteps(s);
    setShowManualSteps(false);
  };

  const handleStepsPress = async () => {
    if (Platform.OS === 'web' && typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          alert("Step tracking activated! Walk with your phone.");
          return;
        }
      } catch (e) {
        console.warn("Motion permission error", e);
      }
    }
    // Fallback to manual entry if not web, if already granted, or if denied
    setShowManualSteps(true);
  };

  const theme = {
    gradient: isDark ? ['#121212', '#1A1A1A', '#0F0F0F'] as const : ['#F8FAFC', '#E2E8F0', '#CBD5E1'] as const,
    background: 'transparent',
    text: isDark ? '#F8FAFC' : '#1E293B',
    subText: isDark ? '#94A3B8' : '#64748B',
    card: isDark ? 'rgba(30, 30, 30, 0.9)' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    iconColor: isDark ? '#F8FAFC' : '#334155',
    chatBg: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 20,
      elevation: 10,
    }
  };

  const { totalCalories, totalProtein, totalCarbs, totalFats } = calculateMealTotals(gymMeals);
  const caloriesLeft = Math.max(0, userProfile.calorieTarget - totalCalories);
  const proteinLeft = Math.max(0, (userProfile.proteinTarget || 150) - totalProtein);
  const carbsLeft = Math.max(0, (userProfile.carbsTarget || 250) - totalCarbs);
  const fatsLeft = Math.max(0, (userProfile.fatsTarget || 70) - totalFats);

  // Calendar Data
  const calendarDays = [];
  const today = new Date();
  const startOfWeek = new Date();
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    calendarDays.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: i + 1, // Start from 1 as per user request (Sun-1, Mon-2)
      isToday: d.toDateString() === today.toDateString(),
    });
  }

  // Gauge segments
  const segments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const progress = Math.min(1, totalCalories / userProfile.calorieTarget);
  const filledSegments = Math.round(progress * segments.length);

  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      
      {/* MANUAL STEPS MODAL ... (kept same) ... */}
      <Modal visible={showManualSteps} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Set Manual Steps</Text>
            <TextInput 
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              keyboardType="numeric"
              value={manualStepsVal}
              onChangeText={setManualStepsVal}
              placeholder="Enter steps..."
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowManualSteps(false)}>
                <Text style={{ color: theme.subText }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtnModal, { backgroundColor: '#F97316' }]} 
                onPress={handleManualSteps}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWelcome} transparent={false} animationType="fade">
        <View style={[styles.animationContainer, { backgroundColor: '#00C853' }]}>
          {LottieView ? (
            <LottieView
              autoPlay
              loop
              style={styles.lottie}
              source={require('../../assets/animations/gym-welcome.json')} 
            />
          ) : (
            <Text style={{ fontSize: 80, marginBottom: 20 }}>💪</Text>
          )}
          <Text style={styles.welcomeText}>GET READY</Text>
          <Text style={styles.welcomeSub}>Crush your goals today, {userProfile.name}!</Text>
        </View>
      </Modal>

      {/* NOTIFICATION MODAL */}
      <Modal visible={showNotificationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.notifModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.notifModalHeader}>
              <Text style={[styles.notifModalTitle, { color: theme.text }]}>Today's Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {(() => {
                const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay);
                const isWeekend = ['Sat', 'Sun'].includes(todayDay);
                
                const filteredReminders = todayReminders?.filter((r: any) => {
                  if (!r.is_enabled) return false;

                  const isGym = ['workout', 'gym', 'fitness'].includes((r.reminder_type || '').toLowerCase());
                  if (!isGym && !r.title?.toLowerCase().includes('workout') && !r.title?.toLowerCase().includes('gym')) return false;

                  const repeat = r.repeat_type || 'Daily';
                  if (repeat === 'Daily') return true;
                  if (repeat === 'Weekdays') return isWeekday;
                  if (repeat === 'Weekends') return isWeekend;
                  if (repeat === 'Custom' && r.repeat_days) return r.repeat_days.includes(todayDay);
                  return true;
                }) || [];

                if (filteredReminders.length === 0) {
                  return <Text style={{ color: theme.subText, textAlign: 'center', marginTop: 20 }}>No reminders for today.</Text>;
                }

                return filteredReminders.map((r: any, idx: number) => {
                  const status = r.status || 'Upcoming';
                  let statusColor = '#2196F3';
                  let statusIcon = 'time-outline';
                  let statusLabel = 'Upcoming';
                  if (status === 'Completed') { statusColor = '#4CAF50'; statusIcon = 'checkmark-circle'; statusLabel = 'Completed'; }
                  else if (status === 'Missed') { statusColor = '#F44336'; statusIcon = 'close-circle'; statusLabel = 'Missed'; }
                  else if (status === 'Active') { statusColor = '#FF9800'; statusIcon = 'notifications'; statusLabel = 'Active'; }
                  
                  return (
                    <View key={idx} style={[styles.notifItemCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: theme.border }]}>
                      <View style={[styles.notifIconCircle, { backgroundColor: status === 'Completed' ? 'rgba(76, 175, 80, 0.1)' : (status === 'Missed' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)') }]}>
                         <Text style={{ fontSize: 20 }}>{r.title?.includes('Breakfast') ? '🍳' : r.title?.includes('Lunch') ? '🥗' : r.title?.includes('Dinner') ? '🍽️' : r.title?.includes('Water') ? '💧' : r.title?.includes('Workout') ? '🏋️' : '🔔'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.notifItemTitle, { color: theme.text }]}>{r.title || r.reminder_type}</Text>
                        <Text style={[styles.notifItemTime, { color: theme.subText }]}>{r.reminder_time}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                         <Ionicons name={statusIcon as any} size={20} color={statusColor} />
                         <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>{statusLabel}</Text>
                      </View>
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* NEW PREMIUM HEADER */}
      <View style={[styles.topHeader, { backgroundColor: theme.background }]}>
        <View style={styles.userInfoRow}>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarCircle}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={{ width: '100%', height: '100%', borderRadius: 30 }} />
            ) : (
              <Text style={styles.avatarLetter}>{userProfile.name?.charAt(0).toUpperCase() || 'U'}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.welcomeTextColumn}>
            <Text style={[styles.welcomeSmall, { color: theme.subText, fontSize: 16, fontWeight: '700' }]}>Gym Dashboard</Text>
            <Text style={[styles.userNameBold, { color: theme.text, fontSize: 18 }]}>{greetingTitle}, {userProfile.name} 👋</Text>
            <Text style={[styles.welcomeSmall, { color: theme.subText, marginTop: 2, fontSize: 13 }]}>Discipline today, strength tomorrow.</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {upcomingReminder && (
            <View style={[styles.nextReminderChip, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
              <Text style={[styles.nextReminderText, { color: theme.text }]}>
                🕒 {formatTo12Hour(upcomingReminder.reminder_time)}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.notifBtn} 
            onPress={() => router.push({ pathname: '/notification-center', params: { fromMode: 'gym' } })}
            activeOpacity={0.7}
          >
            <Animated.View style={[
              styles.premiumBellContainer,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' },
              { transform: [{
                rotate: bellShakeAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-15deg', '15deg']
                })
              }] }
            ]}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={theme.text} />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={[styles.badgePremium, { right: -4, top: -4, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0 }]}>
                 <Text style={[styles.badgePremiumText, { fontSize: 9, textAlign: 'center' }]}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

        {/* WORKOUT SECTION */}
      <View style={[styles.calendarWrapper, { backgroundColor: theme.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {calendarDays.map((d, i) => (
            <View key={i} style={[styles.calendarDayCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8FBF9', borderColor: d.isToday ? '#00C853' : (isDark ? '#333' : '#F0F0F0') }]}>
              <Text style={[styles.calDayName, { color: theme.subText }]}>{d.dayName}</Text>
              <View style={[styles.calDayCircle, d.isToday && styles.calTodayActive]}>
                <Text style={[styles.calDayNum, d.isToday ? { color: '#FFF' } : { color: theme.text }]}>{d.dayNum}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* NEW CALORIES GAUGE CARD */}
        <View style={[styles.gaugeCard, { backgroundColor: theme.card }]}>
          <View style={styles.gaugeHeader}>
            <Text style={[styles.gaugeTitle, { color: theme.text }]}>Calories</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/camera', params: { fromMode: 'gym' } })}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#00C853" />
            </TouchableOpacity>
          </View>

          <View style={styles.gaugeWrapper}>
            <View style={styles.segmentsRow}>
              {segments.map((s, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.gaugeSegment, 
                    { backgroundColor: i < filledSegments ? '#00C853' : (isDark ? '#333' : '#E0E0E0') },
                    { transform: [{ rotate: `${(i * 15) - 82.5}deg` }, { translateY: -85 }] }
                  ]} 
                />
              ))}
            </View>
            
            <View style={styles.gaugeCenter}>
              <Ionicons name="flame" size={32} color="#FF6D00" />
              <Text style={[styles.remainingValue, { color: theme.text }]}>{caloriesLeft}</Text>
              <Text style={[styles.remainingLabel, { color: theme.subText }]}>Remaining</Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <LinearGradient colors={['#2563EB', '#60A5FA']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#FFF" />
              <Text style={[styles.macroValue, { color: '#FFF' }]}>{proteinLeft}g</Text>
              <Text style={[styles.macroLabel, { color: 'rgba(255,255,255,0.8)' }]}>Protein Left</Text>
            </LinearGradient>
            <LinearGradient colors={['#F97316', '#FDBA74']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="fire" size={24} color="#FFF" />
              <Text style={[styles.macroValue, { color: '#FFF' }]}>{fatsLeft}g</Text>
              <Text style={[styles.macroLabel, { color: 'rgba(255,255,255,0.8)' }]}>Fats Left</Text>
            </LinearGradient>
            <LinearGradient colors={['#22C55E', '#86EFAC']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="bowl-mix-outline" size={24} color="#FFF" />
              <Text style={[styles.macroValue, { color: '#FFF' }]}>{carbsLeft}g</Text>
              <Text style={[styles.macroLabel, { color: 'rgba(255,255,255,0.8)' }]}>Carbs Left</Text>
            </LinearGradient>
          </View>
        </View>

        {/* --- REMINDER STATUS SUMMARY --- */}
        <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: '#2196F3', marginBottom: 15 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminder Status</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 }}>
             {(() => {
               const counts = { Upcoming: 0, Active: 0, Completed: 0, Missed: 0 };
               
               const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
               const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay);
               const isWeekend = ['Sat', 'Sun'].includes(todayDay);
               
               todayReminders?.forEach((r: any) => {
                 if (!r.is_enabled) return;
                 // Date filtering
                 const repeat = r.repeat_type || 'Daily';
                 let validToday = false;
                 if (repeat === 'Daily') validToday = true;
                 else if (repeat === 'Weekdays') validToday = isWeekday;
                 else if (repeat === 'Weekends') validToday = isWeekend;
                 else if (repeat === 'Custom' && r.repeat_days) validToday = r.repeat_days.includes(todayDay);
                 else validToday = true;
                 
                 if (!validToday) return;

                 let stat = (r.status || 'Upcoming').toLowerCase();
                 if (stat === 'upcoming') counts.Upcoming++;
                 else if (stat === 'active') counts.Active++;
                 else if (stat === 'completed') counts.Completed++;
                 else if (stat === 'missed') counts.Missed++;
                 else counts.Upcoming++;
               });
               
               return (
                 <>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : '#E3F2FD' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#2196F3' }]}>
                      <Ionicons name="time-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: 'bold' }}>Upcoming</Text>
                      <Text style={{ color: theme.text, fontSize: 16 }}>{counts.Upcoming}</Text>
                    </View>
                  </View>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.1)' : '#FFF3E0' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#FF9800' }]}>
                      <Ionicons name="notifications-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: 'bold' }}>Active</Text>
                      <Text style={{ color: theme.text, fontSize: 16 }}>{counts.Active}</Text>
                    </View>
                  </View>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#E8F5E9' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: 'bold' }}>Completed</Text>
                      <Text style={{ color: theme.text, fontSize: 16 }}>{counts.Completed}</Text>
                    </View>
                  </View>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(244, 67, 54, 0.1)' : '#FFEBEE' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#F44336' }]}>
                      <Ionicons name="warning-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: 'bold' }}>Missed</Text>
                      <Text style={{ color: theme.text, fontSize: 16 }}>{counts.Missed}</Text>
                    </View>
                  </View>
                 </>
               );
            })()}
          </View>
        </View>

        {/* --- TODAY'S REMINDERS --- */}
        <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: '#00C853', marginBottom: 15 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Reminders</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/notifications', params: { fromMode: 'gym' } })}>
              <Text style={styles.linkText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // e.g., 'Mon', 'Tue'
            const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay);
            const isWeekend = ['Sat', 'Sun'].includes(todayDay);
            
            const filteredReminders = todayReminders?.filter((r: any) => {
              if (!r.is_enabled) return false;
              
              const type = (r.reminder_type || r.title || '').toLowerCase();
              if (type.includes('breakfast') || type.includes('lunch') || type.includes('dinner') || type.includes('snack') || type.includes('water') || type.includes('health') || type.includes('nutrition')) {
                  return false; // Hide health reminders from Gym dashboard
              }
              
              // Date filtering
              const repeat = r.repeat_type || 'Daily';
              if (repeat === 'Daily') return true;
              if (repeat === 'Weekdays') return isWeekday;
              if (repeat === 'Weekends') return isWeekend;
              if (repeat === 'Custom' && r.repeat_days) {
                return r.repeat_days.includes(todayDay);
              }
              return true; // Fallback
            }) || [];
            
            console.log("Filtered reminders for dashboard:", filteredReminders);
            
            return filteredReminders.map((reminder: any, index: number) => {
              let iconName: any = 'clock-outline';
              let iconColor = '#2196F3';
              let title = reminder.reminder_type || 'Reminder';
              
              switch(reminder.reminder_type?.toLowerCase()) {
                case 'workout': iconName = 'dumbbell'; iconColor = '#9C27B0'; title = 'Workout Reminder'; break;
                case 'breakfast': iconName = 'food-croissant'; iconColor = '#FF9800'; title = 'Breakfast Reminder'; break;
                case 'lunch': iconName = 'silverware-fork-knife'; iconColor = '#4CAF50'; title = 'Lunch Reminder'; break;
                case 'dinner': iconName = 'food-steak'; iconColor = '#F44336'; title = 'Dinner Reminder'; break;
                case 'snack': iconName = 'food-apple'; iconColor = '#FF5252'; title = 'Snack Reminder'; break;
                case 'water': iconName = 'water-drop'; iconColor = '#00BCD4'; title = 'Water Reminder'; break;
                case 'sleep': iconName = 'moon-waning-crescent'; iconColor = '#3F51B5'; title = 'Sleep Reminder'; break;
              }
              
              let status = reminder.status || 'Upcoming';
              if (!status || status.trim() === '') status = 'Upcoming';
              
              const statusColor = status === 'Missed' ? '#F44336' : status === 'Completed' ? '#4CAF50' : status === 'Active' ? '#FF9800' : '#2196F3';
              
              return (
                <View key={index} style={[styles.mealItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.reminderIconBox, { backgroundColor: iconColor + '20' }]}>
                      <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={{flex: 1, marginLeft: 15}}>
                      <Text style={[styles.mealName, {color: theme.text}]}>{title}</Text>
                      <Text style={[styles.mealTime, { color: statusColor }]}>
                        {formatTo12Hour(reminder.reminder_time || reminder.title)}
                      </Text>
                      <Text style={{ color: statusColor, fontSize: 12, marginTop: 2 }}>Status: {status}</Text>
                    </View>
                    <Ionicons name={status === 'Completed' ? "checkmark-circle" : "notifications"} size={20} color={status === 'Completed' ? "#4CAF50" : statusColor} />
                    <TouchableOpacity 
                      style={{ marginLeft: 10 }}
                      onPress={() => {
                        Alert.alert("Delete Reminder", "Are you sure?", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: async () => {
                              await useAppStore.getState().deleteReminder(reminder.id);
                              Alert.alert("Success", "Reminder deleted.");
                          }}
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 }}>
                    {status !== 'Completed' && (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#4CAF50', borderRadius: 4 }}
                        onPress={() => useAppStore.getState().markReminderDone(reminder.id)}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Done</Text>
                      </TouchableOpacity>
                    )}
                    {(status === 'Active' || status === 'Upcoming' || status === 'Snoozed') && (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FF9800', borderRadius: 4 }}
                        onPress={() => useAppStore.getState().snoozeReminder(reminder.id, 10)}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Remind Later</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#757575', borderRadius: 4 }}
                      onPress={() => useAppStore.getState().dismissReminder(reminder.id)}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            });
          })()}

          {(!todayReminders || (() => {
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
            const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay);
            const isWeekend = ['Sat', 'Sun'].includes(todayDay);
            return todayReminders.filter((r: any) => {
              if (!r.is_enabled) return false;
              const repeat = r.repeat_type || 'Daily';
              if (repeat === 'Daily') return true;
              if (repeat === 'Weekdays') return isWeekday;
              if (repeat === 'Weekends') return isWeekend;
              if (repeat === 'Custom' && r.repeat_days) return r.repeat_days.includes(todayDay);
              return true;
            }).length === 0;
          })()) && (
            <View style={{ alignItems: 'center', paddingVertical: 15 }}>
              <Text style={{color: theme.subText, fontSize: 13, fontStyle: 'italic', textAlign: 'center'}}>No reminders for today</Text>
            </View>
          )}
        </View>

        <View style={styles.statRowCompact}>
          <TouchableOpacity 
            style={[styles.compactStat, { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleStepsPress}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
              <Ionicons name="footsteps" size={20} color="#FF9800" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.compactVal, { color: theme.text }]}>{steps}</Text>
              <Text style={[styles.compactLabel, { color: theme.subText }]}>Steps</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.compactStat, { backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderColor: theme.border, borderWidth: 1 }]}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
              <Ionicons name="flame" size={20} color="#F44336" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.compactVal, { color: theme.text }]}>{totalCaloriesBurned}</Text>
              <Text style={[styles.compactLabel, { color: theme.subText }]}>Burned</Text>
            </View>
          </View>
        </View>

        {/* TODAY'S MEALS SECTION */}
        <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: '#00C853' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Meals</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/camera', params: { fromMode: 'gym' } })}>
              <Text style={styles.linkText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {gymMeals.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 15 }}>
              {gymMeals.map((item: any, index: number) => (
                <View key={index} style={[styles.mealItemHorizontal, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.mealThumbLarge} />
                  ) : item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.mealThumbLarge} />
                  ) : (
                    <View style={[styles.mealThumbLarge, { backgroundColor: isDark ? '#333' : '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 28 }}>{item.emoji || '🍽️'}</Text>
                    </View>
                  )}
                  <View style={{ padding: 12 }}>
                    <Text style={[styles.mealNameHorizontal, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.mealTime, { color: theme.subText, marginTop: 4 }]}>{formatTo12Hour(item.time)}</Text>
                    <Text style={styles.mealCalsHorizontal}>{item.calories} kcal</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 15 }}>
              <Text style={{color: theme.subText, fontSize: 13, fontStyle: 'italic', textAlign: 'center'}}>No meals logged today</Text>
            </View>
          )}
        </View>

        {/* PROGRESS CARD */}
        <TouchableOpacity>
          <LinearGradient colors={['#F97316', '#2563EB']} style={styles.transformCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.transformTitle}>Transformation Progress</Text>
              <Text style={styles.transformSub}>Track your muscle gains</Text>
            </View>
            <MaterialCommunityIcons name="chart-timeline-variant" size={32} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* WATER INTAKE CARD */}
        <View style={[styles.waterCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={styles.waterHeaderRow}>
            <View style={styles.waterHeaderLeft}>
              <View style={[styles.waterIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="water" size={20} color="#2196F3" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.waterCardTitle, { color: theme.text }]}>Recommended Water Goal</Text>
                <Text style={[styles.waterCardSubTitle, { color: theme.subText }]}>{waterData.waterIntake} / {waterData.waterGoal} ml</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowWaterModal(true)}>
              <Ionicons name="add-circle-outline" size={24} color="#2196F3" />
            </TouchableOpacity>
          </View>

          <View style={styles.waterProgressContainer}>
            <View style={[styles.waterProgressBarBase, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
              <View 
                style={[
                  styles.waterProgressBarFill, 
                  { 
                    width: `${Math.min(100, (waterData.waterIntake / waterData.waterGoal) * 100)}%`,
                    backgroundColor: '#2196F3'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.waterQuickAddRow}>
            {[250, 500, 750].map(amount => (
              <TouchableOpacity 
                key={amount}
                style={[styles.waterQuickAddBtn, { backgroundColor: isDark ? '#1A2633' : '#E3F2FD' }]}
                onPress={() => addWater(amount)}
              >
                <Text style={[styles.waterQuickAddText, { color: '#2196F3' }]}>+{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.waterFooterText, { color: theme.subText }]}>Based on your age, weight, and activity level.</Text>
        </View>

        {/* MEAL GUIDES (DYNAMIC PROMINENCE) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nutrition Focus</Text>
        </View>
        <View style={[styles.row, { marginBottom: 25 }]}>
          {workoutStatus === 'Completed' ? (
            <>
              {/* Post-Workout first if completed */}
              <TouchableOpacity style={[styles.guideCard, { backgroundColor: theme.card, borderColor: '#2196F3', borderLeftWidth: 4 }]} onPress={() => router.push('/post-workout')}>
                <View style={[styles.iconCircle, {backgroundColor: isDark ? '#2A343D' : '#E3F2FD'}]}><Ionicons name="checkmark-circle-outline" size={20} color="#2196F3" /></View>
                <View>
                  <Text style={[styles.guideTitle, { color: theme.text }]}>Post-Workout</Text>
                  <Text style={{ fontSize: 10, color: theme.subText }}>Recommended Now</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/pre-workout')}>
                <View style={[styles.iconCircle, {backgroundColor: isDark ? '#2E3D31' : '#E8F5E9'}]}><Ionicons name="time-outline" size={20} color="#00C853" /></View>
                <Text style={[styles.guideTitle, { color: theme.text }]}>Pre-Workout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Pre-Workout first if not started */}
              <TouchableOpacity style={[styles.guideCard, { backgroundColor: theme.card, borderColor: '#00C853', borderLeftWidth: 4 }]} onPress={() => router.push('/pre-workout')}>
                <View style={[styles.iconCircle, {backgroundColor: isDark ? '#2E3D31' : '#E8F5E9'}]}><Ionicons name="time-outline" size={20} color="#00C853" /></View>
                <View>
                  <Text style={[styles.guideTitle, { color: theme.text }]}>Pre-Workout</Text>
                  <Text style={{ fontSize: 10, color: theme.subText }}>Fuel Up Now</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/post-workout')}>
                <View style={[styles.iconCircle, {backgroundColor: isDark ? '#2A343D' : '#E3F2FD'}]}><Ionicons name="checkmark-circle-outline" size={20} color="#2196F3" /></View>
                <Text style={[styles.guideTitle, { color: theme.text }]}>Post-Workout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* TODAY'S WORKOUT (OR REST DAY TIPS) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{todayName === 'Sunday' ? "Sunday Recovery" : "Today's Workout"}</Text>
            {todayName !== 'Sunday' && (
              <TouchableOpacity onPress={() => router.push('/plans')}>
                  <Text style={styles.linkText}>View Plan</Text>
              </TouchableOpacity>
            )}
          </View>

          {todayName === 'Sunday' ? (
            <View style={[styles.insightCard, { backgroundColor: '#F1FBF2', borderLeftColor: '#00C853', marginBottom: 0 }]}>
               <View style={styles.insightHeader}>
                  <Ionicons name="sunny-outline" size={20} color="#00C853" />
                  <Text style={[styles.insightTitle, { color: '#333' }]}>Recovery Tips</Text>
               </View>
               <Text style={[styles.insightBody, { color: '#555' }]}>
                  • Focus on mobility and stretching for 15 mins.{"\n"}
                  • Stay hydrated and maintain light activity like walking.{"\n"}
                  • Allow your muscles to repair and grow today.
               </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.orangeCard, workoutStatus === 'Completed' && { backgroundColor: '#00C853' }]}
              onPress={() => router.push({ pathname: '/workout-day-detail', params: { day: todayWorkoutData.day } })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutTitle}>{todayWorkoutData.day}</Text>
                <Text style={styles.workoutSub}>{todayWorkoutData.exercises.length} exercises • {todayWorkoutData.duration}</Text>
                <View style={styles.burnBadge}>
                  <Ionicons name={workoutStatus === 'Completed' ? "checkmark-circle" : "flame"} size={14} color="#FFF" />
                  <Text style={styles.burnText}>
                      {workoutStatus === 'Completed' ? 'Workout Completed' : `Estimated burn: ${todayWorkoutData.calories} kcal`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                  style={styles.whiteBtn} 
                  onPress={() => router.push({ pathname: '/workout-day-detail', params: { day: todayWorkoutData.day } })}
              >
                <Text style={[styles.orangeText, workoutStatus === 'Completed' && { color: '#00C853' }]}>
                  {workoutStatus === 'Completed' ? 'View' : (workoutStatus === 'In Progress' ? 'Resume' : 'Start')}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        {/* SMART INSIGHT */}
        <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.insightHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#FFD700" />
            <Text style={[styles.insightTitle, { color: theme.text }]}>Smart Insight</Text>
          </View>
          <Text style={[styles.insightBody, { color: theme.subText }]}>
            {todayName === 'Sunday' 
               ? "Rest is just as important as training. Enjoy your day!"
               : (workoutStatus === 'Completed' 
                 ? "Workout completed. Focus on recovery and protein." 
                 : (workoutStatus === 'In Progress' ? "Workout in progress. Keep pushing!" : "Start today's workout to stay on track."))}
          </Text>
        </View>

      </ScrollView>

      {/* AI ASSISTANT MODAL */}
      <TouchableOpacity style={styles.floatingAiBtn} onPress={() => setChatVisible(true)}>
        <MaterialCommunityIcons name="message-text" size={28} color="white" />
      </TouchableOpacity>

      <Modal visible={isChatVisible} animationType="slide">
        <SafeAreaView style={[styles.chatContainer, { backgroundColor: theme.chatBg }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                  <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.chatHeaderInfo}>
                  <View style={styles.aiIconCircle}>
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color="#A855F7" />
                  </View>
                  <View>
                    <Text style={styles.chatHeaderText}>AI Assistant</Text>
                    <Text style={styles.chatHeaderSub}>Always here to help</Text>
                  </View>
              </View>
              <TouchableOpacity style={styles.historyBtn} onPress={() => setHistoryVisible(true)}>
                <MaterialCommunityIcons name="history" size={26} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chatBody} contentContainerStyle={{ padding: 20 }}>
              {messages.map((msg: any) => (
                msg.isAi ? (
                  <View key={msg.id} style={[styles.bubble, styles.aiBubble]}>
                    <Text style={[styles.bubbleText, { color: '#333' }]}>{msg.text}</Text>
                    {msg.timestamp && (
                      <Text style={{ fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 4 }}>
                        {msg.timestamp}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View key={msg.id} style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', marginBottom: 15 }}>
                    <View style={[styles.bubble, styles.userBubble, { marginBottom: 0, marginRight: 8 }]}>
                      <Text style={[styles.bubbleText, { color: '#FFF' }]}>{msg.text}</Text>
                      {msg.timestamp && (
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end', marginTop: 4 }}>
                          {msg.timestamp}
                        </Text>
                      )}
                    </View>
                    {userProfile.profileImage ? (
                      <Image source={{ uri: userProfile.profileImage }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14 }}>👤</Text>
                      </View>
                    )}
                  </View>
                )
              ))}
              {isChatLoading && (
                <View style={[styles.bubble, styles.aiBubble, { width: 60, height: 40, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24, lineHeight: 28, color: '#999' }}>...</Text>
                </View>
              )}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput 
                style={[styles.textInput, isChatLoading && { opacity: 0.5 }]} 
                placeholder={isChatLoading ? "AI is thinking..." : "Ask me anything..."} 
                value={chatInput} 
                onChangeText={setChatInput} 
                placeholderTextColor="#999" 
                editable={!isChatLoading}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: (chatInput.trim().length > 0 && !isChatLoading) ? '#A855F7' : '#D1A3FF' }]} 
                onPress={handleSendMessage}
                disabled={chatInput.trim().length === 0 || isChatLoading}
              >
                <Ionicons name={isChatLoading ? "ellipsis-horizontal" : "send-sharp"} size={20} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal visible={isHistoryVisible} animationType="slide" transparent>
        <View style={styles.historyOverlay}>
          <View style={[styles.historyContent, { backgroundColor: theme.card }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: theme.text }]}>Chat History</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyList}>
              {chatHistory.length > 0 ? (
                chatHistory.map((item) => (
                  <View key={item.id} style={[styles.historyItem, { borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyQuestion, { color: theme.text }]} numberOfLines={1}>Q: {item.question}</Text>
                      <Text style={styles.historyAnswer} numberOfLines={2}>{item.answer}</Text>
                      <Text style={styles.historyDate}>{item.createdAt}</Text>
                    </View>
                    <TouchableOpacity 
                      style={{ padding: 10, marginLeft: 10 }}
                      onPress={() => {
                        Alert.alert("Delete Chat", "Remove this chat from history?", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: async () => {
                            const newHistory = chatHistory.filter(h => h.id !== item.id);
                            setChatHistory(newHistory);
                            await AsyncStorage.setItem('gym_chat_history_list', JSON.stringify(newHistory));
                            // Also try to delete from backend if possible
                            try {
                              await apiService.deleteChatHistoryItem(item.id);
                            } catch(e) {}
                          }}
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyHistory}>No history yet.</Text>
              )}
            </ScrollView>

            <View style={styles.historyFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearChatHistory}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- WATER MODAL --- */}
      <Modal visible={showWaterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Water Intake</Text>
            <Text style={[styles.waterModalSub, { color: theme.subText }]}>Enter custom amount in ml</Text>
            <TextInput 
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              keyboardType="numeric"
              value={waterInputVal}
              onChangeText={setWaterInputVal}
              placeholder="e.g. 300"
              placeholderTextColor="#999"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWaterModal(false)}>
                <Text style={{ color: '#777' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtnModal, { backgroundColor: '#2196F3' }]} 
                onPress={() => {
                  const val = parseInt(waterInputVal) || 0;
                  if (val > 0) addWater(val);
                  setWaterInputVal('');
                  setShowWaterModal(false);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MANUAL STEPS MODAL --- */}
      <Modal visible={showManualSteps} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Manual Step Entry</Text>
            <Text style={[styles.waterModalSub, { color: theme.subText }]}>Enter your steps for today</Text>
            <TextInput 
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              keyboardType="numeric"
              value={manualStepsVal}
              onChangeText={setManualStepsVal}
              placeholder="e.g. 5000"
              placeholderTextColor="#999"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowManualSteps(false)}>
                <Text style={{ color: '#777' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtnModal, { backgroundColor: '#FF9800' }]} 
                onPress={() => {
                  const val = parseInt(manualStepsVal) || 0;
                  updateSteps(val);
                  setShowManualSteps(false);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  reminderIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reminderStatusBox: { flex: 1, minWidth: '45%', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  statusIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 10 },
  greeting: { fontSize: 26, fontWeight: 'bold' },
  subGreeting: { fontSize: 14 },
  notifBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF5252', borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  statCard: { width: '48%', borderRadius: 24, padding: 18, elevation: 4 },
  statLabel: { color: '#FFF', fontSize: 12, opacity: 0.85, fontWeight: '600' },
  statValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginVertical: 4 },
  statSubText: { color: '#FFF', fontSize: 11, opacity: 0.9 },
  animationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lottie: { width: 300, height: 300 },
  welcomeText: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginTop: 20, letterSpacing: 2 },
  welcomeSub: { color: '#FFFFFF', fontSize: 16, opacity: 0.9, marginTop: 5 },
  transformCard: { backgroundColor: '#A855F7', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  transformTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  transformSub: { color: '#FFF', opacity: 0.9, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  guideCard: { width: '48%', borderRadius: 20, padding: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  guideTitle: { fontWeight: 'bold', fontSize: 13 },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#00C853', fontWeight: 'bold' },
  orangeCard: { backgroundColor: '#FF6D00', borderRadius: 25, padding: 22, flexDirection: 'row', alignItems: 'center' },
  workoutTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  workoutSub: { color: '#FFF', opacity: 0.8, marginBottom: 8 },
  burnBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  burnText: { color: '#FFF', fontSize: 11, marginLeft: 5, fontWeight: '600' },
  whiteBtn: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  orangeText: { color: '#FF6D00', fontWeight: 'bold' },
  insightCard: { borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderLeftWidth: 5, borderLeftColor: '#FFD700' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  insightTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  insightBody: { fontSize: 14, lineHeight: 20 },
  mealItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  mealName: { fontSize: 16, fontWeight: 'bold' },
  mealTime: { fontSize: 12, color: '#777' },
  mealThumb: { width: 40, height: 40, borderRadius: 10 },
  mealCals: { fontSize: 14, color: '#00C853', fontWeight: 'bold' },
  mealItemHorizontal: { width: 140, borderRadius: 16, overflow: 'hidden' },
  mealThumbLarge: { width: '100%', height: 100, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  mealNameHorizontal: { fontSize: 14, fontWeight: 'bold' },
  mealCalsHorizontal: { fontSize: 12, color: '#00C853', fontWeight: 'bold', marginTop: 4 },
  floatingAiBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#A855F7', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  chatContainer: { flex: 1 },
  chatHeader: { backgroundColor: '#A855F7', padding: 20, flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : 20 },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  aiIconCircle: { backgroundColor: '#FFF', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatHeaderText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  chatHeaderSub: { color: '#FFF', opacity: 0.8, fontSize: 12 },
  chatBody: { flex: 1 },
  bubble: { padding: 15, borderRadius: 20, marginBottom: 15, maxWidth: '85%' },
  aiBubble: { backgroundColor: '#F0F0F0', borderTopLeftRadius: 0, alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#A855F7', borderTopRightRadius: 0, alignSelf: 'flex-end' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  chatInputRow: { flexDirection: 'row', padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FFF' },
  textInput: { flex: 1, height: 50, backgroundColor: '#F5F5F5', borderRadius: 25, paddingHorizontal: 20, fontSize: 15 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
  historyBtn: { marginLeft: 'auto', padding: 5 },
  historyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  historyContent: { height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 22, fontWeight: 'bold' },
  historyList: { flex: 1 },
  historyItem: { paddingVertical: 15, borderBottomWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyQuestion: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  historyAnswer: { fontSize: 14, color: '#777', lineHeight: 20 },
  historyDate: { fontSize: 11, color: '#AAA', marginTop: 8 },
  emptyHistory: { textAlign: 'center', color: '#AAA', marginTop: 50, fontSize: 16 },
  historyFooter: { paddingTop: 20, borderTopWidth: 1, borderTopColor: '#EEE' },
  clearBtn: { backgroundColor: '#FF5252', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  clearText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 25, borderRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 10, marginRight: 15 },
  saveBtnModal: { backgroundColor: '#00C853', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },

  // NEW UI STYLES
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 15 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#004D40', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarLetter: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  welcomeTextColumn: { justifyContent: 'center' },
  welcomeSmall: { fontSize: 13, fontWeight: '500' },
  userNameBold: { fontSize: 22, fontWeight: '900' },
  badgePremium: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF5252', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 4, elevation: 4, shadowColor: '#FF5252', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3 },
  badgePremiumText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  premiumBellContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  nextReminderChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  nextReminderText: { fontSize: 13, fontWeight: '600' },
  bellPill: { flexDirection: 'row', alignItems: 'center', height: 42, paddingHorizontal: 15, borderRadius: 21, borderWidth: 1, position: 'relative' },
  notifDotPill: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5252' },

  calendarWrapper: { paddingBottom: 10 },
  calendarScroll: { paddingHorizontal: 15 },
  calendarDayCard: { alignItems: 'center', marginHorizontal: 5, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  calDayName: { fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  calDayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  calDayNum: { fontSize: 16, fontWeight: 'bold' },
  calTodayActive: { backgroundColor: '#00C853' },

  gaugeCard: { borderRadius: 30, padding: 22, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  gaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  gaugeTitle: { fontSize: 22, fontWeight: 'bold' },
  gaugeWrapper: { height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  segmentsRow: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  gaugeSegment: { position: 'absolute', width: 28, height: 10, borderRadius: 4 },
  gaugeCenter: { alignItems: 'center', marginTop: 40 },
  remainingValue: { fontSize: 42, fontWeight: 'bold', marginTop: 2 },
  remainingLabel: { fontSize: 14, opacity: 0.7 },

  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  macroCard: { width: '31%', borderRadius: 22, padding: 15, alignItems: 'center', justifyContent: 'center' },
  macroGradientCard: { width: '31%', borderRadius: 22, padding: 15, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  macroValue: { fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  macroLabel: { fontSize: 10, opacity: 0.7, marginTop: 2 },

  statRowCompact: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  compactStat: { width: '48%', borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  compactVal: { fontSize: 20, fontWeight: 'bold' },
  compactLabel: { fontSize: 13, opacity: 0.7, marginTop: 4 },

  waterCard: { width: '100%', borderRadius: 25, padding: 20, marginBottom: 20 },
  waterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  waterHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  waterIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifModalContent: { width: '90%', borderRadius: 24, padding: 20, maxHeight: '80%' },
  notifModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  notifModalTitle: { fontSize: 20, fontWeight: 'bold' },
  notifItemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  notifIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifItemTitle: { fontSize: 16, fontWeight: 'bold' },
  notifItemTime: { fontSize: 13, marginTop: 2 },
  waterCardTitle: { fontSize: 14, fontWeight: 'bold' },
  waterCardSubTitle: { fontSize: 13, marginTop: 2 },
  waterProgressContainer: { marginBottom: 20 },
  waterProgressBarBase: { height: 12, borderRadius: 6, overflow: 'hidden' },
  waterProgressBarFill: { height: '100%', borderRadius: 6 },
  waterQuickAddRow: { flexDirection: 'row', justifyContent: 'space-between' },
  waterQuickAddBtn: { width: '31%', height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  waterQuickAddText: { fontWeight: 'bold', fontSize: 14 },
  waterModalSub: { fontSize: 14, marginBottom: 20 },
  waterFooterText: { fontSize: 11, marginTop: 15, textAlign: 'center', opacity: 0.7 },
});