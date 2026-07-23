import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const BACKEND_URL = API_BASE_URL;

/**
 * Search for foods using the FatSecret API via our backend.
 */
export const searchFoods = async (query, fallbackNutrition = null) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/foods/search`, { query, fallbackNutrition }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get detailed nutritional information for a specific food.
 */
export const getFoodDetail = async (foodId) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/foods/${foodId}`, { timeout: 10000 });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Centralized error handler for FatSecret API calls.
 */
const handleApiError = (error) => {
  if (error.code === 'ECONNABORTED' || !error.response) {
    throw new Error('Server Offline / Connection Error');
  }

  const status = error.response.status;
  const detail = error.response.data?.detail;

  if (status === 502) {
    throw new Error('IP Blocked - Update FatSecret Whitelist');
  }
  
  if (status === 500) {
    // Backend often returns 500 if the FatSecret token or IP check fails inside
    throw new Error('Check FatSecret IP Whitelist');
  }

  throw new Error(detail || 'Food database unavailable');
};
