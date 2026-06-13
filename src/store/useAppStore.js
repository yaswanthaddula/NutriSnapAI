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
  reminderStatuses: {
    breakfast: 'Upcoming',
    lunch: 'Upcoming',
    dinner: 'Upcoming',
    snack: 'Upcoming',
    workout: 'Upcoming',
    sleep: 'Upcoming',
    water: 'Upcoming'
  },
  activePopup: null,
  setActivePopup: (popup) => set({ activePopup: popup }),
  
  markReminderCompleted: (type) => {
    const statuses = { ...get().reminderStatuses };
    if (statuses[type]) {
      statuses[type] = 'Completed';
      set({ reminderStatuses: statuses });
      get().saveStoredData();
    }
  },

  evaluateReminderStatuses: () => {
    const { userProfile, reminderStatuses, notificationPrefs } = get();
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const newStatuses = { ...reminderStatuses };

    const parseMinutes = (timeStr) => {
      if (!timeStr) return null;
      const match = timeStr.match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*(AM|PM)$/i);
      if (match) {
        let h = parseInt(match[1], 10);
        if (match[3].toUpperCase() === 'PM' && h < 12) h += 12;
        if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + parseInt(match[2], 10);
      }
      return null;
    };

    const types = [
      { key: 'breakfast', time: userProfile.breakfastReminderTime },
      { key: 'lunch', time: userProfile.lunchReminderTime },
      { key: 'dinner', time: userProfile.dinnerReminderTime },
      { key: 'snack', time: userProfile.snackReminderTime },
      { key: 'workout', time: userProfile.workoutReminderTime },
      { key: 'sleep', time: userProfile.sleepReminderTime },
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const { meals, workouts, waterData, todaySleep, notificationPrefs, userProfile } = get();

    // Auto-complete based on actual data
    if (meals.some(m => m.date === todayStr && m.type.toLowerCase() === 'breakfast')) newStatuses.breakfast = 'Completed';
    if (meals.some(m => m.date === todayStr && m.type.toLowerCase() === 'lunch')) newStatuses.lunch = 'Completed';
    if (meals.some(m => m.date === todayStr && m.type.toLowerCase() === 'dinner')) newStatuses.dinner = 'Completed';
    if (meals.some(m => m.date === todayStr && m.type.toLowerCase() === 'snack')) newStatuses.snack = 'Completed';
    if (workouts.some(w => w.date === todayStr)) newStatuses.workout = 'Completed';
    if (todaySleep > 0) newStatuses.sleep = 'Completed';

    types.forEach(({ key, time }) => {
      let isEnabled = false;
      if (['breakfast', 'lunch', 'dinner', 'snack'].includes(key)) isEnabled = notificationPrefs.meals;
      else if (key === 'workout') isEnabled = notificationPrefs.workout;
      else if (key === 'sleep') isEnabled = notificationPrefs.sleep;

      if (!isEnabled) {
         newStatuses[key] = 'Disabled';
         return;
      }

      if (newStatuses[key] === 'Completed') return; // Don't override Completed

      const targetMinutes = parseMinutes(time);
      if (targetMinutes !== null) {
        const activeWindowMinutes = 15;
        let newStatus = 'Upcoming';
        if (currentTotalMinutes < targetMinutes) {
          newStatus = 'Upcoming';
        } else if (currentTotalMinutes >= targetMinutes && currentTotalMinutes <= targetMinutes + activeWindowMinutes) {
          newStatus = 'Active';
        } else if (currentTotalMinutes > targetMinutes + activeWindowMinutes) {
          newStatus = 'Missed';
        }

        if (newStatuses[key] !== newStatus) {
           console.log(`[DEBUG] Reminder Status Updated: ${key} changed from ${newStatuses[key]} to ${newStatus} at device time ${now.toLocaleTimeString()}`);
           console.log("Reminder time:", time);
           console.log("Current time:", now.toLocaleTimeString());
           const activeUntil = new Date();
           activeUntil.setHours(Math.floor((targetMinutes + activeWindowMinutes) / 60), (targetMinutes + activeWindowMinutes) % 60, 0, 0);
           console.log("Active until:", activeUntil.toLocaleTimeString());
           console.log("Old status:", newStatuses[key]);
           console.log("New status:", newStatus);

           // Trigger In-App Custom Popup when entering Active
           if (newStatus === 'Active') {
               let icon = '🔔';
               if (key === 'workout') icon = '🏋️';
               else if (['breakfast', 'lunch', 'dinner', 'snack'].includes(key)) icon = '🍳';
               else if (key === 'sleep') icon = '🌙';
               else if (key === 'water') icon = '💧';

               get().setActivePopup({
                   title: 'NutriSnap AI',
                   message: `${icon} Time for your ${key} session.`,
                   type: key,
               });
           }
        }
        newStatuses[key] = newStatus;
      }
    });

    // For water interval
    if (!notificationPrefs.water) {
        newStatuses.water = 'Disabled';
    } else if (newStatuses.water !== 'Completed') {
        newStatuses.water = 'Active';
    }

    // Calculate Counts for Logging
    const counts = { Upcoming: 0, Active: 0, Completed: 0, Missed: 0 };
    Object.values(newStatuses).forEach(s => {
      if (counts[s] !== undefined) counts[s]++;
    });

    if (JSON.stringify(reminderStatuses) !== JSON.stringify(newStatuses)) {
      console.log("Counts:", counts);
    }

    set({ reminderStatuses: newStatuses });
    get().saveStoredData();
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
    saveStoredData();
    return newNotif;
  },

  markAsRead: (id) => {
    const { notifications, saveStoredData } = get();
    set({ 
      notifications: notifications.map(n => n.id === id ? { ...n, isRead: true, status: 'read' } : n) 
    });
    saveStoredData();
  },

  markAllAsRead: () => {
    const { notifications, saveStoredData } = get();
    set({ 
      notifications: notifications.map(n => ({ ...n, isRead: true, status: n.status === 'cleared' ? 'cleared' : 'read' })) 
    });
    saveStoredData();
  },

  clearNotifications: () => {
    const { notifications, saveStoredData } = get();
    set({ 
      notifications: notifications.map(n => ({ ...n, status: 'cleared', clearedAt: new Date().toISOString() })) 
    });
    saveStoredData();
  },

  clearNotification: (id) => {
    const { notifications, saveStoredData } = get();
    set({ 
      notifications: notifications.map(n => n.id === id ? { ...n, status: 'cleared', clearedAt: new Date().toISOString() } : n) 
    });
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
    const storedReminderStatuses = await storage.getData('reminderStatuses');
    
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
            reminderStatuses: {
                breakfast: 'Upcoming',
                lunch: 'Upcoming',
                dinner: 'Upcoming',
                snack: 'Upcoming',
                workout: 'Upcoming',
                sleep: 'Upcoming',
                water: 'Upcoming'
            }
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

  resetStore: async () => {
    const defaultProfile = {
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
    };
    
    set({
      userProfile: defaultProfile,
      meals: [],
      weightHistory: [],
      steps: 0,
      caloriesBurned: 0,
      lastStepDate: new Date().toISOString().split('T')[0],
      themeMode: 'light',
      workouts: [],
      activeWorkout: null,
      notificationPrefs: {
        meals: false,
        workout: false,
        water: false,
        sleep: false,
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
      activityHistory: [],
      waterHistory: [],
      notifications: [],
      reminderStatuses: {
        breakfast: 'Upcoming',
        lunch: 'Upcoming',
        dinner: 'Upcoming',
        snack: 'Upcoming',
        workout: 'Upcoming',
        sleep: 'Upcoming',
        water: 'Upcoming'
      }
    });

    const keys = [
      'userProfile', 'meals', 'themeMode', 'steps', 'caloriesBurned', 'lastStepDate', 
      'workouts', 'activeWorkout', 'weightHistory', 'notifications', 'notificationPrefs',
      'waterData', 'streak', 'lastStreakDate', 'todayMood', 'todaySleep', 'lastActiveDate',
      'activityHistory', 'waterHistory', 'reminderStatuses'
    ];
    for (const key of keys) {
      await storage.removeData(key);
    }
  },

  saveStoredData: async () => {
    const { 
      userProfile, meals, themeMode, steps, caloriesBurned, lastStepDate, 
      workouts, activeWorkout, weightHistory, notifications, notificationPrefs,       waterData, streak, lastStreakDate, todayMood, todaySleep, lastActiveDate,
      activityHistory, waterHistory, reminderStatuses
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
  }
}));

export default useAppStore;
