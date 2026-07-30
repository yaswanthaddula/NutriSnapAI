import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../_layout'; 
import { LinearGradient } from 'expo-linear-gradient';

export default function HealthTabLayout() {
  const { isDark } = useTheme();

  const theme = {
    tabBarBg: isDark ? '#1E1E1E' : '#FFFFFF',
    tabBarBorder: isDark ? '#333333' : '#F3F4F6',
    inactiveColor: isDark ? '#666666' : '#9BA3AF',
    activeColor: '#00C853', 
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#121212', '#1E1E1E'] : ['#E0F7FA', '#E8F5E9']}
        style={StyleSheet.absoluteFillObject}
      />
      <Tabs
        sceneContainerStyle={{ backgroundColor: 'transparent' }}
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.activeColor,
        tabBarInactiveTintColor: theme.inactiveColor,
        tabBarStyle: {
          height: Platform.OS === 'android' ? 70 : 85,
          paddingBottom: Platform.OS === 'android' ? 10 : 25,
          backgroundColor: theme.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* 1. HOME (Left) */}
      <Tabs.Screen
        name="health-home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 2. CAMERA (The big green floating button - 2nd Position) */}
      <Tabs.Screen
        name="camera"
        options={{
          tabBarLabel: '', 
          tabBarIcon: () => (
            <View style={styles.cameraFabContainer}>
              <View style={[styles.cameraFab, { borderColor: theme.tabBarBg }]}>
                <Ionicons name="camera-outline" size={30} color="white" />
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 4. PLANS */}
      <Tabs.Screen
        name="plans"
        options={{
          tabBarLabel: 'Plans',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 5. PROFILE (Right) */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraFabContainer: {
    top: -15, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#00C853', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 4,
  },
});