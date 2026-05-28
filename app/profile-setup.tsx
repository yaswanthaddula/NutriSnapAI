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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* --- ADDED: Back Button --- */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="arrow-back" size={28} color="#011627" />
          </TouchableOpacity>

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

          <View style={{ height: 40 }} />

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
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#011627' },
  subtitle: { fontSize: 16, color: '#707070', marginTop: 10 },
  card: { flex: 1 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  input: { 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#F0F0F0', 
    borderRadius: 15, 
    paddingHorizontal: 20, 
    fontSize: 16, 
    backgroundColor: '#FAFAFA'
  },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  genderBtn: { 
    flex: 0.48, 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#F0F0F0', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FAFAFA'
  },
  genderBtnActive: { borderColor: '#00C853', backgroundColor: '#F1FBF2' },
  genderText: { fontSize: 16, color: '#666' },
  genderTextActive: { color: '#00C853', fontWeight: 'bold' },
  continueBtn: { 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  continueBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});