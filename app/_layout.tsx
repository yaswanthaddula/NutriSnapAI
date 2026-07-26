import React, { useState, createContext, useContext } from 'react';
import { Stack, Head } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, LogBox, Alert, View, Text, TouchableOpacity } from 'react-native';

// Ignore the SDK 53+ Expo Go notification warning/error globally
LogBox.ignoreLogs([
  'expo-notifications functionality is not fully supported in Expo Go',
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go'
]);

// Polyfill Alert.alert for Web platform to execute callbacks and show browser alerts
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const text = message ? `${title}\n\n${message}` : title;
    alert(text);
    if (buttons && buttons.length > 0) {
      // Execute the first non-cancel button's callback
      const defaultButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
      if (defaultButton && defaultButton.onPress) {
        defaultButton.onPress();
      }
    }
  };
}

// 1. Create a Theme Context to hold the Dark Mode state
export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

import { notificationService } from '../src/services/notificationService';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import useAppStore from '../src/store/useAppStore';

const GlobalReminderPopup = () => {
  const { activePopup, setActivePopup, markReminderCompleted } = useAppStore();
  
  if (!activePopup) return null;

  return (
    <View style={{ position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, zIndex: 9999 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{activePopup.title}</Text>
      <Text style={{ fontSize: 15, color: '#555', marginTop: 8 }}>{activePopup.message}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, gap: 10 }}>
        <TouchableOpacity onPress={() => setActivePopup(null)} style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#EEE' }}>
          <Text style={{ color: '#555', fontWeight: 'bold' }}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            markReminderCompleted(activePopup.type);
            setActivePopup(null);
          }} 
          style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#00C853' }}
        >
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Open / Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function RootLayout() {
  console.log("API URL:", process.env.EXPO_PUBLIC_API_BASE_URL);
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
      <Head>
        <link rel="manifest" href="/manifest.json?v=5" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=5" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=5" />
      </Head>
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
      
      <GlobalReminderPopup />

      {/* 3. StatusBar automatically changes color based on theme */}
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeContext.Provider>
  );
}

// 4. Custom hook to make it easier to use the theme in other pages
export const useTheme = () => useContext(ThemeContext);