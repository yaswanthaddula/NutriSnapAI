import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform,
  Alert,
  ScrollView,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';
import { foodDatabase } from '../src/data/foodDatabase';

export default function FinalNutritionScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();

  // 1. DATA FROM PREVIOUS SCREENS
  const food_name = (params.food_name as string) || (params.foodName as string) || 'Food Item';
  const quantityStr = (params.finalQuantity as string) || '1';
  const unit_type = (params.unit_type as string) || 'grams';
  const fromMode = params.fromMode;

  // 2. LOOKUP NUTRITION
  const foodInfo = foodDatabase.find(f => f.name.toLowerCase() === food_name.toLowerCase());
  const emoji = foodInfo?.emoji || (params.emoji as string) || '🍽️';

  const quantity = parseFloat(quantityStr) || 1;

  // If found in DB, use those. Otherwise use defaults or passed params.
  const baseCalories = foodInfo?.calories || parseFloat(String(params.calories || '100'));
  const baseProtein = foodInfo?.protein || parseFloat(String(params.protein || '5'));
  const baseCarbs = foodInfo?.carbs || parseFloat(String(params.carbs || '10'));
  const baseFat = foodInfo?.fat || parseFloat(String(params.fat || '2'));
  
  const finalCalories = Math.round(baseCalories * quantity);
  const finalProtein = (baseProtein * quantity).toFixed(1);
  const finalCarbs = (baseCarbs * quantity).toFixed(1);
  const finalFat = (baseFat * quantity).toFixed(1);

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    border: isDark ? '#333333' : '#E5E7EB',
  };

  const handleSaveMeal = async () => {
    // Map unit_type to unit
    let unit = unit_type;
    const unitMap: Record<string, string> = {
      'grams': 'g',
      'ml': 'ml',
      'pieces': 'pcs',
      'slices': 'slice',
      'bowl': 'bowl',
      'plate': 'plate',
      'packet': 'pkt',
      'box': 'box',
      'kg': 'kg',
      'L': 'L',
      'cups': 'cup',
      'count': 'unit'
    };
    unit = unitMap[String(unit_type)] || String(unit_type);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const backendPayload = {
      food_name: food_name,
      quantity: quantity,
      unit: unit,
      calories: finalCalories,
      protein: parseFloat(finalProtein),
      carbs: parseFloat(finalCarbs),
      fat: parseFloat(finalFat),
      date: dateStr,
      time: timeStr,
      mode: fromMode === 'health' ? 'health' : 'gym'
    };

    const mealObject = {
      id: Date.now(),
      name: food_name,
      quantity: quantity,
      unit: unit,
      calories: finalCalories,
      protein: parseFloat(finalProtein),
      carbs: parseFloat(finalCarbs),
      fat: parseFloat(finalFat),
      emoji: emoji,
      imageUri: params.imageUri || params.foodImage,
      mode: fromMode === 'health' ? 'health' : 'gym',
      time: timeStr,
      date: dateStr,
      source: "scanner"
    };
    
    // 1. Save to Backend First
    try {
      console.log("Saving to backend:", backendPayload);
      await apiService.addMeal(backendPayload);
    } catch (error) {
      console.warn("Backend meal sync failed:", error);
    }

    // 2. Update Local Store
    useAppStore.getState().addMeal(mealObject);
    await useAppStore.getState().saveStoredData();

    const targetPath: any = fromMode === 'health' 
      ? '/(health-tabs)/health-home' 
      : '/(tabs)/gym-home';

    Alert.alert(
      "Meal Saved! ✅",
      `${food_name} has been added to your log.`,
      [
        { 
          text: "View Dashboard", 
          onPress: () => router.replace(targetPath)
        }
      ]
    );
  };

  const foodImage = params.foodImage as string;
  const imageUri = params.imageUri as string;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Log Foods</Text>

        {/* FOOD PHOTO PREVIEW */}
        {(foodImage || imageUri) ? (
          <View style={[styles.photoContainer, { borderColor: theme.border }]}>
            <Image 
              source={{ uri: foodImage || imageUri }} 
              style={styles.foodImagePreview}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.photoContainer, { backgroundColor: theme.card, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }]}>
             <Text style={{ fontSize: 50 }}>{emoji}</Text>
          </View>
        )}

        {/* CALORIES CARD */}
        <View style={[styles.caloriesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.calHeader}>
            <Ionicons name="flame" size={30} color="#FF7043" />
            <Text style={[styles.calLabel, { color: theme.subText }]}>Calories</Text>
          </View>
          <Text style={[styles.calValue, { color: theme.text }]}>{finalCalories}</Text>
        </View>

        {/* MACRO GRID */}
        <View style={styles.macroGrid}>
          <View style={[styles.macroBox, { backgroundColor: isDark ? '#1E1E1E' : 'white', borderColor: theme.border }]}>
            <Text style={[styles.macroLabel, { color: theme.subText }]}>Proteins</Text>
            <View style={[styles.macroValueContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.macroValue, { color: theme.text }]}>{finalProtein}g</Text>
            </View>
          </View>

          <View style={[styles.macroBox, { backgroundColor: isDark ? '#1E1E1E' : 'white', borderColor: theme.border }]}>
            <Text style={[styles.macroLabel, { color: theme.subText }]}>Carbs</Text>
            <View style={[styles.macroValueContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.macroValue, { color: theme.text }]}>{finalCarbs}g</Text>
            </View>
          </View>

          <View style={[styles.macroBox, { backgroundColor: isDark ? '#1E1E1E' : 'white', borderColor: theme.border }]}>
            <Text style={[styles.macroLabel, { color: theme.subText }]}>Fats</Text>
            <View style={[styles.macroValueContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.macroValue, { color: theme.text }]}>{finalFat}g</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logBtn} onPress={handleSaveMeal}>
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 20, paddingTop: Platform.OS === 'android' ? 45 : 20 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  
  photoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  foodImagePreview: { width: '100%', height: '100%' },

  caloriesCard: { 
    borderRadius: 25, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 30,
    marginTop: 20,
    borderWidth: 1,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  calLabel: { fontSize: 18, marginLeft: 10, fontWeight: '600' },
  calValue: { fontSize: 64, fontWeight: 'bold' },

  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50 },
  macroBox: { 
    width: '31%', 
    borderRadius: 15, 
    padding: 15, 
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2
  },
  macroLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  macroValueContainer: { 
    width: '100%', 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 10
  },
  macroValue: { fontSize: 14, fontWeight: 'bold' },

  logBtn: { 
    backgroundColor: '#00C853', 
    height: 65, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  logBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});