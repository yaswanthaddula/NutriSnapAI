import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Modal,
  TextInput,
  Image,
  Alert,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Platform as RNPlatform } from 'react-native';
const LottieView = RNPlatform.OS !== 'web' ? require('lottie-react-native').default : null;
import { useTheme } from '../_layout';
import useAppStore from '../../src/store/useAppStore';
import { getAvatarColor } from '../../src/utils/avatarUtils';
import { calculateMealTotals, formatTo12Hour } from '../../src/utils/calculations';
import { chatWithAi } from '../../src/services/chatGeminiService';
import { Pedometer } from 'expo-sensors';
import { LayoutAnimation, UIManager, Platform as RNPlatform2 } from 'react-native';

if (RNPlatform2.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { KeyboardAvoidingView } from 'react-native';
import apiService from '../../src/services/apiService';
import { notificationService } from '../../src/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WELLNESS_TIPS = [
  "Drink more water today for better skin and energy.",
  "A short walk after meals improves digestion naturally.",
  "Sleep before 11PM for better muscle recovery.",
  "Healthy habits build long-term results. Start small!",
  "Small progress every day matters. Keep it up!",
  "Try adding more fiber to your next meal.",
  "Taking a deep breath can reduce stress instantly."
];

export default function HealthHomeScreen() {
  const params = useLocalSearchParams();
  const { isDark } = useTheme();

  // 1. GLOBAL STATE
  const { 
    userProfile, meals, steps, caloriesBurned, updateSteps, 
    loadStoredData, saveStoredData, waterData, addWater,
    streak, todayMood, setMood, todaySleep, setSleep, updateStreak,
    notifications, notificationPrefs, reminderStatuses, fetchTodayReminders, todayReminders, reminders, checkNewDay, markAllAsRead
  } = useAppStore();

  const unreadCount = notifications.filter((n: any) => {
    if (n.isRead || n.status === 'cleared') return false;
    const isHealth = n.type?.match(/meal|breakfast|lunch|dinner|snack|water|medicine|pill|sleep|recover|insight|bmi/i) || n.title?.match(/meal|breakfast|lunch|dinner|snack|water|medicine|pill|sleep|recover|insight|bmi/i);
    return isHealth;
  }).length;

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
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [manualStepsVal, setManualStepsVal] = useState(steps.toString());
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [sleepVal, setSleepVal] = useState(todaySleep.toString());
  const [dailyTip, setDailyTip] = useState('');
  
  // AI Chat State
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [isChatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: `Hi ${userProfile.name}! I'm your AI Wellness Coach. How can I help you reach your health goals today?`, isAi: true }
  ]);
  const [showWelcome, setShowWelcome] = useState(true);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const bellShakeAnim = React.useRef(new Animated.Value(0)).current;

  // 2. SYNC NAME AND MEAL DATA
  useEffect(() => {
    // Trigger animations on mount
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
    loadStoredData();
    subscribePedometer();
    syncBackendMeals();
    loadChatHistory();
    // Check for notifications
    notificationService.checkAndGenerate();
    
    // Set daily tip
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    let tip = WELLNESS_TIPS[dayOfYear % WELLNESS_TIPS.length];
    
    if (todayMood === 'Low') tip = "Try some gentle stretching or a 5-minute meditation to lift your spirits.";
    else if (todayMood === 'Great') tip = "Channel this positive energy into your most challenging goal today!";
    else if (waterData.waterIntake < 1000) tip = "Your hydration is a bit low. A glass of water now could boost your focus.";
    else if (steps < 3000 && new Date().getHours() > 14) tip = "How about a quick 10-minute walk to get those steps up?";

    setDailyTip(tip);
    
    // Update streak logic
    updateStreak();
    
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Refresh data on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log("Health Home Focused - Refreshing data...");
      checkNewDay(); // <--- ADDED: Check and reset daily stats automatically
      syncBackendMeals();
      loadChatHistory();
      if (fetchTodayReminders) fetchTodayReminders();
    }, [])
  );

  const syncBackendMeals = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      console.log("Today date:", todayStr);
      
      const backendMeals = await apiService.getTodayMeals();
      console.log("Fetched today meals:", backendMeals);
      
      let mealImagesCache: any = {};
      try {
        const cacheStr = await AsyncStorage.getItem('nutrisnap_meal_images');
        if (cacheStr) mealImagesCache = JSON.parse(cacheStr);
      } catch(e) {}

       if (backendMeals) {
        // Filter and Map backend format to frontend format
        // Handle cases where mode might be null/missing by default as 'health'
        const currentStoreMeals = useAppStore.getState().meals;
        const currentTodayMeals = currentStoreMeals.filter((m: any) => m.date === todayStr && m.mode === 'health');
        const healthBackendMeals = backendMeals.filter((bm: any) => !bm.mode || bm.mode === 'health');

        const formattedMeals = healthBackendMeals.map((bm: any) => {
          const formattedTime = bm.time ? bm.time.slice(0, 5) : '00:00';
          const localMatch = currentTodayMeals.find((lm: any) => 
            lm.name === bm.food_name && lm.time === formattedTime
          );
          
          const cacheKey = `${bm.food_name}_${formattedTime}`;
          const cachedImage = mealImagesCache[cacheKey];

          return {
            id: bm.id,
            name: bm.food_name || bm.name || 'Unknown Food',
            calories: bm.calories,
            protein: bm.protein,
            carbs: bm.carbs,
            fat: bm.fat,
            quantity: bm.quantity,
            unit: bm.unit,
            emoji: localMatch?.emoji || '🍽️',
            imageUri: bm.meal_image_url || localMatch?.imageUri || cachedImage || bm.image_url || null,
            mode: 'health',
            time: formattedTime,
            date: bm.date
          };
        });
        
        // Merge with local meals, replacing only today's health meals
        const otherMeals = currentStoreMeals.filter((m: any) => !(m.date === todayStr && m.mode === 'health'));
        useAppStore.getState().setMeals([...formattedMeals, ...otherMeals]);
        await saveStoredData();
      }
    } catch (error) {
      console.log("Backend meal fetch failed in Health Home, using local only");
    }
  };

  useEffect(() => {
    const syncHealthLog = async () => {
      try {
        await apiService.saveHealthLog({
          water_intake_ml: waterData.waterIntake,
          water_goal_ml: waterData.waterGoal,
          sleep_hours: todaySleep,
          mood: todayMood,
          steps: steps,
          calories_burned: caloriesBurned,
          health_tip: dailyTip
        });
      } catch (e) {
        console.log("Failed to sync health log:", e);
      }
    };
    if (userProfile.id) syncHealthLog();
  }, [waterData.waterIntake, todaySleep, todayMood, steps, caloriesBurned]);

  useEffect(() => {
    // Only for web fallback
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    
    let lastStepTime = 0;
    const handleMotion = (event: any) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
      // Average gravity is ~9.8. A spike above 11.5 usually indicates a step in pocket or hand.
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
    setIsPedometerAvailable(isAvailable ? 'available' : 'unavailable');

    if (isAvailable) {
      // Capture steps currently in store as a base for this session
      const initialSteps = useAppStore.getState().steps;
      
      try {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        // This often fails on Android for date ranges, so we catch it
        const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
        if (pastStepCountResult) {
          updateSteps(pastStepCountResult.steps);
        }
      } catch (error) {
        // Android fallback: watchStepCount will still provide increments since app start
        console.log("Historical step fetch not supported, using real-time tracking.");
      }

      return Pedometer.watchStepCount(result => {
        // result.steps is steps since this listener started
        updateSteps(initialSteps + result.steps);
      });
    }
  };

  useEffect(() => {
    // Sync New Scanned Meal
    if (params.newMealName) {
      const newEntry = {
        id: Date.now(),
        name: String(params.newMealName),
        calories: parseInt(String(params.newMealCalories)),
        emoji: String(params.newMealEmoji),
        mode: 'health', // Added mode
        time: String(params.mealTimestamp)
      };
      
      const exists = useAppStore.getState().meals.find((m: any) => m.time === newEntry.time && m.name === newEntry.name);
      if (!exists) {
        useAppStore.getState().addMeal(newEntry);
        saveStoredData();
      }
    }
  }, [params.newMealName, params.mealTimestamp]);

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

  const handleManualSleep = () => {
    const h = parseFloat(sleepVal) || 0;
    setSleep(h);
    saveStoredData();
    setShowSleepModal(false);
  };

  const handleSendMessage = async () => {
    if (chatInput.trim() === '') return;
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    const userMsg = { id: Date.now(), text: chatInput, isAi: false, timestamp: timeStr };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      const aiResponse = await chatWithAi(currentInput, messages);
      const aiMsg = { id: Date.now() + 1, text: aiResponse, isAi: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() };
      setMessages(prev => [...prev, aiMsg]);

      // Save current session history to AsyncStorage
      AsyncStorage.setItem('health_chat_session', JSON.stringify([...messages, userMsg, aiMsg])).catch(e => console.warn("Failed to save chat session", e));
      
      // Save to History List
      saveChatHistoryItem(currentInput, aiResponse);
      
      // Save to Backend
      const payload = {
        mode: 'health',
        question: currentInput,
        answer: aiResponse
      };
      console.log("Saving AI chat:", payload);
      apiService.saveChatHistory(payload).catch(e => console.log("Backend chat save failed:", e));
    } catch (error: any) {
      const errorMsg = { 
        id: Date.now() + 1, 
        text: error.message || "Wellness coach is busy. Try again soon!", 
        isAi: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      // 1. Fetch from Backend (Source of truth)
      console.log("Fetching AI chat history for mode: health");
      const backendHistory = await apiService.getChatHistory('health');
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
        await AsyncStorage.setItem('health_chat_history_list', JSON.stringify(formattedHistory));
        return;
      }

      // 2. Fallback to local storage
      const stored = await AsyncStorage.getItem('health_chat_history_list');
      if (stored) {
        setChatHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load chat history", e);
      // Fallback to local storage on error
      const stored = await AsyncStorage.getItem('health_chat_history_list');
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
        createdAt: new Date().toLocaleString(),
      };
      const updatedHistory = [newItem, ...chatHistory];
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem('health_chat_history_list', JSON.stringify(updatedHistory));
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
              await apiService.clearChatHistory('health');
              setChatHistory([]);
              await AsyncStorage.removeItem('health_chat_history_list');
            }
          }
        ]
      );
    } catch (e) {
      console.warn("Failed to clear chat history", e);
    }
  };

  // 4. DATA FILTERING & CALCULATIONS
  const todayDateObj = new Date();
  const today = todayDateObj.toISOString().split('T')[0];

  const hour = todayDateObj.getHours();
  let greetingTitle = '';
  let greetingSub = '';
  if (hour < 12) {
    greetingTitle = `☀️ Good Morning, ${userProfile.name} 👋`;
    greetingSub = 'Start your day with healthy choices.';
  } else if (hour < 17) {
    greetingTitle = `🌤 Good Afternoon, ${userProfile.name} 👋`;
    greetingSub = 'Stay active and keep your energy high.';
  } else if (hour < 21) {
    greetingTitle = `🌆 Good Evening, ${userProfile.name} 👋`;
    greetingSub = 'Stay consistent and finish strong today.';
  } else {
    greetingTitle = `🌙 Good Night, ${userProfile.name} 👋`;
    greetingSub = 'Rest well and be ready for tomorrow.';
  }

  const filteredMeals = meals.filter((m: any) => 
    m.mode === 'health' && 
    (m.date === today || !m.date) // Handle legacy meals without date
  );

  const themeColors = {
    bg: 'transparent',
    card: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? 'rgba(255,255,255,0.7)' : '#7D8592',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  };

  const { totalCalories, totalProtein, totalCarbs, totalFats } = calculateMealTotals(filteredMeals);
  
  // Real Profile Targets + Macro Fallback Logic
  const calorieTarget = userProfile.calorieTarget || 2000;
  const proteinTarget = userProfile.proteinTarget || 100;

  const getMealType = (timeStr: string) => {
    if (!timeStr) return 'Snack';
    const [h] = timeStr.split(':');
    const hour = parseInt(h);
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 15) return 'Lunch';
    if (hour >= 15 && hour < 19) return 'Snack';
    return 'Dinner';
  };
  const fatsTarget = userProfile.fatsTarget || (calorieTarget * 0.25) / 9;
  const carbsTarget = userProfile.carbsTarget || (calorieTarget - (proteinTarget * 4) - (fatsTarget * 9)) / 4;

  const caloriesLeft = Math.max(0, calorieTarget - totalCalories);
  const proteinLeft = Math.max(0, Math.round(proteinTarget - totalProtein));
  const carbsLeft = Math.max(0, Math.round(carbsTarget - totalCarbs));
  const fatsLeft = Math.max(0, Math.round(fatsTarget - totalFats));
  
  // Real BMI Calculation
  const heightM = userProfile.height / 100;
  const realBmi = heightM > 0 ? (userProfile.weight / (heightM * heightM)).toFixed(1) : '0.0';
  
  // Wellness Coach Logic
  const getCoachAdvice = () => {
    if (todayMood === 'Low') return "Take a short break and breathe.";
    if (waterData.waterIntake < waterData.waterGoal * 0.5) return "Drink 2 more glasses of water.";
    if (steps < 5000 && new Date().getHours() > 12) return "Take a 10-minute walk.";
    if (totalProtein < proteinTarget * 0.4 && totalCalories > 0) return "Add a protein-rich snack.";
    if (totalCalories > calorieTarget) return "Keep dinner light tonight.";
    if (todayMood === 'Great') return "You're doing great! Keep up the momentum.";
    return "Maintain your healthy habits!";
  };

  // Plate Balance Logic
  const getPlateBalance = () => {
    if (totalCalories === 0) return "Start logging meals";
    const pPct = (totalProtein * 4) / totalCalories;
    const cPct = (totalCarbs * 4) / totalCalories;
    const fPct = (totalFats * 9) / totalCalories;
    
    if (pPct < 0.15) return "Low Protein";
    if (cPct > 0.6) return "High Carb";
    if (fPct > 0.35) return "High Fat";
    if (totalCalories > 800) return "Needs Vegetables";
    return "Balanced";
  };

  const getSleepStatus = () => {
    if (todaySleep === 0) return "No sleep data yet";
    if (todaySleep < 5) return "Poor";
    if (todaySleep <= 7) return "Average";
    return "Good";
  };


  
  // Calendar Data
  const calendarDays = [];
  const todayDate = new Date();
  const startOfWeek = new Date();
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay()); // Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    calendarDays.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: i + 1, // Sun=1, Mon=2, etc.
      isToday: d.toDateString() === todayDate.toDateString(),
    });
  }

  // Gauge segments
  const segments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const progress = Math.min(1, totalCalories / calorieTarget);
  const filledSegments = Math.round(progress * segments.length);

  return (
    <LinearGradient
      colors={isDark ? ['#0F172A', '#1E293B'] : ['#E0F7FA', '#FFFFFF']}
      style={styles.container}
    >
     <SafeAreaView style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      
      {/* WELCOME ANIMATION MODAL */}
      <Modal visible={showWelcome} transparent={false} animationType="fade">
        <View style={[styles.animationContainer, { backgroundColor: '#00C853' }]}>
          {LottieView ? (
            <LottieView
              autoPlay
              loop
              style={styles.lottie}
              source={require('../../assets/animations/health-mode-welcome.json')} 
            />
          ) : (
            <Text style={{ fontSize: 80, marginBottom: 20 }}>🥗</Text>
          )}
          <Text style={styles.welcomeText}>HEALTH MODE</Text>
          <Text style={styles.welcomeSub}>Your journey to wellness starts here, {userProfile.name}!</Text>
        </View>
      </Modal>

      {/* MANUAL STEPS MODAL */}
      <Modal visible={showManualSteps} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Set Manual Steps</Text>
            <TextInput 
              style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border }]}
              keyboardType="numeric"
              value={manualStepsVal}
              onChangeText={setManualStepsVal}
              placeholder="Enter steps..."
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowManualSteps(false)}>
                <Text style={{ color: '#777' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnModal} onPress={handleManualSteps}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MANUAL SLEEP MODAL */}
      <Modal visible={showSleepModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Log Sleep Hours</Text>
            <TextInput 
              style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border }]}
              keyboardType="numeric"
              value={sleepVal}
              onChangeText={setSleepVal}
              placeholder="Enter hours (e.g. 7.5)..."
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSleepModal(false)}>
                <Text style={{ color: '#777' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnModal} onPress={handleManualSleep}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATION MODAL */}
      <Modal visible={showNotificationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.notifModalContent, { backgroundColor: themeColors.card }]}>
            <View style={styles.notifModalHeader}>
              <Text style={[styles.notifModalTitle, { color: themeColors.text }]}>Today's Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {(() => {
                const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay);
                const isWeekend = ['Sat', 'Sun'].includes(todayDay);
                
                const filteredReminders = todayReminders?.filter((r: any) => {
                  if (!r.is_enabled) return false;
                  
                  const isHealth = ['breakfast', 'lunch', 'dinner', 'snack', 'water', 'sleep', 'nutrition'].includes((r.reminder_type || '').toLowerCase());
                  if (!isHealth && !r.title?.toLowerCase().includes('health')) return false;

                  const repeat = r.repeat_type || 'Daily';
                  if (repeat === 'Daily') return true;
                  if (repeat === 'Weekdays') return isWeekday;
                  if (repeat === 'Weekends') return isWeekend;
                  if (repeat === 'Custom' && r.repeat_days) return r.repeat_days.includes(todayDay);
                  return true;
                }) || [];

                if (filteredReminders.length === 0) {
                  return <Text style={{ color: themeColors.subText, textAlign: 'center', marginTop: 20 }}>No reminders for today.</Text>;
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
                    <View key={idx} style={[styles.notifItemCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: themeColors.border }]}>
                      <View style={[styles.notifIconCircle, { backgroundColor: status === 'Completed' ? 'rgba(76, 175, 80, 0.1)' : (status === 'Missed' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)') }]}>
                         <Text style={{ fontSize: 20 }}>{r.title?.includes('Breakfast') ? '🍳' : r.title?.includes('Lunch') ? '🥗' : r.title?.includes('Dinner') ? '🍽️' : r.title?.includes('Water') ? '💧' : r.title?.includes('Workout') ? '🏋️' : '🔔'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.notifItemTitle, { color: themeColors.text }]}>{r.title || r.reminder_type}</Text>
                        <Text style={[styles.notifItemTime, { color: themeColors.subText }]}>{r.reminder_time}</Text>
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

      {/* --- PREMIUM HEADER --- */}
      <View style={[styles.topHeader, { backgroundColor: themeColors.bg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={styles.userInfoRow}>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarCircle}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: getAvatarColor(userProfile.name), borderWidth: 0 }]}>
                <Text style={styles.avatarLetter}>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.welcomeTextColumn}>
            <Text style={[styles.welcomeSmall, { color: themeColors.subText, fontSize: 16, fontWeight: '700' }]}>Health Dashboard</Text>
            <Text style={[styles.userNameBold, { color: themeColors.text, fontSize: 18 }]}>{greetingTitle}</Text>
            <Text style={[styles.welcomeSmall, { color: themeColors.subText, marginTop: 2, fontSize: 13 }]}>Start your day with healthy choices.</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

            <TouchableOpacity 
              style={styles.notifBtn} 
              onPress={() => router.push({ pathname: '/notification-center', params: { fromMode: 'health' } })}
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
                <MaterialCommunityIcons name="bell-outline" size={24} color={isDark ? '#FFF' : '#2E7D32'} />
              </Animated.View>
              {unreadCount > 0 && (
                <View style={[styles.badgePremium, { right: -4, top: -4, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0 }]}>
                   <Text style={[styles.badgePremiumText, { fontSize: 9, textAlign: 'center' }]}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
        </View>
      </View>

      {/* --- WEEKLY CALENDAR --- */}
      <View style={[styles.calendarWrapper, { backgroundColor: themeColors.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
          {calendarDays.map((d, i) => (
            <View key={i} style={[styles.calendarDayCard, { backgroundColor: isDark ? '#1E1E1E' : '#F8FBF9', borderColor: d.isToday ? '#00C853' : (isDark ? '#333' : '#F0F0F0') }]}>
              <Text style={[styles.calDayName, { color: themeColors.subText }]}>{d.dayName}</Text>
              <View style={[styles.calDayCircle, d.isToday && styles.calTodayActive]}>
                <Text style={[styles.calDayNum, d.isToday ? { color: '#FFF' } : { color: themeColors.text }]}>{d.dayNum}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* --- PREMIUM CALORIES GAUGE CARD --- */}
        <View style={[styles.gaugeCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.gaugeHeader}>
            <Text style={[styles.gaugeTitle, { color: themeColors.text }]}>Calories</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(health-tabs)/camera', params: { fromMode: 'health' } })}>
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
              <Text style={[styles.remainingValue, { color: themeColors.text }]}>{caloriesLeft}</Text>
              <Text style={[styles.remainingLabel, { color: themeColors.subText }]}>Remaining kcal</Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={[styles.macroCard, { backgroundColor: isDark ? '#1A2E22' : '#F1FBF2' }]}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#00C853" />
              <Text style={[styles.macroValue, { color: themeColors.text }]}>{proteinLeft}g</Text>
              <Text style={[styles.macroLabel, { color: themeColors.subText }]}>Protein Left</Text>
            </View>
            <View style={[styles.macroCard, { backgroundColor: isDark ? '#2E241A' : '#FFF8F1' }]}>
              <MaterialCommunityIcons name="fire" size={24} color="#FF9800" />
              <Text style={[styles.macroValue, { color: themeColors.text }]}>{fatsLeft}g</Text>
              <Text style={[styles.macroLabel, { color: themeColors.subText }]}>Fats Left</Text>
            </View>
            <View style={[styles.macroCard, { backgroundColor: isDark ? '#1A2633' : '#F1F7FB' }]}>
              <MaterialCommunityIcons name="bowl-mix-outline" size={24} color="#2196F3" />
              <Text style={[styles.macroValue, { color: themeColors.text }]}>{carbsLeft}g</Text>
              <Text style={[styles.macroLabel, { color: themeColors.subText }]}>Carbs Left</Text>
            </View>
          </View>
        </View>

        {/* --- OTHER STATS: WATER, STEPS, BURNED --- */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]} 
          onPress={() => {
            addWater(250);
            notificationService.triggerEventNotification('water-low');
            notificationService.triggerEventNotification('water-goal');
          }}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                <Ionicons name="water" size={20} color="#2196F3" />
              </View>
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>Water</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{Math.floor(waterData.waterIntake / 250)}<Text style={{fontSize:16, color:themeColors.subText}}>/{Math.round(waterData.waterGoal / 250)}</Text></Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>glasses today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={handleStepsPress}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                <MaterialCommunityIcons name="shoe-print" size={20} color="#FF9800" />
              </View>
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>Steps</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{steps}</Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>Goal: 10,000</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 82, 82, 0.1)' }]}>
                <Ionicons name="flame" size={20} color="#FF5252" />
              </View>
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>Burned</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{caloriesBurned}</Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>kcal today</Text>
          </View>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/progress')}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={20} color="#9C27B0" />
              </View>
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>BMI</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{realBmi}</Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>{userProfile.bmiStatus || 'Calculating...'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/profile-edit')}
          >
            <View style={styles.cardTop}>
              <Ionicons name="body" size={18} color="#00BCD4" />
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>Weight</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{userProfile.weight}</Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>kg current</Text>
          </TouchableOpacity>
          
          <View style={{ width: '48%' }} /> 
        </View>

        {/* --- REMINDER STATUS SUMMARY --- */}
        <View style={[styles.mainCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, marginBottom: 15 }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 10 }]}>Reminder Status</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(() => {
               const counts = { Upcoming: 0, Active: 0, Completed: 0, Dismissed: 0 };
               
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
                 else if (stat === 'dismissed' || stat === 'missed') counts.Dismissed++;
                 else counts.Upcoming++;
               });
               
               return (
                 <>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : '#E3F2FD' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#2196F3' }]}>
                      <Ionicons name="time-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>Upcoming</Text>
                      <Text style={{ color: themeColors.text, fontSize: 16 }}>{counts.Upcoming}</Text>
                    </View>
                  </View>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.1)' : '#FFF3E0' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#FF9800' }]}>
                      <Ionicons name="notifications-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>Active</Text>
                      <Text style={{ color: themeColors.text, fontSize: 16 }}>{counts.Active}</Text>
                    </View>
                  </View>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#E8F5E9' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>Completed</Text>
                      <Text style={{ color: themeColors.text, fontSize: 16 }}>{counts.Completed}</Text>
                    </View>
                  </View>
                  <View style={[styles.reminderStatusBox, { backgroundColor: isDark ? 'rgba(244, 67, 54, 0.1)' : '#FFEBEE' }]}>
                    <View style={[styles.statusIconCircle, { backgroundColor: '#F44336' }]}>
                      <Ionicons name="warning-outline" size={20} color="#FFF" />
                    </View>
                    <View>
                      <Text style={{ color: themeColors.text, fontWeight: 'bold' }}>Dismissed</Text>
                      <Text style={{ color: themeColors.text, fontSize: 16 }}>{counts.Dismissed}</Text>
                    </View>
                  </View>
                 </>
               );
            })()}
          </View>
        </View>

        {/* --- TODAY'S REMINDERS --- */}
        <View style={[styles.mainCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, marginBottom: 15 }]}>
          <View style={styles.mainCardHeader}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Today's Reminders</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/notifications', params: { fromMode: 'health' } })} style={styles.scanBtn}>
               <Ionicons name="settings-outline" size={20} color="#00C853" />
               <Text style={styles.scanText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
            const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay);
            const isWeekend = ['Sat', 'Sun'].includes(todayDay);
            
            const filteredReminders = todayReminders?.filter((r: any) => {
              if (!r.is_enabled) return false;
              
              const type = (r.reminder_type || r.title || '').toLowerCase();
              const healthAllowed = ['breakfast', 'lunch', 'dinner', 'snack', 'water', 'medicine', 'sleep', 'bmi', 'health', 'nutrition', 'tips'];
              const isHealth = healthAllowed.some(kw => type.includes(kw));
              if (!isHealth) return false; // Strictly Health Dashboard
              
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
              
              const statusColors = {
                'Completed': { bg: '#E8F5E9', text: '#4CAF50', dot: '#4CAF50' },
                'Upcoming': { bg: '#E3F2FD', text: '#2196F3', dot: '#2196F3' },
                'Pending': { bg: '#FFF3E0', text: '#FF9800', dot: '#FF9800' },
                'Active': { bg: '#FFF3E0', text: '#FF9800', dot: '#FF9800' },
                'Missed': { bg: '#FFEBEE', text: '#F44336', dot: '#F44336' },
                'Dismissed': { bg: '#FFEBEE', text: '#F44336', dot: '#F44336' },
                'Snoozed': { bg: '#FFF3E0', text: '#FF9800', dot: '#FF9800' }
              };
              const colorObj = statusColors[status as keyof typeof statusColors] || statusColors['Upcoming'];

              let timeStr = '';
              if (reminder.reminder_time) {
                timeStr = reminder.reminder_time;
              } else if (reminder.next_trigger_at) {
                const d = new Date(reminder.next_trigger_at);
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else if (reminder.time) {
                timeStr = reminder.time;
              }

              let description = '';
              if (status === 'Completed') description = `Your ${title.toLowerCase()} has been completed successfully.`;
              else if (status === 'Missed') description = `You missed your ${title.toLowerCase()}. Try to stay on track tomorrow!`;
              else if (status === 'Snoozed') description = `Your ${title.toLowerCase()} is snoozed.`;
              else description = `Don't forget your ${title.toLowerCase()} today.`;

              const handleAction = (actionFn: () => void) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                actionFn();
              };

              return (
                <View key={index} style={{
                  backgroundColor: themeColors.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: themeColors.border || '#F0F0F0'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: iconColor + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <MaterialCommunityIcons name={iconName} size={26} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: themeColors.text, marginBottom: 4 }}>{title}</Text>
                      {timeStr ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={14} color={themeColors.subText} />
                          <Text style={{ fontSize: 13, color: themeColors.subText, marginLeft: 4 }}>{timeStr}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ backgroundColor: colorObj.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colorObj.dot, marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colorObj.text }}>{status}</Text>
                    </View>
                  </View>
                  
                  <Text style={{ fontSize: 14, color: themeColors.subText, lineHeight: 20, marginBottom: 16 }}>{description}</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    {status !== 'Completed' && (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E8F5E9', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => handleAction(() => useAppStore.getState().markReminderDone(reminder.id))}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: '700' }}>Done</Text>
                      </TouchableOpacity>
                    )}
                    {(status === 'Active' || status === 'Upcoming' || status === 'Snoozed') && (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF3E0', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => handleAction(() => useAppStore.getState().snoozeReminder(reminder.id, 10))}
                      >
                        <Ionicons name="alarm-outline" size={16} color="#FF9800" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#FF9800', fontSize: 13, fontWeight: '700' }}>Snooze</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: isDark ? '#333' : '#F5F5F5', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => handleAction(() => useAppStore.getState().dismissReminder(reminder.id))}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={themeColors.subText} style={{ marginRight: 4 }} />
                      <Text style={{ color: themeColors.subText, fontSize: 13, fontWeight: '700' }}>Dismiss</Text>
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
              <Text style={{color: themeColors.subText, textAlign: 'center', fontStyle: 'italic'}}>No reminders for today</Text>
            </View>
          )}
        </View>

        {/* --- TODAY'S MEALS --- */}
        <View style={[styles.mainCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
          <View style={styles.mainCardHeader}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Today's Meals</Text>
            <TouchableOpacity 
              onPress={() => router.push({ 
                pathname: '/(health-tabs)/camera', 
                params: { fromMode: 'health' } 
              })} 
              style={styles.scanBtn}
            >
              <Ionicons name="add" size={20} color="#00C853" />
              <Text style={styles.scanText}>Scan Food</Text>
            </TouchableOpacity>
          </View>

          {filteredMeals.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, gap: 15 }}>
              {filteredMeals.map((item: any, index: number) => (
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
                    <Text style={[styles.mealNameHorizontal, { color: themeColors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ color: '#2563EB', fontSize: 11, marginTop: 2, fontWeight: '600' }}>{getMealType(item.time)}</Text>
                    <Text style={[styles.mealTime, { color: themeColors.subText, marginTop: 2 }]}>{formatTo12Hour(item.time)}</Text>
                    <Text style={styles.mealCalsHorizontal}>{item.calories} kcal</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyMeal, { borderColor: themeColors.border, backgroundColor: isDark ? '#1E1E1E' : '#F1FDF5' }]}>
              <Text style={{fontSize: 32}}>🍎</Text>
              <Text style={[styles.emptyText, { color: themeColors.text }]}>No meals logged yet</Text>
              <Text style={[styles.emptySub, { color: themeColors.subText }]}>Tap Scan Food to track your first meal</Text>
            </View>
          )}
        </View>

        {/* --- HEALTHY STREAK --- */}
        <View style={styles.streakCard}>
          <View style={styles.streakInfo}>
            <View style={styles.fireIcon}><Text>🔥</Text></View>
            <View>
              <Text style={styles.streakTitle}>Healthy Streak</Text>
              <Text style={styles.streakSub}>{streak} days strong!</Text>
            </View>
          </View>
          <View style={styles.streakBar}> 
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <View key={i} style={[styles.barSegment, i <= streak && { backgroundColor: '#FFF' }]} />
            ))}
          </View>
        </View>

        {/* --- SLEEP SCORE --- */}
        <TouchableOpacity 
          style={[styles.sleepCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
          onPress={() => {
            setSleepVal(todaySleep.toString());
            setShowSleepModal(true);
          }}
        >
          <View style={styles.sleepHeader}>
             <Text style={{fontSize: 24}}>🌙</Text>
             <View style={{flex: 1, marginLeft: 15}}>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Sleep Score</Text>
                <Text style={[styles.statSub, { color: themeColors.subText }]}>{todaySleep > 0 ? `${todaySleep} hours • ${getSleepStatus()}` : 'No sleep data yet'}</Text>
             </View>
             <Text style={styles.sleepScoreValue}>{todaySleep > 0 ? (todaySleep >= 7 ? 90 : (todaySleep >= 5 ? 70 : 40)) : '--'}</Text>
          </View>
          <View style={[styles.sleepProgressContainer, { backgroundColor: themeColors.border }]}>
             <View style={[styles.sleepProgressBar, { width: `${Math.min(100, (todaySleep/8) * 100)}%` }]} />
          </View>
        </TouchableOpacity>

        {/* --- MOOD TRACKER --- */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>How are you feeling today?</Text>
          <View style={styles.moodRow}>
            {['Great', 'Good', 'Okay', 'Low'].map((m) => (
              <TouchableOpacity 
                key={m} 
                style={[
                  styles.moodCard, 
                  { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }, 
                  todayMood === m && { backgroundColor: isDark ? '#1A2E22' : '#E8F5E9', borderColor: '#00C853' }
                ]} 
                onPress={() => setMood(m)}
              >
                <Text style={{fontSize: 24}}>
                  {m === 'Great' ? '😊' : m === 'Good' ? '😌' : m === 'Okay' ? '😐' : '😔'}
                </Text>
                <Text style={[styles.moodText, { color: themeColors.subText }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- HEALTH TIP --- */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#1E1E1E' : '#F1FDF5' }]}>
          <View style={styles.tipIcon}><Ionicons name="bulb" size={24} color="#FFF" /></View>
          <View style={{flex: 1}}>
            <Text style={[styles.tipTitle, { color: themeColors.text }]}>Today's Health Tip</Text>
            <Text style={[styles.tipDesc, { color: isDark ? '#AAA' : '#444' }]}>{dailyTip}</Text>
          </View>
        </View>

        {/* --- QUICK ACTIONS (LINKED TO NEW PAGES) --- */}
        <View style={[styles.row, { marginBottom: 40 }]}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/wellness-coach')}
          >
            <View style={[styles.actionIcon, {backgroundColor: '#FCE4EC'}]}><Ionicons name="heart" size={20} color="#E91E63" /></View>
            <Text style={[styles.actionLabel, { color: themeColors.text }]}>Wellness Coach</Text>
            <Text style={[styles.actionSub, { color: themeColors.subText }]}>{getCoachAdvice()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => router.push('/plate-balance')}
          >
            <View style={[styles.actionIcon, {backgroundColor: '#FFF9C4'}]}><Ionicons name="restaurant" size={20} color="#FBC02D" /></View>
            <Text style={[styles.actionLabel, { color: themeColors.text }]}>Plate Balance</Text>
            <Text style={[styles.actionSub, { color: themeColors.subText }]}>{getPlateBalance()}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setChatVisible(true)}>
        <Ionicons name="chatbubble-ellipses" size={28} color="white" />
      </TouchableOpacity>

      {/* AI ASSISTANT MODAL */}
      <Modal visible={isChatVisible} animationType="slide">
        <SafeAreaView style={[styles.chatContainer, { backgroundColor: isDark ? '#121212' : '#F5F7FA' }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <View style={[styles.chatHeader, { backgroundColor: '#00C853' }]}>
                <TouchableOpacity onPress={() => setChatVisible(false)}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <View style={styles.chatHeaderInfo}>
                    <View style={styles.aiIconCircle}>
                      <MaterialCommunityIcons name="leaf" size={20} color="#00C853" />
                    </View>
                    <View>
                      <Text style={styles.chatHeaderText}>AI Wellness Coach</Text>
                      <Text style={styles.chatHeaderSub}>Healthy habits, happy life</Text>
                    </View>
                </View>
                <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => setHistoryVisible(true)}>
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
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: getAvatarColor(userProfile.name), justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</Text>
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
                placeholder={isChatLoading ? "Coach is thinking..." : "Ask for advice..."} 
                value={chatInput} 
                onChangeText={setChatInput} 
                placeholderTextColor="#999" 
                editable={!isChatLoading}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: (chatInput.trim().length > 0 && !isChatLoading) ? '#00C853' : '#A5D6A7' }]} 
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
          <View style={[styles.historyContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: themeColors.text }]}>Chat History</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyList}>
              {chatHistory.length > 0 ? (
                chatHistory.map((item) => (
                  <View key={item.id} style={[styles.historyItem, { borderColor: themeColors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyQuestion, { color: themeColors.text }]} numberOfLines={1}>Q: {item.question}</Text>
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
                            await AsyncStorage.setItem('health_chat_history_list', JSON.stringify(newHistory));
                            // Try to delete from backend
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
      </Animated.View>
     </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  reminderIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reminderStatusBox: { flex: 1, minWidth: '45%', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  statusIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 15 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarLetter: { color: '#1E88E5', fontSize: 20, fontWeight: 'bold' },
  welcomeTextColumn: { justifyContent: 'center' },
  welcomeSmall: { fontSize: 13, fontWeight: '500' },
  userNameBold: { fontSize: 20, fontWeight: 'bold' },
  notifBtn: { position: 'relative' },
  notifModalContent: { width: '90%', borderRadius: 24, padding: 20, maxHeight: '80%' },
  notifModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  notifModalTitle: { fontSize: 20, fontWeight: 'bold' },
  notifItemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  notifIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  notifItemTitle: { fontSize: 16, fontWeight: 'bold' },
  notifItemTime: { fontSize: 13, marginTop: 2 },
  badgePremium: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF5252', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 4, elevation: 4, shadowColor: '#FF5252', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3 },
  badgePremiumText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  premiumBellContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  bellPill: { flexDirection: 'row', alignItems: 'center', height: 42, paddingHorizontal: 15, borderRadius: 21, borderWidth: 1, position: 'relative' },
  notifDotPill: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5252' },
  calendarWrapper: { paddingBottom: 15 },
  calendarScroll: { paddingHorizontal: 20, gap: 12 },
  calendarDayCard: { width: 55, height: 85, borderRadius: 18, borderWidth: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'space-between' },
  calDayName: { fontSize: 10, fontWeight: '700' },
  calDayCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  calTodayActive: { backgroundColor: '#00C853' },
  calDayNum: { fontSize: 14, fontWeight: 'bold' },
  nextReminderChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 5 
  },
  nextReminderText: { fontSize: 13, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#7D8592', marginLeft: 8, fontWeight: '600' },
  statValue: { fontSize: 26, fontWeight: 'bold' },
  statSub: { fontSize: 12, color: '#7D8592', marginTop: 4 },
  gaugeCard: { borderRadius: 30, padding: 25, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  gaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gaugeTitle: { fontSize: 20, fontWeight: 'bold' },
  gaugeWrapper: { height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  segmentsRow: { position: 'absolute', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  gaugeSegment: { position: 'absolute', width: 24, height: 8, borderRadius: 4 },
  gaugeCenter: { alignItems: 'center', marginTop: 30 },
  remainingValue: { fontSize: 36, fontWeight: 'bold', marginTop: 2 },
  remainingLabel: { fontSize: 14, fontWeight: '500' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  macroCard: { width: '31%', borderRadius: 20, padding: 12, alignItems: 'center', justifyContent: 'center' },
  macroValue: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  macroLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  mainCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6 },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  scanBtn: { flexDirection: 'row', alignItems: 'center' },
  scanText: { color: '#00C853', fontWeight: 'bold', marginLeft: 4 },
  emptyMeal: { backgroundColor: '#F1FDF5', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 200, 83, 0.1)' },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  mealItemHorizontal: { width: 140, borderRadius: 16, overflow: 'hidden' },
  mealThumbLarge: { width: '100%', height: 100, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  mealNameHorizontal: { fontSize: 14, fontWeight: 'bold' },
  mealCalsHorizontal: { fontSize: 12, color: '#00C853', fontWeight: 'bold', marginTop: 4 },
  mealItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  mealName: { fontSize: 16, fontWeight: 'bold', color: '#011627' },
  mealTime: { fontSize: 12, color: '#7D8592' },
  mealThumb: { width: 45, height: 45, borderRadius: 12 },
  mealCals: { fontSize: 14, fontWeight: 'bold', color: '#00C853' },
  streakCard: { backgroundColor: '#00C853', borderRadius: 20, padding: 20, marginBottom: 20 },
  streakInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  fireIcon: { width: 35, height: 35, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  streakTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  streakSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  streakBar: { flexDirection: 'row', justifyContent: 'space-between' },
  barSegment: { height: 6, flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 2, borderRadius: 3 },
  sleepCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 1 },
  sleepHeader: { flexDirection: 'row', alignItems: 'center' },
  sleepScoreValue: { fontSize: 24, fontWeight: 'bold', color: '#9C27B0' },
  sleepProgressContainer: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginTop: 15, width: '100%' },
  sleepProgressBar: { height: '100%', backgroundColor: '#9C27B0', borderRadius: 3, width: '75%' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, alignItems: 'center', width: '22%', elevation: 1 },
  moodActive: { backgroundColor: '#E8F5E9', borderColor: '#00C853', borderWidth: 1 },
  moodText: { fontSize: 11, color: '#7D8592', marginTop: 5 },
  tipCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#00C853' },
  tipIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tipTitle: { fontSize: 16, fontWeight: 'bold' },
  tipDesc: { fontSize: 13, color: '#444' },
  actionCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 14, fontWeight: 'bold' },
  actionSub: { fontSize: 12, color: '#7D8592' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 25, borderRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 10, marginRight: 15 },
  saveBtnModal: { backgroundColor: '#00C853', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  animationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  lottie: { width: 250, height: 250 },
  welcomeText: { color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  welcomeSub: { color: 'white', fontSize: 16, opacity: 0.9, textAlign: 'center', marginTop: 10 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF3B30', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  chatContainer: { flex: 1 },
  chatHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : 20 },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  aiIconCircle: { backgroundColor: '#FFF', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  chatHeaderText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  chatHeaderSub: { color: '#FFF', opacity: 0.8, fontSize: 12 },
  chatBody: { flex: 1 },
  bubble: { padding: 15, borderRadius: 20, marginBottom: 15, maxWidth: '85%' },
  aiBubble: { backgroundColor: '#F0F0F0', borderTopLeftRadius: 0, alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#00C853', borderTopRightRadius: 0, alignSelf: 'flex-end' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  chatInputRow: { flexDirection: 'row', padding: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FFF' },
  textInput: { flex: 1, height: 50, backgroundColor: '#F5F5F5', borderRadius: 25, paddingHorizontal: 20, fontSize: 15 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
  historyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  historyContent: { height: '70%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 22, fontWeight: 'bold' },
  historyList: { flex: 1 },
  historyItem: { paddingVertical: 15, borderBottomWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyQuestion: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  historyAnswer: { fontSize: 14, color: '#777', lineHeight: 20 },
  historyDate: { fontSize: 12, color: '#999', marginTop: 8 },
  emptyHistory: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  historyFooter: { paddingTop: 20, paddingBottom: 10 },
  clearBtn: { backgroundColor: '#FF5252', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  clearText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});