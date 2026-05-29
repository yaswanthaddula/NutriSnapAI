import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../src/services/apiService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(0);

  React.useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    
    setLoading(true);
    try {
      await apiService.forgotPassword(email);
      Alert.alert("Success", "Verification code sent to your email.");
      setIsCodeSent(true);
      setTimer(60); // Start 60s timer
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Could not send reset code.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!email || !code || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (timer === 0 && isCodeSent) {
      Alert.alert("Expired", "Verification code has expired. Please resend code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword(email, code, newPassword);
      const handleNavigate = () => {
        router.replace('/login');
      };

      if (Platform.OS === 'web') {
        alert("Your password has been reset successfully.");
        handleNavigate();
      } else {
        Alert.alert("Success", "Your password has been reset successfully.", [
          { text: "OK", onPress: handleNavigate }
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Invalid OTP or request expired.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.header}>Reset Password</Text>
            <Text style={styles.subHeader}>Fill in the details below to reset your password and continue.</Text>

            {/* EMAIL SECTION */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Enter Mail</Text>
              <TextInput 
                style={styles.input} 
                placeholder="your@email.com" 
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.sendCodeLink} 
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading && !isCodeSent ? (
                  <ActivityIndicator size="small" color="#00C853" />
                ) : (
                  <Text style={styles.sendCodeText}>
                    {isCodeSent ? "Resend Code?" : "Send Code to Mail"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OTP & PASSWORD SECTION (Always visible but grouped) */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Enter Code</Text>
              <TextInput 
                style={styles.input} 
                placeholder="6-digit verification code" 
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
              {isCodeSent && (
                <Text style={[styles.timerText, timer === 0 && { color: '#FF5252' }]}>
                  {timer > 0 ? `Code expires in ${timer}s` : "Code expired"}
                </Text>
              )}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Enter New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="New password" 
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
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

            <View style={styles.inputSection}>
              <Text style={styles.label}>Re-enter Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="Confirm new password" 
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
              style={[styles.mainBtn, loading && isCodeSent && { opacity: 0.7 }]} 
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading && isCodeSent ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>Continue with Login</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 20, marginTop: 10 },
  content: { paddingHorizontal: 30, paddingBottom: 40 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#011627', marginBottom: 10 },
  subHeader: { fontSize: 16, color: '#707070', marginBottom: 30 },
  inputSection: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '600', color: '#011627', marginBottom: 10 },
  input: { 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    padding: 15, 
    borderRadius: 12, 
    fontSize: 16 
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
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
  sendCodeLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 5
  },
  sendCodeText: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 14
  },
  timerText: {
    fontSize: 12,
    color: '#707070',
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'right'
  },
  mainBtn: { 
    backgroundColor: '#00C853', 
    padding: 18, 
    borderRadius: 50, 
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});