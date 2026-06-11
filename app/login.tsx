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
  ScrollView // Added ScrollView
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import apiService from '../src/services/apiService';
import useAppStore from '../src/store/useAppStore';
import { Modal } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Password
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleAccounts, setShowGoogleAccounts] = useState(false);
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
      await apiService.login(email, password);
      
      // 2. Fetch User Info (Name & Email)
      const userResp = await apiService.getMe();
      const userData = userResp.data;
      const userName = userData.name;
      const userEmail = userData.email;

      // 3. CHECK FOR PROFILE
      try {
        const profileResp = await apiService.getProfile();
        const profileData = profileResp.data;
        
        console.log("Backend profile:", profileData);
        console.log("Selected mode:", profileData.selected_mode);
        console.log("Suggested mode:", profileData.suggested_mode);

        // Save profile to store with recalculated fields
        setUserProfile({
          ...profileData,
          name: userName,
          email: userEmail,
        });
        
        await saveStoredData();

        // Navigate to correct dashboard based on selected_mode
        const mode = profileData.selected_mode?.toLowerCase();
        
        if (mode === 'gym') {
          router.replace('/(tabs)/gym-home');
        } else {
          router.replace('/(health-tabs)/health-home');
        }
      } catch (profileErr: any) {
        if (profileErr.response?.status === 404) {
          // No profile yet -> go to Setup
          console.log("No profile found, redirecting to setup.");
          setUserProfile({ name: userName, email: userEmail });
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

  const handleGoogleLogin = () => {
    // Demo only
    setShowGoogleAccounts(true);
  };

  const handleSelectMockAccount = (account: string) => {
    setShowGoogleAccounts(false);
    Alert.alert("Google Login", `Logged in as ${account} (Demo Mode)`);
    router.push('/profile-setup');
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : router.back()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>

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
                      placeholder="••••••••" 
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

            {step === 1 && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.line} />
                </View>

                <TouchableOpacity 
                  style={styles.googleBtn} 
                  onPress={handleGoogleLogin}
                >
                  <AntDesign name="google" size={20} color="#DB4437" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 20, marginTop: 10 },
  content: { paddingHorizontal: 30, flex: 1 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#011627' },
  subHeader: { fontSize: 16, color: '#707070', marginBottom: 40 },
  inputSection: { marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#011627', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 20, 
    fontSize: 16 
  },
  // Added Styles for Eye Toggle
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
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
    color: '#00C853', 
    fontWeight: 'bold', 
    marginBottom: 30,
    fontSize: 14
  },
  loginBtn: { 
    backgroundColor: '#00C853', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 4
  },
  btnDisabled: { backgroundColor: '#A5D6A7' },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  orText: { marginHorizontal: 10, color: '#AAA' },
  googleBtn: { 
    flexDirection: 'row', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    padding: 15, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  googleBtnText: { marginLeft: 10, fontWeight: '600', color: '#555' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40, paddingBottom: 20 },
  footerText: { color: '#707070' },
  signUpText: { color: '#00C853', fontWeight: 'bold' },

  // Modal Styles for Google Mock
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 8, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4285F4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  accountName: { fontSize: 14, fontWeight: '600', color: '#333' },
  accountEmail: { fontSize: 12, color: '#666' },
  closeBtn: { marginTop: 20, alignSelf: 'flex-end' },
  closeText: { color: '#4285F4', fontWeight: 'bold' }
});