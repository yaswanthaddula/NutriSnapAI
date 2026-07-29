import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
});

// Auth Token Storage Keys
const TOKEN_KEY = 'nutrisnap_auth_token';

// Helper methods for token storage to support both web and mobile
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_KEY) : null;
    }
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const setToken = async (value) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.sessionStorage.setItem(TOKEN_KEY, value);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, value);
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

const deleteToken = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error deleting token:', error);
  }
};

// Interceptor to attach token
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    console.log("API URL:", config.baseURL + (config.url || ''));
    console.log("Auth token exists:", !!token);
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token:', error);
  }
  return config;
});

export const apiService = {
  // Auth
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await setToken(response.data.access_token);
    }
    return response.data;
  },

  register: async (name, email, password) => {
    return await api.post('/auth/register', { name, email, password });
  },

  verifyEmail: async (email, code) => {
    return await api.post('/auth/verify-email', { email, code });
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  logout: async () => {
    await deleteToken();
  },

  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (email, code, newPassword) => {
    return await api.post('/auth/reset-password', { email, code, new_password: newPassword });
  },

  // File Uploads
  uploadProfilePhoto: async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
    } else {
      formData.append('file', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type,
      });
    }
    
    return await api.post('/upload/profile-photo', formData, {
      headers: {
        'Accept': 'application/json'
      }
    });
  },

  uploadMealPhoto: async (mealId, imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'meal.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    formData.append('meal_id', mealId);
    
    if (Platform.OS === 'web') {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, filename);
    } else {
      formData.append('file', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type,
      });
    }
    
    return await api.post('/upload/meal-photo', formData, {
      headers: {
        'Accept': 'application/json'
      }
    });
  },

  checkEmail: async (email) => {
    return await api.post('/auth/check-email', { email });
  },

  registerStart: async (name, email, password) => {
    return await api.post('/auth/register-start', { name, email, password });
  },

  registerVerify: async (name, email, password, code) => {
    return await api.post('/auth/register-verify', { name, email, password, code });
  },

  // Profile
  getProfile: async () => {
    const response = await api.get('/profile');
    if (response && response.data) {
      response.data = {
        ...response.data,
        calorieTarget: response.data.calorie_target,
        proteinTarget: response.data.protein_target,
        breakfastReminderTime: response.data.breakfast_reminder_time,
        lunchReminderTime: response.data.lunch_reminder_time,
        dinnerReminderTime: response.data.dinner_reminder_time,
        snackReminderTime: response.data.snack_reminder_time,
        waterReminderInterval: response.data.water_reminder_interval,
        workoutReminderTime: response.data.workout_reminder_time,
        sleepReminderTime: response.data.sleep_reminder_time
      };
    }
    return response;
  },

  saveProfile: async (profileData) => {
    const payload = {
      age: parseInt(profileData.age) || 25,
      gender: profileData.gender || 'Male',
      weight: parseFloat(profileData.weight) || 60.0,
      height: parseFloat(profileData.height) || 170.0,
      bmi: parseFloat(profileData.bmi) || 20.8,
      goal: profileData.goal || 'Maintain Weight',
      selected_mode: profileData.selected_mode || profileData.mode || 'Health',
      suggested_mode: profileData.suggested_mode || null,
      calorie_target: parseInt(profileData.calorieTarget || profileData.calorie_target || 2000),
      protein_target: parseInt(profileData.proteinTarget || profileData.protein_target || 100),
      breakfast_reminder_time: profileData.breakfastReminderTime !== undefined ? profileData.breakfastReminderTime : (profileData.breakfast_reminder_time || null),
      lunch_reminder_time: profileData.lunchReminderTime !== undefined ? profileData.lunchReminderTime : (profileData.lunch_reminder_time || null),
      dinner_reminder_time: profileData.dinnerReminderTime !== undefined ? profileData.dinnerReminderTime : (profileData.dinner_reminder_time || null),
      snack_reminder_time: profileData.snackReminderTime !== undefined ? profileData.snackReminderTime : (profileData.snack_reminder_time || null),
      water_reminder_interval: profileData.waterReminderInterval !== undefined ? profileData.waterReminderInterval : (profileData.water_reminder_interval || null),
      workout_reminder_time: profileData.workoutReminderTime !== undefined ? profileData.workoutReminderTime : (profileData.workout_reminder_time || null),
      sleep_reminder_time: profileData.sleepReminderTime !== undefined ? profileData.sleepReminderTime : (profileData.sleep_reminder_time || null),
    };
    try {
      // Try update first, if not found try create
      const response = await api.put('/profile', payload);
      if (response && response.data) {
        response.data = {
          ...response.data,
          calorieTarget: response.data.calorie_target,
          proteinTarget: response.data.protein_target,
          breakfastReminderTime: response.data.breakfast_reminder_time,
          lunchReminderTime: response.data.lunch_reminder_time,
          dinnerReminderTime: response.data.dinner_reminder_time,
          snackReminderTime: response.data.snack_reminder_time,
          waterReminderInterval: response.data.water_reminder_interval,
          workoutReminderTime: response.data.workout_reminder_time,
          sleepReminderTime: response.data.sleep_reminder_time
        };
      }
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        const response = await api.post('/profile', payload);
        if (response && response.data) {
          response.data = {
            ...response.data,
            calorieTarget: response.data.calorie_target,
            proteinTarget: response.data.protein_target,
            breakfastReminderTime: response.data.breakfast_reminder_time,
            lunchReminderTime: response.data.lunch_reminder_time,
            dinnerReminderTime: response.data.dinner_reminder_time,
            snackReminderTime: response.data.snack_reminder_time,
            waterReminderInterval: response.data.water_reminder_interval,
            workoutReminderTime: response.data.workout_reminder_time,
            sleepReminderTime: response.data.sleep_reminder_time
          };
        }
        return response;
      }
      throw error;
    }
  },

  // Meals
  addMeal: async (mealData) => {
    try {
      console.log('--- SENDING MEAL DATA ---');
      console.log(JSON.stringify(mealData, null, 2));
      const response = await api.post('/meals/', mealData);
      console.log("POST /meals response:", response.data);
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('--- BACKEND ERROR DETAILS ---');
        console.error(JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },

  getTodayMeals: async () => {
    const response = await api.get('/meals/today');
    return response.data;
  },

  deleteMeal: async (mealId) => {
    return await api.delete(`/meals/${mealId}`);
  },

  // Health Logs
  getTodayHealthLog: async () => {
    const response = await api.get('/health-logs/today');
    return response.data;
  },

  saveHealthLog: async (logData) => {
    const response = await api.post('/health-logs', logData);
    return response.data;
  },

  getHealthHistory: async () => {
    const response = await api.get('/health-logs/history');
    return response.data;
  },

  // Gym Logs
  getTodayGymLog: async () => {
    const response = await api.get('/gym-logs/today');
    return response.data;
  },

  saveGymLog: async (logData) => {
    const response = await api.post('/gym-logs', logData);
    return response.data;
  },

  getGymHistory: async () => {
    const response = await api.get('/gym-logs/history');
    return response.data;
  },

  // AI Chat History
  saveChatHistory: async (chatData) => {
    const response = await api.post('/ai-chat-history', chatData);
    return response.data;
  },

  getChatHistory: async (mode) => {
    const response = await api.get('/ai-chat-history', { params: { mode } });
    return response.data;
  },

  clearChatHistory: async (mode) => {
    const response = await api.delete('/ai-chat-history', { params: { mode } });
    return response.data;
  },

  // Reminders
  createReminder: async (data) => {
    const response = await api.post('/reminders', data);
    return response.data;
  },
  getReminders: async () => {
    const response = await api.get('/reminders');
    return response.data;
  },
  getTodayReminders: async () => {
    const response = await api.get('/reminders/today');
    return response.data;
  },
  updateReminder: async (id, data) => {
    const response = await api.put(`/reminders/${id}`, data);
    return response.data;
  },
  deleteReminder: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },

  updateReminderStatus: async (id, status) => {
    const response = await api.put(`/reminders/${id}/status?status=${status}`);
    return response.data;
  },
  triggerReminder: async (id) => {
    const response = await api.post(`/reminders/${id}/trigger`);
    return response.data;
  },
  markReminderDone: async (id) => {
    const response = await api.post(`/reminders/${id}/done`);
    return response.data;
  },
  snoozeReminder: async (id, minutes = 10) => {
    const response = await api.post(`/reminders/${id}/snooze?minutes=${minutes}`);
    return response.data;
  },
  dismissReminder: async (id) => {
    const response = await api.post(`/reminders/${id}/dismiss`);
    return response.data;
  },

  // Notification Events
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllNotificationsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },
  clearNotification: async (id) => {
    const response = await api.put(`/notifications/${id}/clear`);
    return response.data;
  },
  clearAllNotifications: async () => {
    const response = await api.put('/notifications/clear-all');
    return response.data;
  },
  triggerSmartNotifications: async (payload) => {
    const response = await api.post('/notifications/smart/trigger', payload);
    return response.data;
  },

  // Sync
  syncReminderStatuses: async (statuses) => {
    if (!statuses) {
      const response = await api.get('/sync/reminder-statuses');
      return response.data;
    }
    const response = await api.post('/sync/reminder-statuses', statuses);
    return response.data;
  },

  syncNotifications: async (notification) => {
    if (!notification) {
      const response = await api.get('/sync/notifications');
      return response.data;
    }
    const response = await api.post('/sync/notifications', notification);
    return response.data;
  },

  syncSteps: async (stepsData) => {
    if (!stepsData) {
      const response = await api.get('/sync/steps');
      return response.data;
    }
    const response = await api.post('/sync/steps', stepsData);
    return response.data;
  },

  getToken,
};

export default apiService;
