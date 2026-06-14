import { Platform, LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import useAppStore from '../store/useAppStore';

// Helper to parse AM/PM or 24h times
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const ampmMatch = timeStr.match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
  }
  const match24 = timeStr.match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    return { hour, minute };
  }
  return null;
};

// Helper to convert water reminder intervals into seconds
const getWaterIntervalSeconds = (intervalStr) => {
  if (!intervalStr) return null;
  const lower = intervalStr.toLowerCase();
  if (lower.includes('30 min')) return 30 * 60;
  if (lower.includes('1 hour') || lower.includes('1hr')) return 60 * 60;
  if (lower.includes('2 hour') || lower.includes('2hr')) return 120 * 60;
  const match = lower.match(/(\d+)\s*(min|hour|hr|s)/);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit.startsWith('m')) return val * 60;
    if (unit.startsWith('h') || unit.startsWith('t')) return val * 3600;
    return val;
  }
  return 3 * 3600; // default 3 hours
};

// Ignore the SDK 53+ Expo Go notification warning/error since we handle it gracefully
LogBox.ignoreLogs([
  'expo-notifications functionality is not fully supported in Expo Go',
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go'
]);

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Use require to avoid top-level side effects that trigger the Expo Go warning
const getNotificationsModule = () => {
  try {
    return require('expo-notifications');
  } catch (e) {
    console.log("Notifications module not available");
    return null;
  }
};

const Notifications = getNotificationsModule();

// Configure how notifications are handled when the app is foregrounded
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldVibrate: true,
    }),
  });
}

const getDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const getTodayWorkout = () => {
  const dayName = getDayName();
  const { WORKOUT_PLANS } = require('../data/workoutPlans');
  return WORKOUT_PLANS.find(p => p.dayOfWeek === dayName);
};

