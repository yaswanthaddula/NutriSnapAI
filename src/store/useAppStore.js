import { create } from 'zustand';
import { storage } from '../services/storageService';
import { calculateBMI, getBMIStatus, calculateBMR, calculateTargets, calculateSuggestedMode } from '../utils/calculations';
import apiService from '../services/apiService';

const useAppStore = create((set, get) => ({
  userProfile: {
    name: 'User',
    email: '',
    profileImage: null,
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
    goals: false,
    reports: false,
    quotes: false,
    breakfastRepeat: 'Daily',
    lunchRepeat: 'Daily',
    dinnerRepeat: 'Daily',
    snackRepeat: 'Daily',
    workoutRepeat: 'Daily',
    sleepRepeat: 'Daily'
  },
  healthNotificationSound: 'default_bell',
  gymNotificationSound: 'default_bell',
  setHealthNotificationSound: (sound) => {
    set({ healthNotificationSound: sound });
    get().saveStoredData();
  },
  setGymNotificationSound: (sound) => {
    set({ gymNotificationSound: sound });
    get().saveStoredData();
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
  medicineReminders: [],
  addMedicineReminder: (reminder) => {
    set((state) => ({ medicineReminders: [...(state.medicineReminders || []), { id: Date.now().toString(), ...reminder }] }));
    get().saveStoredData();
  },
  deleteMedicineReminder: (id) => {
    set((state) => ({ medicineReminders: (state.medicineReminders || []).filter(r => r.id !== id) }));
    get().saveStoredData();
  },
  todayReminders: [], // Reminders explicitly for today
  
  fetchTodayReminders: async () => {
    try {
      const todayReminders = await apiService.getTodayReminders();
      set({ todayReminders });
      // After fetching, silently check if any are missed
      get().checkMissedReminders();
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
      updatedPrefs.meals = fetchedReminders.some((r) => ['breakfast','lunch','dinner','snack'].includes(r.reminder_type) && r.is_enabled);
      updatedPrefs.workout = fetchedReminders.some((r) => r.reminder_type === 'workout' && r.is_enabled);
      updatedPrefs.water = fetchedReminders.some((r) => r.reminder_type === 'water' && r.is_enabled);
      updatedPrefs.sleep = fetchedReminders.some((r) => r.reminder_type === 'sleep' && r.is_enabled);
      set({ notificationPrefs: updatedPrefs });

      get().saveStoredData();
    } catch (e) {
      console.log("Error fetching reminders:", e);
    }
  },

  markReminderDone: async (id) => {
    try {
      // Optimistic UI Update
      set((state) => ({
        todayReminders: state.todayReminders.map(r => 
          r.id === id ? { ...r, status: 'Completed' } : r
        )
      }));
      await apiService.markReminderDone(id);
      await get().fetchAndSyncReminders();
      await get().fetchNotifications();
    } catch (e) { console.log('Error marking reminder done', e); }
  },

  snoozeReminder: async (id, minutes) => {
    try {
      // Optimistic UI Update
      set((state) => ({
        todayReminders: state.todayReminders.map(r => 
          r.id === id ? { ...r, status: 'Snoozed' } : r
        )
      }));
      await apiService.snoozeReminder(id, minutes);
      await get().fetchAndSyncReminders();
      await get().fetchNotifications();
    } catch (e) { console.log('Error snoozing reminder', e); }
  },

  dismissReminder: async (id) => {
    try {
      // Optimistic UI Update
      set((state) => ({
        todayReminders: state.todayReminders.map(r => 
          r.id === id ? { ...r, status: 'Dismissed' } : r
        )
      }));
      await apiService.dismissReminder(id);
      await get().fetchAndSyncReminders();
      await get().fetchNotifications();
    } catch (e) { console.log('Error dismissing reminder', e); }
  },

  checkMissedReminders: async () => {
    try {
      const { todayReminders } = get();
      if (!todayReminders || todayReminders.length === 0) return;
      
      let missedFound = false;
      const now = new Date();
      
      for (const r of todayReminders) {
        if (r.status === 'Active' || r.status === 'Pending' || r.status === 'Upcoming') {
          // Compare times
          if (r.next_trigger_at) {
            const triggerTime = new Date(r.next_trigger_at);
            // If it's more than 30 mins past the trigger time
            if (now.getTime() - triggerTime.getTime() > 30 * 60000) {
              await apiService.updateReminderStatus(r.id, 'Missed');
              missedFound = true;
              
              // Add a missing notification
              get().addNotification({
                 title: `${r.reminder_type.charAt(0).toUpperCase() + r.reminder_type.slice(1)} Missing`,
                 message: `You have not logged your ${r.reminder_type} today.`,
                 type: r.reminder_type,
                 mode: ['workout', 'protein', 'gym'].includes(r.reminder_type.toLowerCase()) ? 'gym' : 'health'
              });
            }
          }
        }
      }
      
      if (missedFound) {
        await get().fetchTodayReminders();
      }
    } catch(e) { console.log('Error checking missed reminders', e); }
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
    if (meal.imageUri) {
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.getItem('nutrisnap_meal_images').then((data) => {
          const cache = data ? JSON.parse(data) : {};
          const key = `${meal.name}_${meal.time}`;
          cache[key] = meal.imageUri;
          AsyncStorage.setItem('nutrisnap_meal_images', JSON.stringify(cache));
        }).catch(e => console.log("Failed to cache meal image", e));
      });
    }
    set({ meals: [mealWithDate, ...get().meals] });
    
    // Automatic Reminder Completion
    const hour = parseInt(mealWithDate.time ? mealWithDate.time.split(':')[0] : new Date().getHours());
    let mealType = 'snack';
    if (hour >= 5 && hour < 11) mealType = 'breakfast';
    else if (hour >= 11 && hour < 15) mealType = 'lunch';
    else if (hour >= 15 && hour < 18) mealType = 'snack';
    else if (hour >= 18) mealType = 'dinner';
    
    const { todayReminders, markReminderDone, addNotification } = get();
    if (todayReminders) {
       const matchedReminder = todayReminders.find(r => r.reminder_type === mealType && (r.status === 'Pending' || r.status === 'Active' || r.status === 'Upcoming'));
       if (matchedReminder) {
           markReminderDone(matchedReminder.id);
           addNotification({
              title: `✅ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Completed`,
              message: `Great job! Your ${mealType} has been logged.`,
              type: mealType,
              mode: 'health'
           });
       }
    }
  },
  setMeals: (meals) => set({ meals }),
  deleteMeal: (id) => set({ meals: get().meals.filter(meal => meal.id !== id) }),
  
  updateSteps: (steps) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
      
      // Automatic Reminder Completion
      const { todayReminders, markReminderDone, addNotification } = get();
      if (todayReminders) {
         const matchedReminder = todayReminders.find(r => r.reminder_type === 'workout' && (r.status === 'Pending' || r.status === 'Active' || r.status === 'Upcoming'));
         if (matchedReminder) {
             markReminderDone(matchedReminder.id);
             addNotification({
                title: `✅ Workout Completed`,
                message: `Great job! You crushed your workout today.`,
                type: 'workout',
                mode: 'gym'
             });
         }
      }
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
    
    // Automatic Reminder Completion
    const { todayReminders, markReminderDone, addNotification } = get();
    if (newAmount >= (current.waterGoal || 2500) && todayReminders) {
       const matchedReminder = todayReminders.find(r => r.reminder_type === 'water' && (r.status === 'Pending' || r.status === 'Active' || r.status === 'Upcoming'));
       if (matchedReminder) {
           markReminderDone(matchedReminder.id);
           addNotification({
              title: `✅ Water Goal Completed`,
              message: `Great job! You met your hydration goal.`,
              type: 'water',
              mode: 'health'
           });
       }
    }
  },

  setWaterIntake: (amount) => {
    const today = new Date().toISOString().split('T')[0];
    set({ waterData: { ...get().waterData, date: today, waterIntake: amount } });
    get().saveStoredData();
    
    // Automatic Reminder Completion
    const { waterData, todayReminders, markReminderDone, addNotification } = get();
    if (waterData.waterIntake >= (waterData.waterGoal || 2500) && todayReminders) {
       const matchedReminder = todayReminders.find(r => r.reminder_type === 'water' && (r.status === 'Pending' || r.status === 'Active' || r.status === 'Upcoming'));
       if (matchedReminder) {
           markReminderDone(matchedReminder.id);
           addNotification({
              title: `✅ Water Goal Completed`,
              message: `Great job! You met your hydration goal.`,
              type: 'water',
              mode: 'health'
           });
       }
    }
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

  generateSmartNotifications: () => {
    const { userProfile, meals, workouts, waterData, addNotification, notificationPrefs, reminders } = get();
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    
    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      const ampmMatch = timeStr.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)$/i);
      if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        if (ampmMatch[3].toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampmMatch[3].toUpperCase() === 'AM' && h === 12) h = 0;
        const d = new Date();
        d.setHours(h, parseInt(ampmMatch[2], 10), 0, 0);
        return d;
      }
      return null;
    };

    const getMealType = (timeStr) => {
      if (!timeStr) return 'Snack';
      const [h] = timeStr.split(':');
      const hour = parseInt(h);
      if (hour >= 5 && hour < 11) return 'Breakfast';
      if (hour >= 11 && hour < 15) return 'Lunch';
      if (hour >= 15 && hour < 19) return 'Snack';
      return 'Dinner';
    };

    const calculateMealTotals = (mealList) => {
      let c = 0; let p = 0; let cb = 0; let f = 0;
      mealList.forEach(m => {
        c += parseInt(m.calories) || 0;
        p += parseInt(m.protein) || 0;
        cb += parseInt(m.carbs) || 0;
        f += parseInt(m.fats) || 0;
      });
      return { c, p, cb, f };
    };

    if (notificationPrefs?.meals !== false) {
      const breakfastTime = parseTime(userProfile.breakfastReminderTime || '08:00 AM');
      if (breakfastTime) {
        const hasBreakfast = meals.some(m => m.date === todayStr && getMealType(m.time) === 'Breakfast');
        if (hasBreakfast) {
          addNotification({ title: 'Breakfast Logged', message: `Great job!\nYou successfully logged your breakfast.`, type: 'meal_breakfast_logged', mode: 'health', icon: 'egg-fried', color: '#10B981' });
        } else if (now >= breakfastTime) {
          const missedByHours = (now.getTime() - breakfastTime.getTime()) / 3600000;
          if (missedByHours > 2) {
             addNotification({ title: 'Breakfast Missed', message: `⚠️ Breakfast was not logged today.\nRemember that it's the most important meal!`, type: 'meal_breakfast_missed', mode: 'health', icon: 'alert', color: '#EF4444' });
          } else {
             addNotification({ title: 'Breakfast Reminder', message: `Good Morning!\nIt's ${userProfile.breakfastReminderTime || '8:00 AM'}.\nTime to log your breakfast.`, type: 'meal_breakfast', mode: 'health', icon: 'egg-fried' });
          }
        }
      }
      
      const lunchTime = parseTime(userProfile.lunchReminderTime || '01:00 PM');
      if (lunchTime) {
        const hasLunch = meals.some(m => m.date === todayStr && getMealType(m.time) === 'Lunch');
        if (hasLunch) {
          addNotification({ title: 'Lunch Logged', message: `Awesome!\nYou logged your lunch.`, type: 'meal_lunch_logged', mode: 'health', icon: 'food-variant', color: '#10B981' });
        } else if (now >= lunchTime) {
          addNotification({ title: 'Lunch Reminder', message: `It's ${userProfile.lunchReminderTime || '1:00 PM'}.\nTime for lunch.`, type: 'meal_lunch', mode: 'health', icon: 'food-variant' });
        }
      }

      const dinnerTime = parseTime(userProfile.dinnerReminderTime || '08:00 PM');
      if (dinnerTime) {
        const hasDinner = meals.some(m => m.date === todayStr && getMealType(m.time) === 'Dinner');
        if (hasDinner) {
          addNotification({ title: 'Dinner Logged', message: `Perfect!\nYou logged your dinner.`, type: 'meal_dinner_logged', mode: 'health', icon: 'silverware-fork-knife', color: '#10B981' });
        } else if (now >= dinnerTime) {
          addNotification({ title: 'Dinner Reminder', message: `It's ${userProfile.dinnerReminderTime || '8:00 PM'}.\nTime to log your dinner.`, type: 'meal_dinner', mode: 'health', icon: 'silverware-fork-knife' });
        }
      }
    }
    
    // Check Goals
    const todayMeals = meals.filter(m => m.date === todayStr);
    const { c: totalCalories } = calculateMealTotals(todayMeals);
    if (userProfile.calorieTarget > 0 && totalCalories >= userProfile.calorieTarget) {
       addNotification({ title: 'Daily Nutrition Goal Completed', message: `🎯 Congratulations!\nYou reached today's calorie goal.`, type: 'goal_calories_met', mode: 'health', icon: 'trophy', color: '#F59E0B' });
    }

    if (notificationPrefs?.workout !== false) {
      const workoutTime = parseTime(userProfile.workoutReminderTime || '06:00 PM');
      if (workoutTime && now >= workoutTime) {
        const hasWorkout = workouts.some(w => w.date === todayStr);
        if (!hasWorkout) {
          addNotification({ title: 'Workout Reminder', message: "Time to complete today's workout.", type: 'workout_pending', mode: 'gym' });
        }
      }
    }

    if (notificationPrefs?.water !== false) {
      if (currentHour >= 12 && waterData.waterIntake < (waterData.waterGoal * 0.3)) {
        addNotification({ title: 'Water Reminder', message: "Drink one glass of water.", type: 'water_reminder', mode: 'health' });
      }
    }

    if (reminders && reminders.length > 0) {
      reminders.forEach(r => {
        if (r.is_enabled) {
          const rTime = parseTime(r.reminder_time);
          if (rTime && now >= rTime) {
            const rMode = (r.reminder_type === 'workout' || r.reminder_type === 'gym') ? 'gym' : 'health';
            addNotification({ title: r.title, message: `Time for your ${r.title.toLowerCase()}.`, type: 'custom_reminder', mode: rMode });
          }
        }
      });
    }
    if (medicineReminders && medicineReminders.length > 0) {
      medicineReminders.forEach(r => {
        if (r.enabled !== false) {
          const rTime = parseTime(r.time);
          if (rTime && now >= rTime) {
            addNotification({ title: 'Medicine Reminder', message: `It's time to take your medicine:\n${r.name}`, type: 'medicine_reminder', mode: 'health', icon: 'pill' });
          }
        }
      });
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
      id: 'local_' + Date.now() + '_' + Math.random(), 
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
      if (fetched && Array.isArray(fetched)) {
        const mapped = fetched.map(n => ({
          ...n,
          isRead: n.status === 'Read' || n.status === 'read',
          createdAt: n.created_at || n.createdAt
        }));
        
        // Merge with existing local notifications to prevent losing them
        const { notifications } = get();
        const existingLocals = notifications.filter(n => n.id && n.id.toString().startsWith('local_'));
        
        const merged = [...mapped, ...existingLocals].reduce((acc, current) => {
          const x = acc.find(item => item.title === current.title && item.message === current.message && item.type === current.type);
          if (!x) return acc.concat([current]);
          return acc;
        }, []);

        set({ notifications: merged });
        get().saveStoredData();
      }
    } catch (e) {
      console.log('Error fetching notifications:', e);
    }
    get().generateSmartNotifications();
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
    const storedHealthSound = await storage.getData('healthNotificationSound');
    const storedGymSound = await storage.getData('gymNotificationSound');
    
    let avatar = null;
    if (storedProfile && storedProfile.email) {
      try {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        avatar = await AsyncStorage.getItem(`nutrisnap_avatar_${storedProfile.email.toLowerCase()}`);
      } catch (e) {
        console.log("Failed to load avatar in loadStoredData", e);
      }
    }

    let mealImageCache = {};
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const cacheData = await AsyncStorage.getItem('nutrisnap_meal_images');
      if (cacheData) mealImageCache = JSON.parse(cacheData);
    } catch (e) {}
    
    if (storedProfile) {
      // Handle missing fields for legacy users
      // Capitalize for consistency
      if (storedProfile.selected_mode) storedProfile.selected_mode = storedProfile.selected_mode.charAt(0).toUpperCase() + storedProfile.selected_mode.slice(1).toLowerCase();

      if (!storedProfile.suggested_mode || storedProfile.suggested_mode === null) {
        storedProfile.suggested_mode = calculateSuggestedMode(storedProfile);
      }
      
      if (avatar) {
        storedProfile.profileImage = avatar;
      }

      set({ userProfile: storedProfile });
    }

    if (storedMeals) {
      // Hydrate meals with their actual cached images
      const hydratedMeals = storedMeals.map(meal => {
        const key = `${meal.name}_${meal.time}`;
        if (mealImageCache[key]) {
          return { ...meal, imageUri: mealImageCache[key] };
        }
        return meal;
      });
      set({ meals: hydratedMeals });
    }
    if (storedTheme) set({ themeMode: storedTheme });
    if (storedSteps !== null) set({ steps: storedSteps });
    
    get().generateSmartNotifications();
    
    if (storedCaloriesBurned !== null) set({ caloriesBurned: storedCaloriesBurned });
    
    const storedStepDate = await storage.getData('lastStepDate');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
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
    if (storedHealthSound) set({ healthNotificationSound: storedHealthSound });
    if (storedGymSound) set({ gymNotificationSound: storedGymSound });
    
    const storedMedicineReminders = await storage.getData('medicineReminders');
    if (storedMedicineReminders) set({ medicineReminders: storedMedicineReminders });
    
    
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

  checkNewDay: () => {
    const today = new Date().toISOString().split('T')[0];
    const { lastStepDate, steps, caloriesBurned, activityHistory, waterData, lastActiveDate, reminderStatuses } = get();
    
    let needsSave = false;

    // 1. Reset Steps & Calories if day changed
    if (lastStepDate && lastStepDate !== today) {
      // Ensure history is updated before reset
      const history = [...activityHistory];
      const index = history.findIndex(h => h.date === lastStepDate);
      if (index >= 0) {
        history[index].steps = steps;
        history[index].caloriesBurned = caloriesBurned;
      } else {
        history.push({ date: lastStepDate, steps, caloriesBurned });
      }

      set({ 
        steps: 0, 
        caloriesBurned: 0, 
        lastStepDate: today,
        activityHistory: history 
      });
      needsSave = true;
    }

    // 2. Reset Water if day changed
    if (waterData && waterData.date !== today) {
      set({ 
        waterData: { 
          date: today, 
          waterIntake: 0, 
          waterGoal: waterData.waterGoal || 2500 
        } 
      });
      needsSave = true;
    }

    // 3. Reset Daily Sleep/Mood/Reminders
    if (lastActiveDate !== today) {
      set({ 
        todayMood: null, 
        todaySleep: 0, 
        lastActiveDate: today,
        reminderStatuses: {}
      });
      needsSave = true;
    }

    if (needsSave) {
      get().saveStoredData();
    }
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
      medicineReminders: [],
      todayReminders: [],
      reminderStatuses: {},
      notifications: [],
      notificationPrefs: {
        meals: false, workout: false, water: false, sleep: false,
        goals: true, reports: true, quotes: true,
        breakfastRepeat: 'Daily', lunchRepeat: 'Daily', dinnerRepeat: 'Daily',
        snackRepeat: 'Daily', workoutRepeat: 'Daily', sleepRepeat: 'Daily'
      },
      healthNotificationSound: 'default_bell',
      gymNotificationSound: 'default_bell',
    });

    const keys = [
      'userProfile', 'meals', 'themeMode', 'steps', 'caloriesBurned', 'lastStepDate', 
      'workouts', 'activeWorkout', 'weightHistory', 'notifications', 'notificationPrefs',
      'waterData', 'streak', 'lastStreakDate', 'todayMood', 'todaySleep', 'lastActiveDate',
      'activityHistory', 'waterHistory', 'reminderStatuses', 'reminders', 'todayReminders',
      'healthNotificationSound', 'gymNotificationSound'
    ];
    for (const key of keys) {
      await storage.removeData(key);
    }
  },

  saveStoredData: async () => {
    const { 
      userProfile, meals, themeMode, steps, caloriesBurned, lastStepDate, 
      workouts, activeWorkout, weightHistory, notifications, notificationPrefs, healthNotificationSound, gymNotificationSound, waterData, streak, lastStreakDate, todayMood, todaySleep, lastActiveDate,
      activityHistory, waterHistory, reminderStatuses, reminders, medicineReminders
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
    await storage.saveData('healthNotificationSound', healthNotificationSound);
    await storage.saveData('gymNotificationSound', gymNotificationSound);
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
    await storage.saveData('medicineReminders', medicineReminders);
    await storage.saveData('todayReminders', get().todayReminders);
  }
}));

export default useAppStore;
