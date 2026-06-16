import { create } from 'zustand';
import { storage } from '../services/storageService';
import { calculateBMI, getBMIStatus, calculateBMR, calculateTargets, calculateSuggestedMode } from '../utils/calculations';
import apiService from '../services/apiService';

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
    breakfastReminderTime: '08:00 AM',
    lunchReminderTime: '01:00 PM',
    dinnerReminderTime: '08:00 PM',
    snackReminderTime: '04:00 PM',
    waterReminderInterval: 'Every 1 hour',
    workoutReminderTime: '06:00 PM',
    sleepReminderTime: '10:00 PM',
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
    meals: false,
    workout: false,
    water: false,
    sleep: false,
    goals: true,
    reports: true,
    quotes: true,
    breakfastRepeat: 'Daily',
    lunchRepeat: 'Daily',
    dinnerRepeat: 'Daily',
    snackRepeat: 'Daily',
    workoutRepeat: 'Daily',
    sleepRepeat: 'Daily'
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
  reminders: [], // Array of Reminder objects from backend
  todayReminders: [], // Reminders explicitly for today
  
  fetchTodayReminders: async () => {
    try {
      const todayReminders = await apiService.getTodayReminders();
      set({ todayReminders });
    } catch (error) {
      console.log('Error fetching today reminders:', error);
    }
  },
  
  fetchAndSyncReminders: async () => {
    try {
      const fetchedReminders = await apiService.getReminders();
      console.log("Refetched reminders:", fetchedReminders);
      set({ reminders: fetchedReminders });
      
      // Sync local UI toggles (notificationPrefs) with actual backend state
      const prefs = get().notificationPrefs || {};
      const updatedPrefs = { ...prefs };
      updatedPrefs.meals = fetchedReminders.some((r: any) => ['breakfast','lunch','dinner','snack'].includes(r.reminder_type) && r.is_enabled);
      updatedPrefs.workout = fetchedReminders.some((r: any) => r.reminder_type === 'workout' && r.is_enabled);
      updatedPrefs.water = fetchedReminders.some((r: any) => r.reminder_type === 'water' && r.is_enabled);
      updatedPrefs.sleep = fetchedReminders.some((r: any) => r.reminder_type === 'sleep' && r.is_enabled);
      set({ notificationPrefs: updatedPrefs });

      get().saveStoredData();
    } catch (e) {
      console.log("Error fetching reminders:", e);
    }
  },

  markReminderDone: async (id) => {
    try {
      await apiService.markReminderDone(id);
      await get().fetchAndSyncReminders();
      await get().fetchTodayReminders();
      await get().fetchNotifications();
    } catch (e) { console.log('Error marking reminder done', e); }
  },

  snoozeReminder: async (id, minutes) => {
    try {
      await apiService.snoozeReminder(id, minutes);
      await get().fetchAndSyncReminders();
      await get().fetchTodayReminders();
      await get().fetchNotifications();
    } catch (e) { console.log('Error snoozing reminder', e); }
  },

  dismissReminder: async (id) => {
    try {
      await apiService.dismissReminder(id);
      await get().fetchAndSyncReminders();
      await get().fetchTodayReminders();
      await get().fetchNotifications();
    } catch (e) { console.log('Error dismissing reminder', e); }
  },

  deleteReminder: async (id) => {
    try {
      await apiService.deleteReminder(id);
      await get().fetchAndSyncReminders();
      await get().fetchTodayReminders();
    } catch (e) {
      console.log("Error deleting reminder:", e);
    }
  },





  setUserProfile: (profile) => {
    const current = get().userProfile;
    let updated = { ...current, ...profile };
    
    // Ensure capitalization consistency
    if (updated.selected_mode) updated.selected_mode = updated.selected_mode.charAt(0).toUpperCase() + updated.selected_mode.slice(1).toLowerCase();
    if (updated.suggested_mode) updated.suggested_mode = updated.suggested_mode.charAt(0).toUpperCase() + updated.suggested_mode.slice(1).toLowerCase();
    
    // Recalculate if physical stats changed
    if (profile.weight || profile.height || profile.age || profile.gender || profile.activityLevel || profile.goal) {
      const bmi = calculateBMI(updated.weight, updated.height);
      const bmiStatus = getBMIStatus(bmi);
      const bmr = calculateBMR(updated.weight, updated.height, updated.age, updated.gender);
      const targets = calculateTargets(bmr, updated.activityLevel, updated.goal, updated.weight);
      
      // Preserve suggested_mode if it was passed explicitly (e.g. from backend response), otherwise recalculate
      let suggested_mode = profile.suggested_mode || calculateSuggestedMode(updated);
      if (suggested_mode) suggested_mode = suggested_mode.charAt(0).toUpperCase() + suggested_mode.slice(1).toLowerCase();
      
      Object.assign(updated, {
        bmi,
        bmiStatus,
        suggested_mode,
        ...targets
      });
    } else {
      // Even if physical stats didn't change, goal might have changed which affects suggested_mode
      // But only compute if it was not explicitly provided in the profile argument
      if (profile.suggested_mode === undefined) {
        const suggested = calculateSuggestedMode(updated);
        updated.suggested_mode = suggested.charAt(0).toUpperCase() + suggested.slice(1).toLowerCase();
      }
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
    
    // Capitalize selected/suggested modes
    if (updated.selected_mode) updated.selected_mode = updated.selected_mode.charAt(0).toUpperCase() + updated.selected_mode.slice(1).toLowerCase();
    if (updated.suggested_mode) updated.suggested_mode = updated.suggested_mode.charAt(0).toUpperCase() + updated.suggested_mode.slice(1).toLowerCase();

    let suggested_mode = updated.suggested_mode;
    if (key === 'age' || key === 'weight' || key === 'height' || key === 'gender' || key === 'activityLevel' || key === 'goal') {
      const suggested = calculateSuggestedMode(updated);
      suggested_mode = suggested.charAt(0).toUpperCase() + suggested.slice(1).toLowerCase();
    }
    
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
    apiService.syncSteps({ steps, calories_burned: caloriesBurned, date: today }).catch(e => console.log('Sync err:', e));
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
      status: 'unread',
      key: uniqueKey,
      ...notif 
    };
    set({ notifications: [newNotif, ...notifications] });
    get().saveStoredData();
    
    // Sync to backend (fire and forget)
    apiService.syncNotifications({
      message: newNotif.message,
      title: newNotif.title,
      type: newNotif.type,
      mode: newNotif.mode || 'health',
      color: newNotif.color || '#000000',
      icon: newNotif.icon || 'bell',
      key: uniqueKey,
      date: today
    }).catch(e => console.log('Sync err:', e));

    return newNotif;
  },

  fetchNotifications: async () => {
    try {
      const fetched = await apiService.getNotifications();
      console.log("Notification bell response:", fetched);
      // Map backend fields to frontend fields if needed, but if backend matches, just set it
      // Backend returns: id, title, message, status, type, created_at, delivered_at
      const mapped = fetched.map((n: any) => ({
        ...n,
        isRead: n.status === 'Read' || n.status === 'read',
        createdAt: n.created_at || n.createdAt
      }));
      set({ notifications: mapped });
      get().saveStoredData();
    } catch (e) {
      console.log('Error fetching notifications:', e);
    }
  },

  markAsRead: async (id) => {
    try {
      await apiService.markNotificationRead(id);
      await get().fetchNotifications();
    } catch (e) {
      console.log('Error marking notification read:', e);
      // Fallback to local
      const { notifications, saveStoredData } = get();
      set({ 
        notifications: notifications.map(n => n.id === id ? { ...n, isRead: true, status: 'read' } : n) 
      });
      saveStoredData();
    }
  },

  markAllAsRead: async () => {
    try {
      await apiService.markAllNotificationsRead();
      await get().fetchNotifications();
    } catch (e) {
      console.log('Error marking all read:', e);
      // Fallback
      const { notifications, saveStoredData } = get();
      set({ 
        notifications: notifications.map(n => ({ ...n, isRead: true, status: n.status === 'cleared' ? 'cleared' : 'read' })) 
      });
      saveStoredData();
    }
  },

  clearNotifications: async () => {
    try {
      await apiService.clearAllNotifications();
      await get().fetchNotifications();
    } catch (e) {
      console.log('Error clearing all notifications:', e);
      // Fallback
      const { notifications, saveStoredData } = get();
      set({ 
        notifications: notifications.map(n => ({ ...n, status: 'cleared', clearedAt: new Date().toISOString() })) 
      });
      saveStoredData();
    }
  },

  clearNotification: async (id) => {
    try {
      await apiService.clearNotification(id);
      await get().fetchNotifications();
    } catch (e) {
      console.log('Error clearing notification:', e);
      // Fallback
      const { notifications, saveStoredData } = get();
      set({ 
        notifications: notifications.map(n => n.id === id ? { ...n, status: 'cleared', clearedAt: new Date().toISOString() } : n) 
      });
      saveStoredData();
    }
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
    const storedReminderStatuses = await storage.getData('reminderStatuses');
    const storedReminders = await storage.getData('reminders');
    
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
    if (storedReminderStatuses) set({ reminderStatuses: storedReminderStatuses });
    if (storedReminders) set({ reminders: storedReminders });
    
    
    if (storedLastActiveDate) set({ lastActiveDate: storedLastActiveDate });
    
    if (storedLastActiveDate === today) {
        if (storedTodayMood !== undefined) set({ todayMood: storedTodayMood });
        if (storedTodaySleep !== undefined) set({ todaySleep: storedTodaySleep });
    } else {
        // New Day Reset
        set({ 
            todayMood: null, 
            todaySleep: 0, 
            lastActiveDate: today,
            reminderStatuses: {}
        });
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

  logout: async () => {
    set({
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
        breakfastReminderTime: '08:00 AM',
        lunchReminderTime: '01:00 PM',
        dinnerReminderTime: '08:00 PM',
        snackReminderTime: '04:00 PM',
        waterReminderInterval: 'Every 1 hour',
        workoutReminderTime: '06:00 PM',
        sleepReminderTime: '10:00 PM',
      },
      meals: [],
      weightHistory: [],
      steps: 0,
      caloriesBurned: 0,
      workouts: [],
      activeWorkout: null,
      waterData: { date: new Date().toISOString().split('T')[0], waterIntake: 0, waterGoal: 2500 },
      streak: 0,
      lastStreakDate: null,
      todayMood: null,
      todaySleep: 0,
      lastActiveDate: null,
      activityHistory: [],
      waterHistory: [],
      reminders: [],
      todayReminders: [],
      reminderStatuses: {},
      notifications: [],
      notificationPrefs: {
        meals: false, workout: false, water: false, sleep: false,
        goals: true, reports: true, quotes: true,
        breakfastRepeat: 'Daily', lunchRepeat: 'Daily', dinnerRepeat: 'Daily',
        snackRepeat: 'Daily', workoutRepeat: 'Daily', sleepRepeat: 'Daily'
      },
    });

    const keys = [
      'userProfile', 'meals', 'themeMode', 'steps', 'caloriesBurned', 'lastStepDate', 
      'workouts', 'activeWorkout', 'weightHistory', 'notifications', 'notificationPrefs',
      'waterData', 'streak', 'lastStreakDate', 'todayMood', 'todaySleep', 'lastActiveDate',
      'activityHistory', 'waterHistory', 'reminderStatuses', 'reminders', 'todayReminders'
    ];
    for (const key of keys) {
      await storage.removeData(key);
    }
  },

  saveStoredData: async () => {
    const { 
      userProfile, meals, themeMode, steps, caloriesBurned, lastStepDate, 
      workouts, activeWorkout, weightHistory, notifications, notificationPrefs,       waterData, streak, lastStreakDate, todayMood, todaySleep, lastActiveDate,
      activityHistory, waterHistory, reminderStatuses, reminders
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
    await storage.saveData('reminderStatuses', reminderStatuses);
    await storage.saveData('reminders', reminders);
    await storage.saveData('todayReminders', get().todayReminders);
  }
}));

export default useAppStore;
