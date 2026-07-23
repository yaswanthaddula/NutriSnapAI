import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { loadStoredData, setUserProfile, saveStoredData } = useAppStore();
  const logoPop = useRef(new Animated.Value(0)).current;
  const fadeContent = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        await loadStoredData();
        
        const token = await apiService.getToken();
        if (!token) {
          console.log("No token found (ephemeral session cleared), forcing login.");
          useAppStore.getState().resetStore();
          setIsCheckingSession(false);
          return;
        }

        const profile = useAppStore.getState().userProfile;
        if (profile && profile.email) {
          if (profile.selected_mode) {
            const mode = profile.selected_mode.toLowerCase();
            if (mode === 'gym') {
              router.replace('/(tabs)/gym-home');
            } else {
              router.replace('/(health-tabs)/health-home');
            }
            return;
          } else {
            // Check backend before forcing redirect to profile setup
            try {
              console.log("Checking backend profile for logged-in user...");
              const profileResp = await apiService.getProfile();
              const profileData = profileResp.data;
              if (profileData && profileData.selected_mode) {
                console.log("Found profile on backend:", profileData);
                setUserProfile({
                  ...profileData,
                  name: profile.name || profileData.name,
                  email: profile.email,
                });
                await saveStoredData();
                
                const mode = profileData.selected_mode.toLowerCase();
                if (mode === 'gym') {
                  router.replace('/(tabs)/gym-home');
                } else {
                  router.replace('/(health-tabs)/health-home');
                }
                return;
              }
            } catch (backendErr) {
              console.log("No profile found on backend, routing to setup:", backendErr);
            }
            router.replace('/profile-setup');
            return;
          }
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkUserSession();

    // Start animations once the component mounts
    Animated.sequence([
      Animated.spring(logoPop, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(fadeContent, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (isCheckingSession) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#00C853" />
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#E8F5E9', '#A5D6A7']} style={styles.gradientBg}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
        
        {/* Animated 3D Logo Area */}
        <Animated.View style={[
          styles.logoWrapper, 
          { transform: [{ scale: logoPop }] }
        ]}>
          <View style={styles.logoCircle}>
            {/* 3D Apple Image from a Remote URL */}
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.appleImage}
              onLoadEnd={() => setLoading(false)}
              resizeMode="contain" 
            />
            {loading && (
              <ActivityIndicator 
                style={styles.loader} 
                color="#fff" 
              />
            )}
          </View>
        </Animated.View>

        {/* Text Area */}
        <Animated.View style={{ opacity: fadeContent, alignItems: 'center' }}>
          <Text style={styles.appName}>NutriSnap AI</Text>
          <Text style={styles.title}>Your AI-Powered Health Partner</Text>
          <Text style={styles.subtitle}>
            Snap your meals, analyze nutrients, and stay healthy with personalized AI insights.
          </Text>
        </Animated.View>

        {/* Button Area */}
        <Animated.View style={{ opacity: fadeContent, width: '100%' }}>
          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.8}
            onPress={() => router.push('/onboarding')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 80, 
    paddingHorizontal: 40 
  },
  logoWrapper: { marginTop: 40 },
  logoCircle: { 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: '#00C853', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  appleImage: {
    width: 130,
    height: 130,
  },
  loader: {
    position: 'absolute',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00C853',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: 15, 
    color: '#011627' 
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    color: '#707070', 
    lineHeight: 24,
    paddingHorizontal: 10 
  },
  button: { 
    backgroundColor: '#2E7D32', 
    width: '100%', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '900' 
  }
});