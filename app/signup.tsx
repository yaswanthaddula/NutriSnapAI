import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, // <--- MAKE SURE THIS IS HERE
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUserProfile, saveStoredData } = useAppStore();
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = async () => {
    if (isLoading) return;
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.registerStart(name, email, password);
      const result = response.data;
      
      if (result.success) {
        const handleNavigate = () => {
          router.push({
            pathname: '/verify-email',
            params: { 
              email: email,
              name: name,
              password: password
            }
          });
        };

        if (Platform.OS === 'web') {
          alert(result.message || `A 6-digit verification code has been sent to ${email}. Please enter it to activate your account.`);
          handleNavigate();
        } else {
          Alert.alert(
            "Verify Email", 
            result.message || `A 6-digit verification code has been sent to ${email}. Please enter it to activate your account.`,
            [{ text: "OK", onPress: handleNavigate }]
          );
        }
      } else {
        Alert.alert("Registration Failed", result.message || "Email already registered. Please login.");
      }
    } catch (error: any) {
      console.error("Registration error details:", error);
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      let errorMsg = "Could not start registration. Please try again.";
      if (!error.response) {
        errorMsg = "Network error. Please check if the backend server is running and reachable.";
      } else if (status === 404) {
        errorMsg = "Registration route not found on the server (404). Please ensure the backend is fully redeployed.";
      } else if (status === 422) {
        errorMsg = "Validation error (422). Please ensure you have entered a valid email and name.";
      } else if (status === 500) {
        errorMsg = "Server error (500). Please try again later.";
      } else if (status) {
        errorMsg = `Server error (${status}): ${detail || 'Please try again.'}`;
      }
      Alert.alert("Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.header}>Create Account</Text>
          <Text style={styles.subHeader}>Start your fitness journey today</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="John Doe" 
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="your@email.com" 
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="••••••••" 
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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

            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="••••••••" 
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={22} 
                  color="#707070" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.signUpBtn, isLoading && styles.btnDisabled]} 
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpBtnText}>{isLoading ? "Registering..." : "Continue"}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.orText}>or</Text><View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleBtn}>
            <AntDesign name="google" size={20} color="#DB4437" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 20, marginTop: 10 },
  content: { paddingHorizontal: 30, flex: 1 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#011627' },
  subHeader: { fontSize: 16, color: '#707070', marginBottom: 30 },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#011627', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    fontSize: 16 
  },
  // Updated Styles for Password inputs with icons
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 15,
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
  signUpBtn: { 
    backgroundColor: '#00C853', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
  },
  btnDisabled: { backgroundColor: '#A5D6A7' },
  signUpBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, paddingBottom: 20 },
  footerText: { color: '#707070' },
  loginLink: { color: '#00C853', fontWeight: 'bold' }
});