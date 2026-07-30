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
  Alert,
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAvatarColor } from '../src/utils/avatarUtils';
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Sorry, we need camera roll permissions to change your avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        // Optimistic UI update
        useAppStore.getState().updateUserProfile('profileImage', uri);
        
        // Upload to backend
        try {
          const uploadResp = await apiService.uploadProfilePhoto(uri);
          if (uploadResp.data && uploadResp.data.url) {
            useAppStore.getState().updateUserProfile('profileImage', uploadResp.data.url);
          }
        } catch (uploadErr) {
          console.warn("Upload failed:", uploadErr);
        }
      }
    } catch (e) {
      console.warn("Error picking image:", e);
    }
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

    // Fetch the freshest store state just before saving so we don't overwrite the picked image
    const currentState = useAppStore.getState().userProfile;
    
    const updatedProfile = {
      ...userProfile,
      profileImage: currentState.profileImage, // Grab the latest image
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

          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.avatarRing}>
              <View style={[styles.greenCircle, { overflow: 'hidden' }]}>
                  {userProfile.profileImage ? (
                    <Image source={{ uri: userProfile.profileImage }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: getAvatarColor(userProfile.name), justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 40, fontWeight: 'bold' }}>{userProfile.name?.charAt(0).toUpperCase() || 'U'}</Text>
                    </View>
                  )}
              </View>
            </View>
            <View style={{ position: 'absolute', bottom: 25, right: 120, backgroundColor: '#333', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' }}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>

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
                    backgroundColor: goal === g ? (isDark ? '#388E3C' : '#E8F5E9') : (isDark ? '#2D2D2D' : '#F9FAFB'),
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    marginRight: 10,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: goal === g ? '#4CAF50' : (isDark ? '#444' : '#E0E0E0'),
                    shadowColor: goal === g ? '#4CAF50' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: goal === g ? 0.2 : 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text style={{ color: goal === g ? (isDark ? '#FFF' : '#1B5E20') : theme.text, fontSize: 13, fontWeight: '700' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtnWrapper} onPress={handleSave}>
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.saveBtnGradient}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
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
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 4, fontWeight: '600' },
  avatarContainer: { alignItems: 'center', marginVertical: 25 },
  avatarRing: {
    padding: 6,
    borderRadius: 60,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  greenCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(76, 175, 80, 0.15)', justifyContent: 'center', alignItems: 'center' },
  form: { marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { 
    height: 60, 
    borderWidth: 1, 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  saveBtnWrapper: { 
    marginTop: 40,
    shadowColor: '#4CAF50', 
    shadowOpacity: 0.3, 
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, 
    elevation: 5,
    borderRadius: 20
  },
  saveBtnGradient: {
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }
});