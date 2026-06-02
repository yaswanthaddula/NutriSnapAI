import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
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
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const setToken = async (value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

const deleteToken = async () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
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
        proteinTarget: response.data.protein_target
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
    };
    try {
      // Try update first, if not found try create
      const response = await api.put('/profile', payload);
      if (response && response.data) {
        response.data = {
          ...response.data,
          calorieTarget: response.data.calorie_target,
          proteinTarget: response.data.protein_target
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
            proteinTarget: response.data.protein_target
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
};

export default apiService;
