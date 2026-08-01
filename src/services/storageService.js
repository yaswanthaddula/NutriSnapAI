import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save data to local storage
 * @param {string} key 
 * @param {any} value 
 */
export const saveData = async (key, value) => {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
      return;
    }
    const jsonValue = JSON.stringify(value);
    if (jsonValue === undefined) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving data to AsyncStorage', e);
  }
};

/**
 * Get data from local storage
 * @param {string} key 
 * @returns {any}
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading data from AsyncStorage', e);
    return null;
  }
};

/**
 * Remove data from local storage
 * @param {string} key 
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing data from AsyncStorage', e);
  }
};

export const storage = {
  saveData,
  getData,
  removeData
};
