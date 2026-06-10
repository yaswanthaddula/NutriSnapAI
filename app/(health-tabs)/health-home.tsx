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
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Platform as RNPlatform } from 'react-native';
const LottieView = RNPlatform.OS !== 'web' ? require('lottie-react-native').default : null;
import { useTheme } from '../_layout';
import useAppStore from '../../src/store/useAppStore';
import { calculateMealTotals } from '../../src/utils/calculations';
import { chatWithAi } from '../../src/services/chatGeminiService';
import { Pedometer } from 'expo-sensors';
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
    notifications
  } = useAppStore();

  const unreadCount = notifications.filter((n: any) => !n.isRead && n.mode === 'health').length;

  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [manualStepsVal, setManualStepsVal] = useState(steps.toString());
  const [showSleepModal, setShowSleepModal] = useState(false);
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

  // 2. SYNC NAME AND MEAL DATA
  useEffect(() => {
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
      syncBackendMeals();
      loadChatHistory();
    }, [])
  );

  const syncBackendMeals = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      console.log("Today date:", todayStr);
      
      const backendMeals = await apiService.getTodayMeals();
      console.log("Fetched today meals:", backendMeals);

       if (backendMeals) {
        // Filter and Map backend format to frontend format
        // Handle cases where mode might be null/missing by default as 'health'
        const healthBackendMeals = backendMeals.filter((bm: any) => !bm.mode || bm.mode === 'health');
        const formattedMeals = healthBackendMeals.map((bm: any) => ({
          id: bm.id,
          name: bm.food_name,
          calories: bm.calories,
          protein: bm.protein,
          carbs: bm.carbs,
          fat: bm.fat,
          quantity: bm.quantity,
          unit: bm.unit,
          emoji: '🍽️',
          mode: 'health',
          time: bm.time ? bm.time.slice(0, 5) : '00:00',
          date: bm.date
        }));
        
        // Merge with local meals, replacing only today's health meals
        const otherMeals = meals.filter((m: any) => !(m.date === todayStr && m.mode === 'health'));
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
    saveStoredData();
    setShowManualSteps(false);
  };

  const handleManualSleep = () => {
    const h = parseFloat(sleepVal) || 0;
    setSleep(h);
    saveStoredData();
    setShowSleepModal(false);
  };

  const handleSendMessage = async () => {
    if (chatInput.trim() === '') return;
    
    const userMsg = { id: Date.now(), text: chatInput, isAi: false };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      const aiResponse = await chatWithAi(currentInput, messages);
      const aiMsg = { id: Date.now() + 1, text: aiResponse, isAi: true };
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
  const today = new Date().toISOString().split('T')[0];
  const filteredMeals = meals.filter((m: any) => 
    m.mode === 'health' && 
    (m.date === today || !m.date) // Handle legacy meals without date
  );

  const themeColors = {
    bg: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  const { totalCalories, totalProtein, totalCarbs, totalFats } = calculateMealTotals(filteredMeals);
  
  // Real Profile Targets + Macro Fallback Logic
  const calorieTarget = userProfile.calorieTarget || 2000;
  const proteinTarget = userProfile.proteinTarget || 100;
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
     <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      
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

      {/* --- PREMIUM HEADER --- */}
      <View style={[styles.topHeader, { backgroundColor: themeColors.bg }]}>
        <View style={styles.userInfoRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{userProfile.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.welcomeTextColumn}>
            <Text style={[styles.welcomeSmall, { color: themeColors.subText }]}>Hello,</Text>
            <Text style={[styles.userNameBold, { color: themeColors.text }]}>{userProfile.name} 🌿</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.bellCircle, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
          onPress={() => {
            // Note: No markAllAsRead here to keep consistent with Gym mode
            router.push('/notification-list');
          }}
        >
          <Ionicons name="notifications-outline" size={24} color={themeColors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          )}
        </TouchableOpacity>
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
              <Ionicons name="water" size={18} color="#2196F3" />
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>Water</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{Math.floor(waterData.waterIntake / 250)}/{Math.round(waterData.waterGoal / 250)}</Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>glasses today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
            onPress={() => setShowManualSteps(true)}
          >
            <View style={styles.cardTop}>
              <MaterialCommunityIcons name="shoe-print" size={18} color="#FF9800" />
              <Text style={[styles.statLabel, { color: themeColors.subText }]}>Steps</Text>
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{steps}</Text>
            <Text style={[styles.statSub, { color: themeColors.subText }]}>Goal: 10,000</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <View style={styles.cardTop}>
              <Ionicons name="flame" size={18} color="#FF5252" />
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
              <MaterialCommunityIcons name="scale-bathroom" size={18} color="#9C27B0" />
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
            filteredMeals.map((item: any, index: number) => (
              <View key={index} style={[styles.mealItem, { borderBottomColor: themeColors.border }]}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.mealThumb} />
                ) : (
                  <Text style={{fontSize: 24}}>{item.emoji}</Text>
                )}
                <View style={{flex: 1, marginLeft: 15}}>
                  <Text style={[styles.mealName, { color: themeColors.text }]}>{item.name}</Text>
                  <Text style={[styles.mealTime, { color: themeColors.subText }]}>{item.time} • {item.protein || 0}g protein</Text>
                </View>
                <Text style={styles.mealCals}>{item.calories} kcal</Text>
                <TouchableOpacity 
                  style={{ marginLeft: 10 }}
                  onPress={async () => {
                    useAppStore.getState().deleteMeal(item.id);
                    await useAppStore.getState().saveStoredData();
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ))
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
              {messages.map((msg) => (
                <View key={msg.id} style={[styles.bubble, msg.isAi ? styles.aiBubble : styles.userBubble]}>
                  <Text style={[styles.bubbleText, { color: msg.isAi ? '#333' : '#FFF' }]}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput 
                style={styles.textInput} 
                placeholder="Ask for advice..." 
                value={chatInput} 
                onChangeText={setChatInput} 
                placeholderTextColor="#999" 
              />
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: chatInput.trim().length > 0 ? '#00C853' : '#A5D6A7' }]} 
                onPress={handleSendMessage}
                disabled={chatInput.trim().length === 0}
              >
                <Ionicons name="send-sharp" size={20} color="white" />
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
                  <TouchableOpacity key={item.id} style={[styles.historyItem, { borderColor: themeColors.border }]}>
                    <Text style={[styles.historyQuestion, { color: themeColors.text }]} numberOfLines={1}>Q: {item.question}</Text>
                    <Text style={styles.historyAnswer} numberOfLines={2}>{item.answer}</Text>
                    <Text style={styles.historyDate}>{item.createdAt}</Text>
                  </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingVertical: 20, paddingTop: Platform.OS === 'android' ? 50 : 20, alignItems: 'center' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 3, shadowColor: '#00C853', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  avatarLetter: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  welcomeTextColumn: { justifyContent: 'center' },
  welcomeSmall: { fontSize: 13, fontWeight: '500' },
  userNameBold: { fontSize: 20, fontWeight: 'bold' },
  bellCircle: { width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 1 },
  calendarWrapper: { paddingBottom: 15 },
  calendarScroll: { paddingHorizontal: 20, gap: 12 },
  calendarDayCard: { width: 55, height: 85, borderRadius: 18, borderWidth: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'space-between' },
  calDayName: { fontSize: 10, fontWeight: '700' },
  calDayCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  calTodayActive: { backgroundColor: '#00C853' },
  calDayNum: { fontSize: 14, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 20, paddingBottom: 50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 20, padding: 15, elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 13, color: '#7D8592', marginLeft: 8, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statSub: { fontSize: 11, color: '#7D8592' },
  gaugeCard: { borderRadius: 30, padding: 25, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
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
  mainCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 1 },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  scanBtn: { flexDirection: 'row', alignItems: 'center' },
  scanText: { color: '#00C853', fontWeight: 'bold', marginLeft: 4 },
  emptyMeal: { backgroundColor: '#F1FDF5', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 200, 83, 0.1)' },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#7D8592', textAlign: 'center' },
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
  historyItem: { paddingVertical: 15, borderBottomWidth: 1 },
  historyQuestion: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  historyAnswer: { fontSize: 14, color: '#777', lineHeight: 20 },
  historyDate: { fontSize: 12, color: '#999', marginTop: 8 },
  emptyHistory: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  historyFooter: { paddingTop: 20, paddingBottom: 10 },
  clearBtn: { backgroundColor: '#FF5252', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  clearText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});