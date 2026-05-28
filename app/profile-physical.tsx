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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="arrow-back" size={28} color="#0A1629" />
          </TouchableOpacity>

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
              placeholderTextColor="#ADB5BD"
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
              placeholderTextColor="#ADB5BD"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          <View style={{ flex: 1 }} />

          {/* DYNAMIC BUTTON: Switches to Dark Green when details are entered */}
          <TouchableOpacity 
            style={[
              styles.continueBtn, 
              { backgroundColor: isFormValid ? '#00C853' : '#81E19E' }
            ]} 
            onPress={handleContinue}
            disabled={!isFormValid}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 30 },
  backBtn: { marginTop: 10, marginBottom: 10, width: 50, height: 50, justifyContent: 'center', marginLeft: -10 },
  progressContainer: { flexDirection: 'row', marginBottom: 35 },
  progressDash: { height: 5, width: 60, backgroundColor: '#E0E0E0', borderRadius: 5, marginRight: 8 },
  dashActive: { backgroundColor: '#00C853' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#011627' },
  subtitle: { fontSize: 16, color: '#707070', marginTop: 8, marginBottom: 32 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  input: { 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#F0F0F0', 
    borderRadius: 15, 
    paddingHorizontal: 20, 
    fontSize: 16, 
    backgroundColor: '#FAFAFA',
    color: '#0A1629'
  },
  continueBtn: { 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20
  },
  continueBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});