const calculateStreak = (workouts) => {
  if (!workouts || workouts.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get unique dates of completed workouts
  const completedDates = [...new Set(workouts
    .filter(w => w.status === 'completed')
    .map(w => w.date))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completedDates.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(completedDates[0]);
  
  // Check if the most recent workout was today or yesterday
  const diffToToday = (today - currentDate) / (1000 * 60 * 60 * 24);
  if (diffToToday > 1) return 0;

  for (let i = 0; i < completedDates.length; i++) {
    const d = new Date(completedDates[i]);
    if (i === 0) {
      streak = 1;
    } else {
      const prevD = new Date(completedDates[i-1]);
      const diff = (prevD - d) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
};

const NOTIFICATION_RULES = [
  // 0. DAILY GREETING (Triggers anytime once a day)
  {
    type: 'daily-greeting',
    title: 'Good Day!',
    check: (state) => {
      const now = new Date();
      const hour = now.getHours();
      let greeting = "How is your day going? Don't forget to track your health today! 🌿";
      if (hour < 12) greeting = "Good morning! Let's make today a healthy one! ☀️";
      else if (hour >= 18) greeting = "Good evening! How was your progress today? 🌙";
      
      return { message: greeting };
    },
    mode: 'health'
  },
  // 0b. DAILY GYM MOTIVATION
  {
    type: 'gym-daily',
    title: 'Crush It!',
    check: (state) => {
      return { message: "Ready to hit your targets today? Stay consistent and see the results! 🔥" };
    },
    mode: 'gym'
  },
  // 1. WORKOUT REMINDER
  {
    type: 'workout-reminder',
    title: 'Workout Pending',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isSunday = now.getDay() === 0;
      const hasCompleted = state.workouts.some(w => w.date === today && w.status === 'completed');
      
      if (!isSunday && now.getHours() >= 18 && !hasCompleted) {
        const todayPlan = getTodayWorkout();
        return { message: `Today's ${todayPlan?.day || 'workout'} is still pending. Don't skip it!` };
      }
      return false;
    },
    mode: 'gym'
  },
  // 2. WORKOUT MISSED
  {
    type: 'workout-missed',
    title: 'Workout Missed',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isSunday = now.getDay() === 0;
      const hasCompleted = state.workouts.some(w => w.date === today && w.status === 'completed');
      
      if (!isSunday && now.getHours() >= 22 && !hasCompleted) {
        const todayPlan = getTodayWorkout();
        return { message: `You missed today's ${todayPlan?.day || 'workout'}. Get back stronger tomorrow!` };
      }
      return false;
    },
    mode: 'gym'
  },
  // 3. PROTEIN GOAL REMINDER
  {
    type: 'protein-goal',
    title: 'Protein Goal',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const todayMeals = state.meals.filter(m => m.date === today);
      const consumed = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
      const target = state.userProfile.proteinTarget || 100;
      const remaining = target - consumed;

      if (now.getHours() >= 20 && remaining > 5) {
        return { message: `You still need ${Math.round(remaining)}g protein today to reach your goal.` };
      }
      return false;
    },
    mode: 'gym'
  },
  // 4. CALORIE GOAL REMINDER
  {
    type: 'calorie-low',
    title: 'Fuel Up!',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const todayMeals = state.meals.filter(m => m.date === today);
      const consumed = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const target = state.userProfile.calorieTarget || 2000;
      const remaining = target - consumed;

      const goalLower = (state.userProfile.goal || '').toLowerCase();
      if (now.getHours() >= 20 && remaining > 200 && !goalLower.includes('loss') && !goalLower.includes('lose')) {
        return { message: `You are ${Math.round(remaining)} kcal below today's target. Fuel your gains!` };
      }
      return false;
    },
    mode: 'health'
  },
  // 5. CALORIES EXCEEDED
  {
    type: 'calorie-high',
    title: 'Target Exceeded',
    check: (state) => {
      const today = new Date().toISOString().split('T')[0];
      const todayMeals = state.meals.filter(m => m.date === today);
      const consumed = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const target = state.userProfile.calorieTarget || 2000;

      if (consumed > target + 50) {
        return { message: `You've exceeded today's calorie goal by ${Math.round(consumed - target)} kcal.` };
      }
      return false;
    },
    mode: 'health'
  },
  // 6. STEP GOAL REMINDER
  {
    type: 'steps-goal',
    title: 'Almost There!',
    check: (state) => {
      const now = new Date();
      const target = 10000;
      const remaining = target - state.steps;

      if (now.getHours() >= 21 && remaining > 500) {
        return { message: `You still need ${remaining} steps today to hit your 10,000 goal. Let's move!` };
      }
      return false;
    },
    mode: 'health'
  },
  // 7. STREAK NOTIFICATION
  {
    type: 'streak',
    title: 'Streak Alert!',
    check: (state) => {
      const streak = calculateStreak(state.workouts);
      if (streak >= 3) {
        return { message: `Awesome! You are on a ${streak}-day workout streak. Keep it going!` };
      }
      return false;
    },
    mode: 'gym'
  },
  // 8. REST DAY NOTIFICATION
  {
    type: 'rest-day',
    title: 'Recovery Day',
    check: (state) => {
      const now = new Date();
      if (now.getDay() === 0) {
        return { message: "Today is recovery day. Focus on stretching, hydration, and resting." };
      }
      return false;
    },
    mode: 'gym'
  },
  // 9. INACTIVITY REMINDER
  {
    type: 'inactivity',
    title: 'Let\'s Move',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hasWorkout = state.workouts.some(w => w.date === today);
      
      if (now.getHours() >= 16 && !hasWorkout && state.steps < 2000) {
        return { message: "You've been inactive for a while. Let's start with a quick stretch!" };
      }
      return false;
    },
    mode: 'gym'
  },
  // 10. WORKOUT COMPLETED
  {
    type: 'workout-completed',
    title: 'Great Job!',
    check: (state) => {
      const today = new Date().toISOString().split('T')[0];
      const hasCompleted = state.workouts.some(w => w.date === today && w.status === 'completed');
      if (hasCompleted) {
        return { message: "Great job! You completed today's workout. Recovery starts now!" };
      }
      return false;
    },
    mode: 'gym'
  },
  // 11. MEAL REMINDERS
  {
    type: 'meal-breakfast',
    title: 'Meal Reminder',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hasBreakfast = state.meals.some(m => m.date === today && m.name.toLowerCase().includes('breakfast'));
      if (now.getHours() >= 9 && now.getHours() < 11 && !hasBreakfast) {
        return { message: "Don't forget to log your breakfast!" };
      }
      return false;
    },
    mode: 'health'
  },
  // 12. WATER REMINDER
  {
    type: 'water-reminder',
    title: 'Hydration Time',
    check: (state) => {
      const now = new Date();
      const waterData = state.waterData;
      
      // Only remind between 9 AM and 9 PM
      // And only if intake is less than goal
      if (now.getHours() >= 18 && now.getHours() <= 21 && waterData.waterIntake < waterData.waterGoal) {
        return { message: "Water intake is low. Drink more water today." };
      }
      return false;
    },
    mode: 'health'
  },
  // 13. WEEKLY REPORT (Simulated on Sundays)
  {
    type: 'weekly-report',
    title: 'Weekly Summary',
    check: (state) => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 10) { // Sunday 10 AM
        return { message: "Your weekly fitness summary is ready! Check your progress." };
      }
      return false;
    },
    mode: 'gym'
  },
  // 14. MOTIVATIONAL QUOTE
  {
    type: 'quote',
    title: 'Daily Inspiration',
    check: (state) => {
      const now = new Date();
      if (now.getHours() === 8) { // 8 AM
        const quotes = [
          "The only bad workout is the one that didn't happen.",
          "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
          "Action is the foundational key to all success.",
          "Don't stop when you're tired. Stop when you're done."
        ];
        const quote = quotes[now.getDate() % quotes.length];
        return { message: quote };
      }
      return false;
    },
    mode: 'gym'
  },
  // 15. MEAL NOT LOGGED
  {
    type: 'meal-none',
    title: 'Track Your Food',
    check: (state) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hasMeals = state.meals.some(m => m.date === today);
      if (now.getHours() >= 14 && !hasMeals) {
        return { message: "You haven't logged any meals today. Tracking helps reach goals!" };
      }
      return false;
    },
    mode: 'health'
  },
  // 16. MOOD REMINDER
  {
    type: 'mood-reminder',
    title: 'How are you?',
    check: (state) => {
      const now = new Date();
      if (now.getHours() >= 20 && !state.todayMood) {
        return { message: "How are you feeling today? Log your mood for health insights." };
      }
      return false;
    },
    mode: 'health'
  },
  // 17. SLEEP REMINDER
  {
    type: 'sleep-reminder',
    title: 'Sleep Well',
    check: (state) => {
      const now = new Date();
      if (now.getHours() >= 22 && state.todaySleep === 0) {
        return { message: "Remember to track your sleep tonight for a better score tomorrow!" };
      }
      return false;
    },
  }
];

