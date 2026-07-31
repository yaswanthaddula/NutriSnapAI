import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import apiService from '../src/services/apiService';
import useAppStore from '../src/store/useAppStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Password
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const { setUserProfile, saveStoredData } = useAppStore();
  const isSubmitting = React.useRef(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = async () => {
    if (isSubmitting.current) return;
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    // Fire and forget a ping to wake up the backend if it's on a cold start
    apiService.checkEmail(email).catch(() => {});

    // Instantly transition to password step
    setStep(2);
  };

  const handleLogin = async () => {
    if (isSubmitting.current) return;
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    try {
      // 1. Call Backend Login
      console.log("Login payload:", { email, password });
      try {
        await apiService.login(email, password);
      } catch (firstErr: any) {
        if (!firstErr.response) {
          console.log("Network error on first login attempt (possible cold start). Retrying in 500ms...");
          await new Promise(resolve => setTimeout(resolve, 500));
          await apiService.login(email, password);
        } else {
          throw firstErr;
        }
      }
      // 2. Fetch User Info and Profile
      const [
        userRespResult, 
        profileRespResult
      ] = await Promise.allSettled([
        apiService.getMe(),
        apiService.getProfile()
      ]);

      if (userRespResult.status === 'rejected') {
        throw userRespResult.reason;
      }

      const userData = userRespResult.value.data;
      const userName = userData.name;
      const userEmail = userData.email;
      const userProfileImage = userData.profile_image_url;

      // 3. CHECK FOR PROFILE
      let savedImage = null;
      try {
        const normalizedEmail = (userEmail || email).toLowerCase();
        savedImage = await AsyncStorage.getItem(`nutrisnap_avatar_${normalizedEmail}`);
      } catch (e) {}

      if (profileRespResult.status === 'fulfilled') {
        const profileData = profileRespResult.value.data;
        
        console.log("Backend profile:", profileData);
        console.log("Selected mode:", profileData.selected_mode);

        // Save profile to store with recalculated fields
        setUserProfile({
          ...profileData,
          name: userName,
          email: userEmail,
          profileImage: userProfileImage || savedImage || null
        });
        
        await saveStoredData();

        // 4. Fire off async sync requests without blocking navigation
        Promise.allSettled([
          apiService.getReminders(),
          apiService.syncNotifications(),
          apiService.syncSteps()
        ]).then(async ([remindersRespResult, notifsRespResult, stepsRespResult]) => {
          const storeUpdates: any = {};
          if (remindersRespResult.status === 'fulfilled') {
            await useAppStore.getState().fetchAndSyncReminders();
          }
          if (notifsRespResult.status === 'fulfilled' && notifsRespResult.value) {
            storeUpdates.notifications = notifsRespResult.value.map((n: any) => ({
              id: n.id,
              message: n.message,
              title: n.title,
              type: n.type,
              mode: n.mode,
              color: n.color,
              icon: n.icon,
              key: n.key,
              createdAt: n.created_at,
              isRead: true,
              status: 'read'
            }));
          }
          if (stepsRespResult.status === 'fulfilled' && stepsRespResult.value?.length > 0) {
            const latestStep = stepsRespResult.value[0];
            storeUpdates.steps = latestStep.steps || 0;
            storeUpdates.caloriesBurned = latestStep.calories_burned || 0;
            storeUpdates.lastStepDate = latestStep.date || new Date().toISOString().split('T')[0];
          }
          if (Object.keys(storeUpdates).length > 0) {
            useAppStore.setState(storeUpdates);
            await useAppStore.getState().saveStoredData();
          }
          await useAppStore.getState().syncAllUserData();
        }).catch(err => console.log("Background sync error:", err));

        // Navigate to correct dashboard based on selected_mode
        const mode = profileData.selected_mode?.toLowerCase();
        
        if (mode === 'gym') {
          router.replace('/(tabs)/gym-home');
        } else {
          router.replace('/(health-tabs)/health-home');
        }
      } else {
        const profileErr = profileRespResult.reason;
        if (profileErr.response?.status === 404) {
          // No profile yet -> go to Setup
          console.log("No profile found, redirecting to setup.");
          setUserProfile({ name: userName, email: userEmail || email, profileImage: userProfileImage || savedImage || null });
          await saveStoredData();
          router.push('/profile-setup');
        } else {
          throw profileErr;
        }
      }
    } catch (error: any) {
      console.error("Login error details:", error);
      
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (!error.response) {
        // Network Error (No response from server)
        Alert.alert("Network Error", "Could not connect to the server. Please check if the backend is running and your phone is on the same Wi-Fi.");
      } else if (status === 401) {
        Alert.alert("Login Failed", detail || "Incorrect email or password.");
      } else if (status === 404) {
        Alert.alert("API Error", "The login route was not found on the server. Please contact support.");
      } else if (status === 403 && detail?.includes("verified")) {
        const handleNavigate = () => {
          router.push({ pathname: '/verify-email', params: { email } });
        };

        if (Platform.OS === 'web') {
          // On Web, if verification is required, alert and go to verification
          alert(detail);
          handleNavigate();
        } else {
          Alert.alert("Verify Email", detail, [
            { text: "Verify Now", onPress: handleNavigate },
            { text: "Cancel", style: 'cancel' }
          ]);
        }
      } else {
        const msg = detail || "Login failed. Check credentials.";
        Alert.alert(`Error (${status || 'Unknown'})`, msg);
      }
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#4CAF50']} style={styles.gradientBg}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : router.back()}>
              <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>

            <View style={styles.glassContainer}>
              <View style={styles.content}>
            <Text style={styles.header}>{step === 1 ? "Welcome Back" : "Enter Password"}</Text>
            <Text style={styles.subHeader}>{step === 1 ? "Login to continue your journey" : `Password for ${email}`}</Text>

            <View style={styles.inputSection}>
              {step === 1 ? (
                <View>
                  <Text style={styles.label}>Email</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="your@email.com" 
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError('');
                    }}
                    autoCapitalize="none"
                  />
                  {emailError ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{emailError}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={() => setStep(1)}>
                      <Text style={{ color: '#00C853', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Change Email</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordContainer}>
                    <TextInput 
                      style={styles.passwordInput} 
                      placeholder="Enter password" 
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoFocus={true}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={22} 
                        color="#707070" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginBtn, isLoading && styles.btnDisabled]} 
              onPress={step === 1 ? handleNext : handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginBtnText}>
                {isLoading ? (step === 1 ? "Checking..." : "Logging in...") : (step === 1 ? "Next" : "Login")}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: -10,
    marginBottom: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
  errorSignUpLink: {
    marginLeft: 5,
  },
  errorSignUpLinkText: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  container: { flex: 1, backgroundColor: 'transparent' },
  gradientBg: { flex: 1 },
  glassContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    paddingVertical: 20,
  },
  backBtn: { position: 'absolute', top: 10, left: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20 },
  content: { paddingHorizontal: 30 },
  header: { fontSize: 32, fontWeight: '900', color: '#1B5E20', marginTop: 20 },
  subHeader: { fontSize: 16, color: '#388E3C', marginBottom: 40, fontWeight: '600' },
  inputSection: { marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 8 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 20, 
    fontSize: 16 
  },
  // Added Styles for Eye Toggle
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
    minHeight: 55,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
    marginRight: 5,
  },
  forgot: { 
    textAlign: 'right', 
    color: '#388E3C', 
    fontWeight: '800', 
    marginBottom: 30,
    fontSize: 14
  },
  loginBtn: { 
    backgroundColor: '#4CAF50', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  btnDisabled: { backgroundColor: '#A5D6A7' },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40, paddingBottom: 20 },
  footerText: { color: '#2E7D32', fontWeight: '600' },
  signUpText: { color: '#1B5E20', fontWeight: '900' }
});