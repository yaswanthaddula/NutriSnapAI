import React, { useState } from 'react';
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
  ScrollView
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../src/services/apiService';
import { LinearGradient } from 'expo-linear-gradient';

export default function VerifyEmailScreen() {
  const { email, name, password } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const isSubmitting = React.useRef(false);

  React.useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (isSubmitting.current || timer > 0) return;
    
    isSubmitting.current = true;
    setIsLoading(true);
    try {
      if (name && password) {
         // Resend for new registration
         await apiService.registerStart(name as string, email as string, password as string);
      } else {
         // Resend for forgot password or old flow
         await apiService.forgotPassword(email as string); 
      }
      Alert.alert("Sent", "A new verification code has been sent to your email.");
      setTimer(60);
    } catch (error) {
      Alert.alert("Error", "Failed to resend code.");
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (isSubmitting.current) return;
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code.");
      return;
    }

    if (timer === 0) {
      Alert.alert("Expired", "Code has expired. Please resend code.");
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    try {
      if (name && password) {
        // New flow: Register only after verification
        await apiService.registerVerify(name as string, email as string, password as string, code);
      } else {
        // Fallback for old flow
        await apiService.verifyEmail(email as string, code);
      }
      const handleNavigate = () => {
        router.replace('/login');
      };

      if (Platform.OS === 'web') {
        alert("Account verified! You can now log in.");
        handleNavigate();
      } else {
        Alert.alert("Success", "Account verified! You can now log in.", [
          { text: "Login", onPress: handleNavigate }
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Invalid code. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#4CAF50']} style={styles.gradientBg}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>

            <View style={styles.glassContainer}>
              <View style={styles.content}>
                <Text style={styles.header}>Verify Email</Text>
                <Text style={styles.subHeader}>Enter the 6-digit code sent to {email}</Text>

                <View style={styles.inputSection}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput 
              style={[styles.input, !code && styles.placeholderInput]} 
              placeholder="123456" 
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
          </View>

          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, timer === 0 && { color: '#FF5252' }]}>
              {timer > 0 ? `Code expires in ${timer}s` : "Code expired"}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.verifyBtn, (isLoading || timer === 0) && styles.btnDisabled]} 
            onPress={handleVerify}
            disabled={isLoading || timer === 0}
          >
            <Text style={styles.verifyBtnText}>{isLoading ? "Verifying..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendBtn} 
            onPress={handleResend}
            disabled={timer > 0 || isLoading}
          >
            <Text style={[styles.resendText, timer > 0 && { color: '#CCC' }]}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  content: { paddingHorizontal: 30, paddingBottom: 20 },
  header: { fontSize: 32, fontWeight: '900', color: '#1B5E20', marginTop: 20, marginBottom: 10 },
  subHeader: { fontSize: 16, color: '#388E3C', marginBottom: 40, fontWeight: '600' },
  inputSection: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 8 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    padding: 15, 
    borderRadius: 16, 
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
    fontWeight: 'bold'
  },
  placeholderInput: {
    fontWeight: 'normal',
    letterSpacing: 0,
    fontSize: 16
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  timerText: {
    fontSize: 14,
    color: '#707070',
    fontWeight: '500'
  },
  verifyBtn: { 
    backgroundColor: '#4CAF50', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    marginTop: 20,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  btnDisabled: { backgroundColor: '#A5D6A7' },
  verifyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resendBtn: { marginTop: 30, alignItems: 'center' },
  resendText: { color: '#2E7D32', fontWeight: 'bold' }
});
