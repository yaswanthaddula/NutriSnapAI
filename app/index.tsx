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
  const FORCE_ONBOARDING = true; // Set to false to enable AsyncStorage check later

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
          useAppStore.getState().logout();
          if (!FORCE_ONBOARDING) {
             // router.replace('/login');
          }
          return;
        }

        const profile = useAppStore.getState().userProfile;
        if (profile && profile.email) {
          
          // Background sync for latest user data (like profile image and physical stats) across devices
          apiService.getMe().then(userResp => {
            if (userResp && userResp.data) {
              const uData = userResp.data;
              const updates = {};
              if (uData.profile_image_url) updates.profileImage = uData.profile_image_url;
              if (uData.profile) {
                Object.assign(updates, uData.profile);
              }
              if (Object.keys(updates).length > 0) {
                useAppStore.getState().setUserProfile(updates);
                useAppStore.getState().saveStoredData();
              }
            }
          }).catch(e => console.log('Background sync user err:', e));

          if (profile.selected_mode) {
            if (!FORCE_ONBOARDING) {
              const mode = profile.selected_mode.toLowerCase();
              if (mode === 'gym') {
                router.replace('/(tabs)/gym-home');
              } else {
                router.replace('/(health-tabs)/health-home');
              }
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
                
                if (!FORCE_ONBOARDING) {
                  const mode = profileData.selected_mode.toLowerCase();
                  if (mode === 'gym') {
                    router.replace('/(tabs)/gym-home');
                  } else {
                    router.replace('/(health-tabs)/health-home');
                  }
                }
                return;
              }
            } catch (backendErr) {
              console.log("No profile found on backend, routing to setup:", backendErr);
            }
            if (!FORCE_ONBOARDING) {
              router.replace('/profile-setup');
            }
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPop, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoPop, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(fadeContent, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
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
        {/* Subtle Glowing Background Effect */}
        <View style={styles.glowOrbTop} />
        <View style={styles.glowOrbBottom} />
        
        <View style={styles.content}>
        
        {/* Animated 3D Logo Area */}
        <Animated.View style={[
          styles.logoWrapper, 
          { transform: [{ translateY: logoPop.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }] }
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
        <Animated.View style={{ opacity: fadeContent, width: '100%', paddingBottom: 20 }}>
          <TouchableOpacity 
            style={styles.buttonContainer} 
            activeOpacity={0.9}
            onPress={() => router.push('/onboarding')}
          >
            <LinearGradient colors={['#00E676', '#00C853']} style={styles.buttonGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
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
  glowOrbTop: {
    position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#FFFFFF', opacity: 0.15,
  },
  glowOrbBottom: {
    position: 'absolute', bottom: 100, left: -100, width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#FFFFFF', opacity: 0.1,
  },
  content: { 
    flex: 1, alignItems: 'center', justifyContent: 'space-between', 
    paddingTop: 100, paddingBottom: 50, paddingHorizontal: 40 
  },
  logoWrapper: { marginTop: 20 },
  logoCircle: { 
    width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFFFFF', 
    justifyContent: 'center', alignItems: 'center',
    elevation: 25, shadowColor: '#00C853', shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25, shadowRadius: 30,
  },
  appleImage: { width: 140, height: 140 },
  loader: { position: 'absolute' },
  appName: {
    fontSize: 18, fontWeight: '800', color: '#1B5E20', letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 15,
  },
  title: { 
    fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 20, 
    color: '#003300', lineHeight: 40,
  },
  subtitle: { 
    fontSize: 16, textAlign: 'center', color: '#33691E', lineHeight: 26,
    paddingHorizontal: 15, opacity: 0.9,
  },
  buttonContainer: {
    width: '100%', elevation: 12, shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15,
  },
  buttonGradient: {
    width: '100%', paddingVertical: 20, borderRadius: 30, alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 1 }
});