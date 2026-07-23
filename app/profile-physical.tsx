import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfilePhysical() {
  const params = useLocalSearchParams(); 

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  // Logic variable for the Dark Green button color
  const isFormValid = weight.trim() !== '' && height.trim() !== '';

  const handleContinue = () => {
    if (!isFormValid) return;

    // We still calculate BMI here in the background so Page 5 can show it later
    const wNum = parseFloat(weight);
    const hNum = parseFloat(height) / 100;
    const calculatedBmi = (wNum / (hNum * hNum)).toFixed(1);

    router.push({
      pathname: '/profile-activity',
      params: { 
        ...params, 
        weight, 
        height, 
        bmi: calculatedBmi 
      }
    });
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#4CAF50']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>

            <View style={styles.glassContainer}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressDash, styles.dashActive]} />
                <View style={[styles.progressDash, styles.dashActive]} />
                <View style={styles.progressDash} />
                <View style={styles.progressDash} />
              </View>

              <Text style={styles.title}>Body Details</Text>
              <Text style={styles.subtitle}>Help us personalize your plan</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g., 173"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="e.g., 88"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>

              <View style={{ height: 20 }} />

              <TouchableOpacity 
                style={styles.continueBtnWrapper}
                onPress={handleContinue}
                disabled={!isFormValid}
              >
                <View style={[styles.continueBtn, !isFormValid && styles.btnDisabled]}>
                  <Text style={styles.continueBtnText}>Continue</Text>
                </View>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  gradientBg: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 30, justifyContent: 'center' },
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
    paddingHorizontal: 25,
    paddingVertical: 30,
  },
  backBtn: { marginTop: 10, marginBottom: 10, marginLeft: 20, width: 40, height: 40, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, alignItems: 'center', zIndex: 10 },
  progressContainer: { flexDirection: 'row', marginBottom: 25 },
  progressDash: { height: 6, flex: 1, backgroundColor: '#C8E6C9', borderRadius: 3, marginRight: 8 },
  dashActive: { backgroundColor: '#4CAF50', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 2 },
  title: { fontSize: 32, fontWeight: '900', color: '#1B5E20' },
  subtitle: { fontSize: 16, color: '#388E3C', marginTop: 10, marginBottom: 30, fontWeight: '600' },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 8 },
  input: { 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    fontSize: 16, 
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#0A1629'
  },
  continueBtnWrapper: {
    marginTop: 10,
  },
  continueBtn: { 
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
  btnDisabled: { backgroundColor: '#A5D6A7', elevation: 0 },
  continueBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});