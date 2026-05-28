import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useGlobalSearchParams } from 'expo-router';
import { useTheme } from './_layout'; 

export default function GoalsTargets() {
  const { isDark } = useTheme();
  const params = useGlobalSearchParams();

  // 1. State for targets - pulling from previous user data if available
  const [calories, setCalories] = useState((params.calories as string) || '2200');
  const [protein, setProtein] = useState((params.protein as string) || '110');
  const [water, setWater] = useState((params.water as string) || '8');
  const [steps, setSteps] = useState((params.steps as string) || '10000');
  const currentGoal = (params.selectedGoal as string) || 'Maintain Weight';

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    inputBg: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333333' : '#E0E0E0',
    banner: isDark ? '#1B2E1D' : '#F1FBF2',
  };

  const handleSave = () => {
    // 2. Broadcast updates so Gym Home and Profile stats change
    router.setParams({
      calories: calories,
      protein: protein,
      water: water,
      steps: steps
    });

    Alert.alert("Success", "Targets updated!", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: theme.text }]}>Goals & Targets</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Customize your daily targets</Text>
        </View>

        {/* Current Goal Banner */}
        <View style={[styles.goalBanner, { backgroundColor: theme.banner }]}>
          <View style={styles.infoCircle}>
            <Ionicons name="information-circle" size={24} color="#00C853" />
          </View>
          <View style={styles.goalTextContent}>
            <Text style={[styles.goalLabel, { color: theme.text }]}>Current Goal</Text>
            <Text style={styles.goalValue}>{currentGoal}</Text>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Daily Calories Target</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.input, { color: theme.text }]} 
                value={calories} 
                onChangeText={setCalories} 
                keyboardType="numeric" 
              />
              <Text style={styles.unitText}>kcal</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Daily Protein Target</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.input, { color: theme.text }]} 
                value={protein} 
                onChangeText={setProtein} 
                keyboardType="numeric" 
              />
              <Text style={styles.unitText}>grams</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Daily Water Target</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.input, { color: theme.text }]} 
                value={water} 
                onChangeText={setWater} 
                keyboardType="numeric" 
              />
              <View style={styles.waterUnits}>
                 <Text style={styles.unitText}>glasses</Text>
                 <Ionicons name="swap-vertical" size={14} color="#7D8592" />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Daily Steps Target</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput 
                style={[styles.input, { color: theme.text }]} 
                value={steps} 
                onChangeText={setSteps} 
                keyboardType="numeric" 
              />
              <Text style={styles.unitText}>steps</Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Targets</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  backBtn: { marginBottom: 20, marginLeft: -10 },
  headerArea: { marginBottom: 25 },
  title: { fontSize: 30, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  
  goalBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#DFF6E3',
    marginBottom: 30
  },
  infoCircle: { marginRight: 15 },
  goalTextContent: { flex: 1 },
  goalLabel: { fontSize: 16, fontWeight: 'bold' },
  goalValue: { color: '#7D8592', fontSize: 14, marginTop: 2 },

  form: { marginTop: 5 },
  inputGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 60, 
    borderRadius: 15, 
    paddingHorizontal: 20, 
    borderWidth: 1 
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  unitText: { color: '#7D8592', fontSize: 14, marginRight: 5 },
  waterUnits: { flexDirection: 'row', alignItems: 'center' },

  saveBtn: { 
    backgroundColor: '#00C853', 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 40,
    marginBottom: 30,
    // Shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});