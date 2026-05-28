import React, { useState, createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, LogBox } from 'react-native';

// Ignore the SDK 53+ Expo Go notification warning/error globally
LogBox.ignoreLogs([
  'expo-notifications functionality is not fully supported in Expo Go',
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go'
]);

// 1. Create a Theme Context to hold the Dark Mode state
export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

import { notificationService } from '../src/services/notificationService';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export default function RootLayout() {
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    // Initial notification setup
    const setupNotifs = async () => {
      const granted = await notificationService.registerForPushNotificationsAsync();
      if (granted) {
        console.log("Notification permissions granted.");
        await notificationService.scheduleDailyReminders();
      } else {
        console.log("Notification permissions denied.");
      }
    };
    
    setupNotifs();

    // Listeners for foreground and interaction
    const cleanup = notificationService.setupListeners();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Onboarding Flow */}
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />

        {/* 4-Page Profile Setup Flow */}
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="profile-physical" />
        <Stack.Screen name="profile-activity" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="profile-analysis" />
        <Stack.Screen name="profile-recommendation" />
        <Stack.Screen name="profile-mode" />
        
        {/* Main App Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      
      {/* 3. StatusBar automatically changes color based on theme */}
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeContext.Provider>
  );
}

// 4. Custom hook to make it easier to use the theme in other pages
export const useTheme = () => useContext(ThemeContext);