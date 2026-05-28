import { create } from 'zustand';
import { storage } from '../services/storageService';
import { calculateBMI, getBMIStatus, calculateBMR, calculateTargets, calculateSuggestedMode } from '../utils/calculations';

const useAppStore = create((set, get) => ({
  userProfile: {
    name: 'User',
    email: '',
    age: 25,
    height: 170,
    weight: 60,
    gender: 'Male',
    activityLevel: 'Light Active',
    goal: 'Maintain Weight',
    calorieTarget: 2000,
    proteinTarget: 100,
    carbsTarget: 250,
    fatsTarget: 70,
    bmi: 20.8,
    bmiStatus: 'Normal Weight',
    selected_mode: null,
    suggested_mode: null,
  },
  meals: [],
  weightHistory: [], // [{ date: '2023-01-01', weight: 70 }]
  steps: 0,
  caloriesBurned: 0,
  lastStepDate: new Date().toISOString().split('T')[0],
  themeMode: 'light',
  workouts: [],
  activeWorkout: null, // { id, name, startTime, pausedAt, totalPausedTime, status: 'running'|'paused'|'completed' }
  notificationPrefs: {
    meals: true,
    workout: true,
    water: true,
    goals: true,
    reports: true,
    quotes: true,
  },
  waterData: {
    date: new Date().toISOString().split('T')[0],
    waterIntake: 0,
    waterGoal: 2500,
  },
  streak: 0,
  lastStreakDate: null,
  todayMood: null,
  todaySleep: 0,
  lastActiveDate: null,
  activityHistory: [], // [{ date: '2023-01-01', steps: 5000, caloriesBurned: 200 }]
  waterHistory: [], // [{ date: '2023-01-01', amount: 2000 }]

  setUserProfile: (profile) => {
    const current = get().userProfile;
    let updated = { ...current, ...profile };
    
    // Ensure capitalization consistency
    if (updated.selected_mode) updated.selected_mode = updated.selected_mode.charAt(0).toUpperCase() + updated.selected_mode.slice(1).toLowerCase();
    
    // Recalculate if physical stats changed
    if (profile.weight || profile.height || profile.age || profile.gender || profile.activityLevel || profile.goal) {
      const bmi = calculateBMI(updated.weight, updated.height);
      const bmiStatus = getBMIStatus(bmi);
      const bmr = calculateBMR(updated.weight, updated.height, updated.age, updated.gender);
      const targets = calculateTargets(bmr, updated.activityLevel, updated.goal, updated.weight);
      
      const suggested_mode = calculateSuggestedMode(updated);
      
      Object.assign(updated, {
        bmi,
        bmiStatus,
        suggested_mode,
        ...targets
      });
    } else {
      // Even if physical stats didn't change, goal might have changed which affects suggested_mode
      updated.suggested_mode = calculateSuggestedMode(updated);
    }

    if (profile.weight && profile.weight !== current.weight) {
        get().updateWeightHistory(profile.weight);
    }
    
    set({ userProfile: updated });
    get().recalculateWaterGoal();
    get().saveStoredData();
  },
  
  updateUserProfile: (key, value) => {
    const current = get().userProfile;
    let updated = { ...current, [key]: value };
    
    // Handle Legacy Mode Mapping
    if (!updated.selected_mode && updated.mode) {
      updated.selected_mode = updated.mode;
    }
    
    // Recalculate derived fields
    const bmi = calculateBMI(updated.weight, updated.height);
    const bmiStatus = getBMIStatus(bmi);
    const bmr = calculateBMR(updated.weight, updated.height, updated.age, updated.gender);
    const targets = calculateTargets(bmr, updated.activityLevel, updated.goal, updated.weight);
    
    const suggested_mode = calculateSuggestedMode(updated);
    
    const finalProfile = {
      ...updated,
      bmi,
      bmiStatus,
      suggested_mode,
      ...targets
    };

    if (key === 'weight' && value !== current.weight) {
        get().updateWeightHistory(value);
    }
    
    set({ userProfile: finalProfile });
    get().recalculateWaterGoal();
    get().saveStoredData();
  },
  
  updateWeightHistory: (weight) => {
    const today = new Date().toISOString().split('T')[0];
    const history = [...get().weightHistory];
    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) {
        history[existingIndex].weight = weight;
    } else {
        history.push({ date: today, weight });
    }
    set({ weightHistory: history });
  },

  addMeal: (meal) => {
    const mealWithDate = {
        ...meal,
        date: meal.date || new Date().toISOString().split('T')[0]
    };
    set({ meals: [mealWithDate, ...get().meals] });
  },
  setMeals: (meals) => set({ meals }),
  deleteMeal: (id) => set({ meals: get().meals.filter(meal => meal.id !== id) }),
  
  updateSteps: (steps) => {
    const today = new Date().toISOString().split('T')[0];
    const caloriesBurned = Math.round(steps * 0.04);
    
    // Update history
    const history = [...get().activityHistory];
    const index = history.findIndex(h => h.date === today);
    if (index >= 0) {
      history[index].steps = steps;
      history[index].caloriesBurned = caloriesBurned;
    } else {
      history.push({ date: today, steps, caloriesBurned });
    }
    
    set({ steps, caloriesBurned, lastStepDate: today, activityHistory: history });
    get().saveStoredData();
  },
  setCaloriesBurned: (cals) => set({ caloriesBurned: cals }),

  // Workout Methods
  startWorkout: (workout) => set({ 
    activeWorkout: { 
      ...workout, 
      id: Date.now(),
      startTime: Date.now(), 
      pausedAt: null, 
      totalPausedTime: 0, 
      status: 'running' 
    } 
  }),
  
  pauseWorkout: () => {
    const { activeWorkout } = get();
    if (activeWorkout && activeWorkout.status === 'running') {
      set({ activeWorkout: { ...activeWorkout, status: 'paused', pausedAt: Date.now() } });
    }
  },
  
  resumeWorkout: () => {
    const { activeWorkout } = get();
    if (activeWorkout && activeWorkout.status === 'paused') {
      const pauseDuration = Date.now() - activeWorkout.pausedAt;
      set({ 
        activeWorkout: { 
          ...activeWorkout, 
          status: 'running', 
          totalPausedTime: activeWorkout.totalPausedTime + pauseDuration,
          pausedAt: null 
        } 
      });
    }
  },
  
  completeWorkout: (finalDurationSeconds) => {
    const { activeWorkout, workouts, saveStoredData } = get();
    if (activeWorkout) {
      const completedWorkout = {
        ...activeWorkout,
        status: 'completed',
        completedAt: Date.now(),
        durationSeconds: finalDurationSeconds,
        date: new Date().toISOString().split('T')[0]
      };
      
      set({ 
        workouts: [completedWorkout, ...workouts],
        activeWorkout: null
      });
      get().recalculateWaterGoal();
      saveStoredData();
      saveStoredData();
    }
  },

  completeHealthDay: (dayName, calories) => {
    const { workouts, saveStoredData } = get();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already completed today
    const exists = workouts.find(w => w.date === today && w.day === dayName && w.type === 'health');
    if (exists) return;

    const completed = {
      id: Date.now(),
      day: dayName,
      calories: calories,
      status: 'completed',
      type: 'health',
      date: today,
      completedAt: Date.now()
    };

    set({ 
      workouts: [completed, ...workouts],
      caloriesBurned: get().caloriesBurned + calories
    });
    saveStoredData();
  },

  setWorkouts: (workouts) => set({ workouts }),
  
  updateNotificationPrefs: (key, value) => {
    set({ notificationPrefs: { ...get().notificationPrefs, [key]: value } });
    get().saveStoredData();
  },

  addWater: (amount) => {
    const today = new Date().toISOString().split('T')[0];
    const current = get().waterData;
    let newAmount = amount;
    
    // Check if we need to reset for a new day
    if (current.date !== today) {
      set({ 
        waterData: { 
          date: today, 
          waterIntake: amount, 
          waterGoal: current.waterGoal 
        } 
      });
    } else {
      newAmount = current.waterIntake + amount;
      set({ 
        waterData: { 
          ...current, 
          waterIntake: newAmount 
        } 
      });
    }

    // Update history
    const history = [...get().waterHistory];
    const index = history.findIndex(h => h.date === today);
    if (index >= 0) {
      history[index].amount = newAmount;
    } else {
      history.push({ date: today, amount: newAmount });
    }
    set({ waterHistory: history });

    get().saveStoredData();
  },

  setWaterIntake: (amount) => {
    const today = new Date().toISOString().split('T')[0];
    set({ waterData: { ...get().waterData, date: today, waterIntake: amount } });
    get().saveStoredData();
  },
  
  recalculateWaterGoal: () => {
    const { userProfile, workouts } = get();
    const today = new Date().toISOString().split('T')[0];
    
    // Base Calculation
    let multiplier = 35;
    if (userProfile.age < 18) multiplier = 30;
    else if (userProfile.age > 60) multiplier = 30;
    
    let goal = userProfile.weight * multiplier;
    
    // Activity Level Adjustment
    const activity = (userProfile.activityLevel || '').toLowerCase();
    if (activity.includes('sedentary')) {
      // no extra
    } else if (activity.includes('light')) {
      goal += 300;
    } else if (activity.includes('moderate')) {
      goal += 500;
    } else if (activity.includes('very') || activity.includes('heavy') || activity.includes('athlete')) {
      goal += 750;
    }
    
    // Workout Adjustment (+500 if a workout was completed today)
    const hasWorkoutToday = workouts.some(w => w.date === today && w.status === 'completed');
    if (hasWorkoutToday) goal += 500;
    
    set({ 
      waterData: { 
        ...get().waterData, 
        waterGoal: Math.round(goal) 
      } 
    });
    get().saveStoredData();
  },
  
  toggleTheme: () => set({ themeMode: get().themeMode === 'light' ? 'dark' : 'light' }),

  setMood: (mood) => {
    set({ todayMood: mood });
    get().saveStoredData();
  },

  setSleep: (hours) => {
    set({ todaySleep: hours });
    get().saveStoredData();
  },

  updateStreak: () => {
    const { meals, steps, waterData, streak, lastStreakDate, todaySleep, saveStoredData } = get();
    const today = new Date().toISOString().split('T')[0];
    
    if (lastStreakDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasMeals = meals.some(m => m.date === today);
    const reachedWater = waterData.waterIntake >= (waterData.waterGoal || 2000);
    const reachedSteps = steps >= 10000;
    const reachedSleep = todaySleep >= 7;

    if (hasMeals || reachedWater || reachedSteps || reachedSleep) {
      if (lastStreakDate === yesterdayStr) {
        set({ streak: streak + 1, lastStreakDate: today });
      } else {
        set({ streak: 1, lastStreakDate: today });
      }
      saveStoredData();
    }
  },

  notifications: [], // [{ id, title, message, type, createdAt, isRead, key }]
  
  addNotification: (notif) => {
    const { notifications, saveStoredData } = get();
    const today = new Date().toISOString().split('T')[0];
    const uniqueKey = notif.key || `${notif.type}-${notif.title.toLowerCase().replace(/\s+/g, '-')}-${today}`;

    // 1. Check for duplicate key today
    const exists = notifications.some(n => n.key === uniqueKey);
    if (exists) return;

    // 2. Fallback check for same message within 1 hour
    const isRecentDuplicate = notifications.some(n => 
        n.type === notif.type && 
        n.message === notif.message && 
        (Date.now() - new Date(n.createdAt).getTime()) < 3600000
    );
    
    if (isRecentDuplicate) return;

    const newNotif = { 
      id: Date.now() + Math.random(), 
      createdAt: new Date().toISOString(), 
      isRead: false,
      key: uniqueKey,
      ...notif 
    };
    set({ notifications: [newNotif, ...notifications] });
    saveStoredData();
    return newNotif;
  },

  markAsRead: (id) => {
    const { notifications, saveStoredData } = get();
    set({ 
      notifications: notifications.map(n => n.id === id ? { ...n, isRead: true } : n) 
    });
    saveStoredData();
  },

  markAllAsRead: () => {
    const { notifications, saveStoredData } = get();
    set({ 
      notifications: notifications.map(n => ({ ...n, isRead: true })) 
    });
    saveStoredData();
  },

  clearNotifications: () => {
    const { saveStoredData } = get();
    set({ notifications: [] });
    saveStoredData();
  },

  loadStoredData: async () => {
    const storedProfile = await storage.getData('userProfile');
    const storedMeals = await storage.getData('meals');
    const storedTheme = await storage.getData('themeMode');
    const storedSteps = await storage.getData('steps');
    const storedCaloriesBurned = await storage.getData('caloriesBurned');
    const storedWorkouts = await storage.getData('workouts');
    const storedActiveWorkout = await storage.getData('activeWorkout');
    const storedWeightHistory = await storage.getData('weightHistory');
    const storedNotifications = await storage.getData('notifications');
    const storedNotificationPrefs = await storage.getData('notificationPrefs');
    const storedWaterData = await storage.getData('waterData');
    const storedStreak = await storage.getData('streak');
    const storedLastStreakDate = await storage.getData('lastStreakDate');
    const storedTodayMood = await storage.getData('todayMood');
    const storedTodaySleep = await storage.getData('todaySleep');
    const storedLastActiveDate = await storage.getData('lastActiveDate');
    const storedActivityHistory = await storage.getData('activityHistory');
    const storedWaterHistory = await storage.getData('waterHistory');
    
    if (storedProfile) {
      // Handle missing fields for legacy users
      // Capitalize for consistency
      if (storedProfile.selected_mode) storedProfile.selected_mode = storedProfile.selected_mode.charAt(0).toUpperCase() + storedProfile.selected_mode.slice(1).toLowerCase();

      if (!storedProfile.suggested_mode || storedProfile.suggested_mode === null) {
        storedProfile.suggested_mode = calculateSuggestedMode(storedProfile);
      }
      set({ userProfile: storedProfile });
    }
    if (storedMeals) set({ meals: storedMeals });
    if (storedTheme) set({ themeMode: storedTheme });
    if (storedSteps !== null) set({ steps: storedSteps });
    if (storedCaloriesBurned !== null) set({ caloriesBurned: storedCaloriesBurned });
    
    const storedStepDate = await storage.getData('lastStepDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (storedStepDate && storedStepDate !== today) {
      // It's a new day, reset steps
      set({ steps: 0, caloriesBurned: 0, lastStepDate: today });
      get().saveStoredData();
    } else if (storedStepDate) {
      set({ lastStepDate: storedStepDate });
    }
    if (storedWorkouts) set({ workouts: storedWorkouts });
    if (storedActiveWorkout) set({ activeWorkout: storedActiveWorkout });
    if (storedWeightHistory) set({ weightHistory: storedWeightHistory });
    if (storedNotifications) set({ notifications: storedNotifications });
    if (storedNotificationPrefs) set({ notificationPrefs: storedNotificationPrefs });
    if (storedStreak) set({ streak: storedStreak });
    if (storedLastStreakDate) set({ lastStreakDate: storedLastStreakDate });
    if (storedActivityHistory) set({ activityHistory: storedActivityHistory });
    if (storedWaterHistory) set({ waterHistory: storedWaterHistory });
    
    
    if (storedLastActiveDate) set({ lastActiveDate: storedLastActiveDate });
    
    if (storedLastActiveDate === today) {
        if (storedTodayMood !== undefined) set({ todayMood: storedTodayMood });
        if (storedTodaySleep !== undefined) set({ todaySleep: storedTodaySleep });
    } else {
        set({ todayMood: null, todaySleep: 0, lastActiveDate: today });
    }

    if (storedWaterData) {
      if (storedWaterData.date === today) {
        set({ waterData: storedWaterData });
      } else {
        // Reset for new day but keep the goal
        set({ 
          waterData: { 
            date: today, 
            waterIntake: 0, 
            waterGoal: storedWaterData.waterGoal || 2500 
          } 
        });
      }
    }
    
    // Always recalculate goal on load to ensure accuracy (e.g. after midnight reset or profile change)
    get().recalculateWaterGoal();
  },

  saveStoredData: async () => {
    const { 
      userProfile, meals, themeMode, steps, caloriesBurned, lastStepDate, 
      workouts, activeWorkout, weightHistory, notifications, notificationPrefs,       waterData, streak, lastStreakDate, todayMood, todaySleep, lastActiveDate,
      activityHistory, waterHistory
    } = get();
    await storage.saveData('userProfile', userProfile);
    await storage.saveData('meals', meals);
    await storage.saveData('themeMode', themeMode);
    await storage.saveData('steps', steps);
    await storage.saveData('caloriesBurned', caloriesBurned);
    await storage.saveData('lastStepDate', lastStepDate);
    await storage.saveData('workouts', workouts);
    await storage.saveData('activeWorkout', activeWorkout);
    await storage.saveData('weightHistory', weightHistory);
    await storage.saveData('notifications', notifications);
    await storage.saveData('notificationPrefs', notificationPrefs);
    await storage.saveData('waterData', waterData);
    await storage.saveData('streak', streak);
    await storage.saveData('lastStreakDate', lastStreakDate);
    await storage.saveData('todayMood', todayMood);
    await storage.saveData('todaySleep', todaySleep);
    await storage.saveData('lastActiveDate', lastActiveDate);
    await storage.saveData('activityHistory', activityHistory);
    await storage.saveData('waterHistory', waterHistory);
  }
}));

export default useAppStore;