// Web Audio API Beep System for Mobile Browsers
let audioCtx = null;

const initAudioContext = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !audioCtx) {
      audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
};

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Unlock audio on first user interaction
  const unlock = () => {
    initAudioContext();
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('click', unlock);
  };
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click', unlock, { once: true });
}

const playBeep = () => {
  if (!audioCtx) initAudioContext();
  if (!audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.log("Beep failed:", e);
  }
};

const showWebNotification = (title, message, screen) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // 1. Play synthesized beep (guaranteed to not have CORS issues)
    playBeep();

    // 2. Try Native Web Notification
    if ('Notification' in window) {
      const trigger = () => {
        const notif = new window.Notification(title, {
          body: message,
          icon: '/favicon.ico' // Ensure an icon exists
        });
        console.log(`Notification Delivered (Web): ${title} - ${message}`);
        
        notif.onclick = () => {
          console.log(`Notification Triggered (Web Click): Routing to ${screen}`);
          window.focus();
          if (screen) router.push(screen);
        };
      };

      if (window.Notification.permission === 'granted') {
        trigger();
      } else if (window.Notification.permission !== 'denied') {
        window.Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            trigger();
          }
        });
      }
    } else {
      // Fallback: Non-blocking console log instead of blocking Alert.alert for background intervals
      console.log(`Notification Delivered (Web Fallback): ${title} - ${message}`);
    }
  }
};

