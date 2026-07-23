import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Ensure you have vector-icons installed

export default function ProfileSetUp() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(''); 

  // Logic for the Dark Green button
  const isFormValid = name.trim() !== '' && age !== '' && gender !== '';

  const handleContinue = () => {
    const ageNum = parseInt(age);

    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }

    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      Alert.alert("Invalid Age", "Age must be between 10 and 100.");
      return;
    }

    if (!gender) {
      Alert.alert("Selection Required", "Please select your gender.");
      return;
    }

    // Handing over the data "Baton" to the next page
    router.push({
      pathname: '/profile-physical',
      params: { userName: name, userAge: age, userGender: gender }
    }); 
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#4CAF50']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>

            <View style={styles.glassContainer}>
              <View style={styles.progressContainer}>
                <View style={[styles.progressDash, styles.dashActive]} />
                <View style={styles.progressDash} />
                <View style={styles.progressDash} />
                <View style={styles.progressDash} />
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>Complete Your Profile</Text>
                <Text style={styles.subtitle}>Tell us about yourself</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter your age"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity 
                      style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]} 
                      onPress={() => setGender('Male')}
                    >
                      <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]} 
                      onPress={() => setGender('Female')}
                    >
                      <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900', color: '#1B5E20' },
  subtitle: { fontSize: 16, color: '#388E3C', marginTop: 10, fontWeight: '600' },
  card: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 8 },
  input: { 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    fontSize: 16, 
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genderBtn: { 
    flex: 0.48, 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  genderBtnActive: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9', borderWidth: 2 },
  genderText: { fontSize: 16, color: '#388E3C', fontWeight: '600' },
  genderTextActive: { color: '#1B5E20', fontWeight: '900' },
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