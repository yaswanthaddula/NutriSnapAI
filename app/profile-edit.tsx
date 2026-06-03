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
  Platform,
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';
import { calculateBMI, calculateSuggestedMode } from '../src/utils/calculations';

export default function EditProfile() {
  const { isDark } = useTheme();
  const { userProfile, setUserProfile, saveStoredData } = useAppStore();

  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(String(userProfile.age));
  const [height, setHeight] = useState(String(userProfile.height));
  const [weight, setWeight] = useState(String(userProfile.weight));
  const [gender, setGender] = useState(userProfile.gender);
  const [activity, setActivity] = useState(userProfile.activityLevel);
  const [goal, setGoal] = useState(userProfile.goal);

  useEffect(() => {
    setName(userProfile.name);
    setAge(String(userProfile.age));
    setHeight(String(userProfile.height));
    setWeight(String(userProfile.weight));
    setGender(userProfile.gender);
    setActivity(userProfile.activityLevel);
    setGoal(userProfile.goal);
  }, [userProfile]);

  const theme = {
    background: isDark ? '#121212' : '#FFF',
    text: isDark ? '#FFF' : '#011627',
    subText: isDark ? '#AAA' : '#7D8592',
    input: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    const nAge = parseInt(age) || 25;
    const nHeight = parseFloat(height) || 170;
    const nWeight = parseFloat(weight) || 60;

    // Recalculate suggested mode based on new inputs
    const nSuggestedMode = calculateSuggestedMode({
      age: nAge,
      height: nHeight,
      weight: nWeight,
      gender,
      activityLevel: activity,
      goal,
      selected_mode: userProfile.selected_mode
    });

    const updatedProfile = {
      ...userProfile,
      name,
      age: nAge,
      height: nHeight,
      weight: nWeight,
      gender,
      activityLevel: activity,
      goal,
      suggested_mode: nSuggestedMode,
    };

    const performSave = async (finalProfile: any) => {
      try {
        await apiService.saveProfile(finalProfile);
        setUserProfile(finalProfile);
        await saveStoredData();
        
        // Show success and check for recommendation
        if (nSuggestedMode.toLowerCase() !== (userProfile.selected_mode || 'health').toLowerCase()) {
          Alert.alert(
            "Profile Updated",
            `Your profile has been updated. Based on your new details, ${nSuggestedMode} Mode is recommended for you.`,
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else {
          Alert.alert("Success", "Profile Updated Successfully!", [
            { text: "OK", onPress: () => router.back() }
          ]);
        }
      } catch (error) {
        console.error("Failed to sync profile:", error);
        setUserProfile(finalProfile);
        await saveStoredData();
        Alert.alert("Sync Notice", "Profile saved locally, but failed to sync with server.");
        router.back();
      }
    };

    await performSave(updatedProfile);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
               <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <View>
                <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>
                <Text style={styles.subtitle}>Update your information</Text>
            </View>
          </View>

          <View style={styles.avatarContainer}>
            <View style={styles.greenCircle}>
                <Text style={{fontSize: 40}}>{gender?.toLowerCase() === 'female' ? '👧' : '👦'}</Text>
            </View>
          </View>

          <View style={styles.form}>
            
            <Text style={[styles.label, { color: theme.text }]}>Name</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                value={name} onChangeText={setName} 
            />

            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Text style={[styles.label, { color: theme.text }]}>Age</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                        value={age} onChangeText={setAge} keyboardType="numeric" 
                    />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                        value={gender} onChangeText={setGender} 
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Text style={[styles.label, { color: theme.text }]}>Height (cm)</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                        value={height} onChangeText={setHeight} keyboardType="numeric" 
                    />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                        value={weight} onChangeText={setWeight} keyboardType="numeric" 
                    />
                </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Activity Level</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                value={activity} onChangeText={setActivity} 
                placeholder="e.g. Light Active, Moderate Active"
            />

            <Text style={[styles.label, { color: theme.text }]}>Current Goal</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]} 
                value={goal} onChangeText={setGoal} 
                placeholder="e.g. Maintain Weight, Weight Loss, Weight Gain, General Health, Muscle Gain, Fitness Improvement"
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {["Weight Gain", "Weight Loss", "Maintain Weight", "General Health", "Muscle Gain", "Fitness Improvement"].map((g) => (
                <TouchableOpacity 
                  key={g} 
                  onPress={() => setGoal(g)}
                  style={{
                    backgroundColor: goal === g ? '#00C853' : (isDark ? '#2D2D2D' : '#F0F2F5'),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: goal === g ? '#00C853' : (isDark ? '#444' : '#E4E6EB'),
                  }}
                >
                  <Text style={{ color: goal === g ? '#FFF' : theme.text, fontSize: 12, fontWeight: 'bold' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backIcon: { marginRight: 15 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 4 },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  greenCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center' },
  form: { marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { height: 55, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16 },
  saveBtn: { 
    backgroundColor: '#00C853', height: 60, borderRadius: 15, 
    justifyContent: 'center', alignItems: 'center', marginTop: 40,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});