export const notificationService = {
  triggerEventNotification: async (type) => {
    const state = useAppStore.getState();
    const prefs = state.notificationPrefs;
    const currentMode = state.userProfile.selected_mode?.toLowerCase() || 'health';
    const today = new Date().toISOString().split('T')[0];
    
    const rule = NOTIFICATION_RULES.find(r => r.type === type);
    if (!rule || rule.mode !== currentMode) return;

    // Check Preference
    let isEnabled = true;
    if (rule.type.startsWith('meal')) isEnabled = prefs.meals;
    else if (rule.type.startsWith('workout') || ['streak', 'rest-day', 'inactivity'].includes(rule.type)) isEnabled = prefs.workout;
    else if (rule.type.startsWith('water')) isEnabled = prefs.water;
    else if (rule.type.includes('goal') || rule.type.includes('high') || rule.type.includes('low')) isEnabled = prefs.goals;
    else if (rule.type === 'weekly-report' || rule.type.includes('reminder')) isEnabled = prefs.reports;
    else if (rule.type === 'quote') isEnabled = prefs.quotes;

    if (!isEnabled) return;

    const checkResult = rule.check(state);
    if (checkResult) {
      const message = typeof checkResult === 'object' ? checkResult.message : rule.message;
      const uniqueKey = `${rule.type}-${today}`;
      const screenRoute = rule.mode === 'gym' ? '/gym-home' : '/health-home';

      const newNotif = state.addNotification({
        title: rule.title,
        message: message,
        type: rule.type,
        mode: rule.mode,
        key: uniqueKey,
        icon: rule.type.includes('meal') ? 'food' : rule.type.includes('workout') ? 'arm-flex' : 'target',
        color: rule.type.includes('meal') ? '#4CAF50' : rule.type.includes('workout') ? '#FF9800' : '#F44336'
      });

      if (newNotif) {
        showWebNotification(rule.title, message, screenRoute);
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `NutriSnap AI: ${rule.title}`,
              body: message,
              data: { 
                type: rule.type,
                mode: rule.mode,
                screen: screenRoute
              },
              sound: true,
              vibrate: [0, 250, 250, 250],
              priority: Notifications.AndroidNotificationPriority.MAX,
              channelId: 'high_priority_v2',
            },
            trigger: { seconds: 1, channelId: 'high_priority_v2' },
          });
        } catch (e) {
          console.log("Event notification failed:", e.message);
        }
      }
    }
  },

  checkAndGenerate: async () => {
    const state = useAppStore.getState();
    const prefs = state.notificationPrefs;
    const currentMode = state.userProfile.selected_mode?.toLowerCase() || 'health';
    const today = new Date().toISOString().split('T')[0];
    
    // In bulk check, only check passive or summary rules
    // Avoid triggering event-based ones all at once
    const passiveTypes = ['daily-greeting', 'gym-daily', 'quote', 'weekly-report', 'mood-reminder', 'sleep-reminder'];

    for (const rule of NOTIFICATION_RULES) {
      if (rule.mode !== currentMode) continue;
      if (!passiveTypes.includes(rule.type)) continue;

      let isEnabled = true;
      if (rule.type === 'quote') isEnabled = prefs.quotes;
      else if (rule.type === 'weekly-report') isEnabled = prefs.reports;
      else isEnabled = true;

      if (!isEnabled) continue;

      const checkResult = rule.check(state);
      if (checkResult) {
        const message = typeof checkResult === 'object' ? checkResult.message : rule.message;
        const uniqueKey = `${rule.type}-${today}`;
        const screenRoute = rule.mode === 'gym' ? '/gym-home' : '/health-home';

        const newNotif = state.addNotification({
          title: rule.title,
          message: message,
          type: rule.type,
          mode: rule.mode,
          key: uniqueKey,
          icon: rule.type.includes('mood') ? 'emoticon-outline' : 'bell-outline',
          color: '#00C853'
        });

        if (newNotif) {
          showWebNotification(rule.title, message, screenRoute);
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `NutriSnap AI: ${rule.title}`,
                body: message,
                data: { 
                  type: rule.type,
                  mode: rule.mode,
                  screen: screenRoute
                },
                sound: true,
                channelId: 'high_priority_v2',
              },
              trigger: { seconds: 1, channelId: 'high_priority_v2' },
            });
          } catch (e) {
            console.log("Passive notification failed:", e.message);
          }
        }
      }
    }
  },

  scheduleWithRepeat: async (content, parsed, repeatType) => {
    if (!Notifications) return;
    const channelId = Platform.OS === 'android' ? 'high_priority_v2' : undefined;
    
    if (repeatType === 'Weekdays') {
      const days = [2, 3, 4, 5, 6]; // Monday to Friday
      for (const day of days) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { weekday: day, hour: parsed.hour, minute: parsed.minute, repeats: true, channelId: channelId || 'high_priority_v2' }
        });
      }
    } else if (repeatType === 'Weekends') {
      const days = [1, 7]; // Sunday, Saturday
      for (const day of days) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { weekday: day, hour: parsed.hour, minute: parsed.minute, repeats: true, channelId: channelId || 'high_priority_v2' }
        });
      }
    } else {
      // Daily or Custom Days (fallback to daily)
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { hour: parsed.hour, minute: parsed.minute, repeats: true, channelId: channelId || 'high_priority_v2' }
      });
    }
  },

  scheduleReminderNotifications: async () => {
    try {
      if (!Notifications) return;

      const state = useAppStore.getState();
      const profile = state.userProfile;
      const currentMode = profile.selected_mode?.toLowerCase() || 'health';
      const prefs = state.notificationPrefs;

      // Clear existing scheduled notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Cancelled all existing scheduled notifications.");

      // Sync to Backend Reminders Table seamlessly
      try {
        const mapping = [
          { type: 'breakfast', timeKey: 'breakfastReminderTime', repeatKey: 'breakfastRepeat', enabled: prefs.meals, title: 'Breakfast Reminder' },
          { type: 'lunch', timeKey: 'lunchReminderTime', repeatKey: 'lunchRepeat', enabled: prefs.meals, title: 'Lunch Reminder' },
          { type: 'dinner', timeKey: 'dinnerReminderTime', repeatKey: 'dinnerRepeat', enabled: prefs.meals, title: 'Dinner Reminder' },
          { type: 'snack', timeKey: 'snackReminderTime', repeatKey: 'snackRepeat', enabled: prefs.meals, title: 'Snack Reminder' },
          { type: 'workout', timeKey: 'workoutReminderTime', repeatKey: 'workoutRepeat', enabled: prefs.workout, title: 'Workout Reminder' },
          { type: 'sleep', timeKey: 'sleepReminderTime', repeatKey: 'sleepRepeat', enabled: prefs.sleep, title: 'Sleep Reminder' },
          { type: 'water', timeKey: 'waterReminderInterval', repeatKey: null, enabled: prefs.water, title: 'Water Reminder' }
        ];
        
        // Fire and forget
        Promise.allSettled(
          mapping.map(m => {
            const payload = {
              reminder_type: m.type,
              title: m.title,
              reminder_time: profile[m.timeKey] || '08:00 AM',
              repeat_type: m.repeatKey ? prefs[m.repeatKey] : null,
              repeat_days: null,
              is_enabled: m.enabled,
              notification_status: 'upcoming'
            };
            return apiService.createReminder(payload);
          })
        ).then(results => {
          // Update the local store array with the newly synced reminders
          const newReminders = results
            .filter(r => r.status === 'fulfilled' && r.value)
            .map(r => r.value);
          if (newReminders.length > 0) {
            const dynamicStatuses = {};
            newReminders.forEach(r => {
               dynamicStatuses[r.reminder_type] = r.notification_status === 'missed' ? 'Missed' : (r.notification_status === 'completed' ? 'Completed' : 'Upcoming');
            });
            useAppStore.setState({ reminders: newReminders, reminderStatuses: dynamicStatuses });
            useAppStore.getState().saveStoredData();
          }
        }).catch(err => console.log('Reminder backend sync err:', err));
      } catch (e) {
        console.log('Error initiating reminder backend sync:', e);
      }

      const channelId = Platform.OS === 'android' ? 'high_priority_v2' : undefined;

      // 1. Meals Reminders
      if (prefs.meals) {
        const mealReminders = [
          { time: profile.breakfastReminderTime, repeat: prefs.breakfastRepeat, title: 'NutriSnap AI', body: '🍳 Time for Breakfast', type: 'breakfast' },
          { time: profile.lunchReminderTime, repeat: prefs.lunchRepeat, title: 'NutriSnap AI', body: '🍽️ Time for Lunch', type: 'lunch' },
          { time: profile.dinnerReminderTime, repeat: prefs.dinnerRepeat, title: 'NutriSnap AI', body: '🌙 Time for Dinner', type: 'dinner' },
          { time: profile.snackReminderTime, repeat: prefs.snackRepeat, title: 'NutriSnap AI', body: '🥗 Time for Snack', type: 'snack' },
        ];

        for (const item of mealReminders) {
          const parsed = parseTime(item.time);
          if (parsed) {
            const content = {
              title: item.title,
              body: item.body,
              sound: true,
              vibrate: [0, 250, 250, 250],
              priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: channelId || 'high_priority_v2',
              data: { 
                screen: currentMode === 'gym' ? '/food-selection' : '/health-food-selection',
                type: `meal-${item.type}`
              },
            };
            await notificationService.scheduleWithRepeat(content, parsed, item.repeat);
            console.log(`[DEBUG] Reminder Scheduled: ${item.type} at ${parsed.hour}:${parsed.minute} (${item.repeat || 'Daily'})`);
          }
        }
      }

      // 2. Water Reminder
      if (prefs.water && profile.waterReminderInterval) {
        const intervalSeconds = getWaterIntervalSeconds(profile.waterReminderInterval);
        if (intervalSeconds) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'NutriSnap AI',
              body: "💧 Time to drink water.",
              sound: true,
              vibrate: [0, 250, 250, 250],
              priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: channelId || 'high_priority_v2',
              data: { 
                screen: currentMode === 'gym' ? '/(tabs)/gym-home' : '/(health-tabs)/health-home',
                type: 'water-reminder'
              },
            },
            trigger: { seconds: intervalSeconds, repeats: true, channelId: channelId || 'high_priority_v2' },
          });
          console.log(`[DEBUG] Reminder Scheduled: water-reminder every ${intervalSeconds}s`);
        }
      }

      // 3. Workout Reminder
      if (prefs.workout && profile.workoutReminderTime) {
        const parsed = parseTime(profile.workoutReminderTime);
        if (parsed) {
          const content = {
            title: 'NutriSnap AI',
            body: '🏋️ Workout session starts now.',
            sound: true,
            vibrate: [0, 250, 250, 250],
            priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: channelId || 'high_priority_v2',
            data: { 
              screen: currentMode === 'gym' ? '/(tabs)/plans' : '/(health-tabs)/plans',
              type: 'workout-reminder'
            },
          };
          await notificationService.scheduleWithRepeat(content, parsed, prefs.workoutRepeat);
          console.log(`[DEBUG] Reminder Scheduled: workout-reminder at ${parsed.hour}:${parsed.minute} (${prefs.workoutRepeat || 'Daily'})`);
        }
      }

      // 4. Sleep Reminder
      if (prefs.sleep && profile.sleepReminderTime) {
        const parsed = parseTime(profile.sleepReminderTime);
        if (parsed) {
          const content = {
            title: 'NutriSnap AI',
            body: '😴 Time to sleep and recover.',
            sound: true,
            vibrate: [0, 250, 250, 250],
            priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: channelId || 'high_priority_v2',
            data: { 
              screen: currentMode === 'gym' ? '/(tabs)/gym-home' : '/(health-tabs)/health-home',
              type: 'sleep-reminder'
            },
          };
          await notificationService.scheduleWithRepeat(content, parsed, prefs.sleepRepeat);
          console.log(`[DEBUG] Reminder Scheduled: sleep-reminder at ${parsed.hour}:${parsed.minute} (${prefs.sleepRepeat || 'Daily'})`);
        }
      }
    } catch (e) {
      console.log("Error scheduling reminder notifications:", e);
    }
  },

  scheduleDailyReminders: async () => {
    await notificationService.scheduleReminderNotifications();
  },

  registerForPushNotificationsAsync: async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
          const permission = await window.Notification.requestPermission();
          return permission === 'granted';
        }
        return window.Notification.permission === 'granted';
      }
      return true; // Fallback to in-app alerts if Notification API is missing
    }
    
    try {
      if (!Notifications) return false;
      let token;
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('high_priority_v2', {
          name: 'High Priority Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          showBadge: true,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return false;
      }

      // Skip push token generation in Expo Go or if projectId is missing to avoid errors
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      if (isExpoGo || !Constants.expoConfig?.extra?.eas?.projectId) {
        console.log("Skipping push token generation (Expo Go or missing projectId)");
        return true;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
        console.log("Push Token:", token);
      } catch (e) {
        console.log("Error getting push token:", e);
      }

      return true;
    } catch (e) {
      console.log("Error in registerForPushNotificationsAsync:", e);
      return false; // Fail gracefully if permissions prompt throws on unsupported platforms
    }
  },

  setupListeners: () => {
    // Listener for when a notification is received while the app is foregrounded
    const foregroundSubscription = Notifications ? Notifications.addNotificationReceivedListener(notification => {
      console.log("[DEBUG] Reminder Triggered / Notification Delivered (Mobile Foreground):", notification.request.content);
    }) : { remove: () => {} };

    // Listener for when a user interacts with a notification (clicked)
    const responseSubscription = Notifications ? Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification?.request?.content?.data;
      console.log("[DEBUG] Reminder Completed / Notification Triggered (Mobile Click):", data);
      
      if (data?.type) {
        let reminderType = data.type.replace('-reminder', ''); // e.g. workout-reminder -> workout
        if (data.type.includes('meal-')) reminderType = data.type.replace('meal-', ''); // meal-breakfast -> breakfast
        if (['breakfast', 'lunch', 'dinner', 'snack', 'workout', 'sleep', 'water'].includes(reminderType)) {
          useAppStore.getState().markReminderCompleted(reminderType);
        }
      }

      if (data?.screen) {
        router.push(data.screen);
      }
    }) : { remove: () => {} };

    // Set up global periodic evaluator (for both web and mobile foreground)
    const statusInterval = setInterval(() => {
      useAppStore.getState().evaluateReminderStatuses();
    }, 30000); // Check every 30 seconds

    // Web-specific notification fallback
    let webIntervalId = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      webIntervalId = setInterval(() => {
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const todayDateStr = now.toISOString().split('T')[0];
        
        const state = useAppStore.getState();
        const profile = state.userProfile;
        const prefs = state.notificationPrefs;

        const checkTime = (timeStr, title, body) => {
           if (!timeStr) return;
           const parsed = parseTime(timeStr);
           if (parsed) {
              const targetTotalMinutes = parsed.hour * 60 + parsed.minute;
              // Check if we are within a 5 minute window after the target time
              if (currentTotalMinutes >= targetTotalMinutes && currentTotalMinutes <= targetTotalMinutes + 5) {
                const key = `web-notif-${todayDateStr}-${title}`;
                if (!window[key]) {
                  window[key] = true;
                  showWebNotification(title, body);
                }
              }
           }
        };

        if (prefs.meals) {
           checkTime(profile.breakfastReminderTime, 'Breakfast Reminder', 'Time for your healthy breakfast. 🍎');
           checkTime(profile.lunchReminderTime, 'Lunch Reminder', "Don't forget to track your lunch. 🥗");
           checkTime(profile.dinnerReminderTime, 'Dinner Reminder', 'Time for your healthy dinner. 🍲');
           checkTime(profile.snackReminderTime, 'Snack Reminder', 'Time for a healthy snack check-in. 🍌');
        }
        if (prefs.workout) {
           checkTime(profile.workoutReminderTime, 'Workout Reminder', 'Workout session starts now. 🔥');
        }
        if (prefs.sleep) {
           checkTime(profile.sleepReminderTime, 'Sleep Reminder', 'Time to sleep and recover. 🌙');
        }
      }, 30000); // Check every 30 seconds
    }

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
      clearInterval(statusInterval);
      if (webIntervalId) clearInterval(webIntervalId);
    };
  }
};

export default notificationService;
