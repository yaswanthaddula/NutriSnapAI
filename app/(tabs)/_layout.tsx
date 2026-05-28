import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
// --- IMPORT THE THEME HOOK ---
import { useTheme } from '../_layout'; 

export default function TabLayout() {
  // 1. Get the global dark mode state
  const { isDark } = useTheme();

  // 2. Define colors for the bottom tab bar
  const theme = {
    tabBarBg: isDark ? '#1E1E1E' : '#FFFFFF',
    tabBarBorder: isDark ? '#333333' : '#F3F4F6',
    inactiveColor: isDark ? '#666666' : '#9BA3AF',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00C853', // Active green color stays the same
        tabBarInactiveTintColor: theme.inactiveColor,
        tabBarStyle: {
          height: Platform.OS === 'android' ? 70 : 85,
          paddingBottom: Platform.OS === 'android' ? 10 : 25,
          backgroundColor: theme.tabBarBg, // Dynamic Background
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder, // Dynamic Border
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
  name="gym-home" // Matches gym-home.tsx exactly
  options={{
    tabBarLabel: 'Home',
    tabBarIcon: ({ color }) => (
      <Ionicons name="home-outline" size={24} color={color} />
    ),
  }}
/>
      {/* 2. CAMERA (The big green floating button) */}
      <Tabs.Screen
        name="camera"
        options={{
          tabBarLabel: '', // No text label for camera
          tabBarIcon: () => (
            <View style={styles.cameraFabContainer}>
              <View style={[styles.cameraFab, { borderColor: theme.tabBarBg }]}>
                <Ionicons name="camera" size={30} color="white" />
              </View>
            </View>
          ),
        }}
      />

      {/* 3. PROGRESS */}
      <Tabs.Screen
        name="progress"
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-bar" size={26} color={color} />
          ),
        }}
      />

      {/* 4. PLANS */}
      <Tabs.Screen
        name="plans"
        options={{
          tabBarLabel: 'Plans',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 5. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cameraFabContainer: {
    top: -15, // Lift the button up
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00C853', // Brand Green
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android Shadow
    shadowColor: '#000', // iOS Shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 4,
    // borderColor is now set dynamically in the component to match tab bar bg
  },
});