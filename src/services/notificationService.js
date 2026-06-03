import { Platform, PermissionsAndroid, LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import useAppStore from '../store/useAppStore';

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

const showWebNotification = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    const trigger = () => {
      new window.Notification(`NutriSnap AI: ${title}`, {
        body: message,
      });
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
        showWebNotification(rule.title, message);
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `NutriSnap AI: ${rule.title}`,
              body: message,
              data: { 
                type: rule.type,
                mode: rule.mode,
                screen: rule.mode === 'gym' ? '/gym-home' : '/health-home'
              },
              sound: true,
              vibrate: [0, 250, 250, 250],
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: null,
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
          showWebNotification(rule.title, message);
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `NutriSnap AI: ${rule.title}`,
                body: message,
                data: { 
                  type: rule.type,
                  mode: rule.mode,
                  screen: rule.mode === 'gym' ? '/gym-home' : '/health-home'
                },
                sound: true,
              },
              trigger: null,
            });
          } catch (e) {
            console.log("Passive notification failed:", e.message);
          }
        }
      }
    }
  },

  scheduleDailyReminders: async () => {
    try {
      const state = useAppStore.getState();
      const currentMode = state.userProfile.selected_mode?.toLowerCase() || 'health';
      const prefs = state.notificationPrefs;
      const todayMeals = state.meals || [];
      
      // Clear existing scheduled notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      const channelId = Platform.OS === 'android' ? 'default' : undefined;

      // 1. HEALTH MODE SCHEDULE
      if (currentMode === 'health') {
        // Breakfast Reminder (if not logged)
        const hasBreakfast = todayMeals.some(m => {
          const hour = new Date(`2000-01-01T${m.time}`).getHours();
          return hour >= 5 && hour <= 10;
        });
        if (!hasBreakfast && prefs.meals) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'NutriSnap AI', body: "Time to log your healthy breakfast! 🍎", data: { screen: '/health-home' }, sound: true },
            trigger: { hour: 8, minute: 30, repeats: true, channelId },
          });
        }

        // Lunch Reminder (if not logged)
        const hasLunch = todayMeals.some(m => {
          const hour = new Date(`2000-01-01T${m.time}`).getHours();
          return hour >= 12 && hour <= 15;
        });
        if (!hasLunch && prefs.meals) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'NutriSnap AI', body: "Don't forget to track your lunch nutrients. 🥗", data: { screen: '/health-home' }, sound: true },
            trigger: { hour: 13, minute: 0, repeats: true, channelId },
          });
        }

        // Water Reminder (if goal not reached)
        if (state.waterData.waterIntake < state.waterData.waterGoal && prefs.water) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'NutriSnap AI', body: "Stay hydrated! Have a glass of water now. 💧", data: { screen: '/health-home' }, sound: true },
            trigger: { hour: 11, minute: 0, repeats: true, channelId },
          });
        }
      } 
      // 2. GYM MODE SCHEDULE
      else {
        // Workout Reminder (if not completed)
        const workoutDone = state.workouts.some(w => w.status === 'completed' || w.status === 'done');
        if (!workoutDone && prefs.workout) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'NutriSnap AI', body: "Time for your workout! Let's hit those goals. 🔥", data: { screen: '/gym-home' }, sound: true },
            trigger: { hour: 18, minute: 0, repeats: true, channelId },
          });
        }

        // Protein Reminder (if goal not reached)
        const totalProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
        if (totalProtein < (state.userProfile.protein_target || 150) && prefs.goals) {
          await Notifications.scheduleNotificationAsync({
            content: { title: 'NutriSnap AI', body: "Did you hit your protein target today? 🍗", data: { screen: '/gym-home' }, sound: true },
            trigger: { hour: 21, minute: 0, repeats: true, channelId },
          });
        }
      }
      
      console.log("Smart daily reminders scheduled based on current progress.");
    } catch (error) {
      console.log("Error scheduling smart reminders:", error);
    }
  },

  registerForPushNotificationsAsync: async () => {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
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
  },

  setupListeners: () => {
    // Listener for when a notification is received while the app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received in foreground:", notification);
    });

    // Listener for when a user interacts with a notification (clicked)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log("Notification clicked with data:", data);
      
      if (data?.screen) {
        router.push(data.screen);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }
};

export default notificationService;
