import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import apiService from '../src/services/apiService';

export default function HealthNutritionScreen() {
  const params = useLocalSearchParams();

  // 1. DATA FROM PREVIOUS STEPS
  const foodName = (params.foodName as string) || 'Apple';
  const emoji = (params.emoji as string) || '🍎';
  const quantityStr = (params.finalQuantity as string) || '1';
  const unit = params.unitType || 'Item';
  const fromMode = params.fromMode || 'health';

  const quantity = parseFloat(quantityStr) || 1;

  // Nutrition Defaults from params
  const baseCalories = parseFloat(String(params.calories || '95')) || 95;
  const baseProtein = parseFloat(String(params.protein || '0.5')) || 0.5;
  const baseCarbs = parseFloat(String(params.carbs || '25')) || 25;
  const baseFat = parseFloat(String(params.fat || '0.3')) || 0.3;
  
  // Since FatSecret base values are per the selected serving description,
  // we just multiply by the quantity selected.
  const finalCalories = Math.round(baseCalories * quantity);
  const finalProtein = (baseProtein * quantity).toFixed(1);
  const finalCarbs = (baseCarbs * quantity).toFixed(1);
  const finalFat = (baseFat * quantity).toFixed(1);

  const handleSaveMeal = async () => {
    import('../src/store/useAppStore').then(async ({ default: useAppStore }) => {
      const mealObject = {
        id: Date.now(),
        name: foodName,
        quantity: quantity,
        unit: unit,
        calories: finalCalories,
        protein: parseFloat(finalProtein),
        carbs: parseFloat(finalCarbs),
        fat: parseFloat(finalFat),
        emoji: emoji,
        imageUri: params.foodImage || params.imageUri, // Save the actual photo URI
        mode: 'health',
        time: (() => {
          const now = new Date();
          return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        })(),
        date: new Date().toISOString().split('T')[0],
        source: "mock"
      };
      
      useAppStore.getState().addMeal(mealObject);
      await useAppStore.getState().saveStoredData();

      // 2. Save to Backend
      try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
        const finalUnit = unitMap[String(unit)] || String(unit);

        const backendPayload = {
          food_name: String(mealObject.name || "Unknown"),
          quantity: Number(mealObject.quantity) || 1,
          unit: String(finalUnit || "serving"),
          calories: Number(mealObject.calories) || 0,
          protein: Number(mealObject.protein) || 0,
          carbs: Number(mealObject.carbs) || 0,
          fat: Number(mealObject.fat) || 0,
          date: dateStr,
          time: timeStr,
          mode: "health"
        };

        console.log("Meal payload:", backendPayload);

        await apiService.addMeal(backendPayload);
      } catch (error) {
        console.warn("Backend meal sync failed, saved locally only.");
      }

      const targetPath: any = fromMode === 'health' 
        ? '/(health-tabs)/health-home' 
        : '/(tabs)/gym-home';

      Alert.alert(
        "Meal Saved! ✅",
        `${foodName} has been added to your Health Log.`,
        [
          { 
            text: "View Dashboard", 
            onPress: () => router.replace(targetPath)
          }
        ]
      );
    });
  };

  const foodImage = params.foodImage as string;
  const imageUri = params.imageUri as string;

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="#011627" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Log Foods</Text>

                {/* FOOD PHOTO PREVIEW */}
                {(foodImage || imageUri) ? (
                  <View style={styles.photoContainer}>
                    <Image 
                      source={{ uri: foodImage || imageUri }} 
                      style={styles.foodImagePreview}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={[styles.photoContainer, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                     <Text style={{ fontSize: 50 }}>{emoji}</Text>
                  </View>
                )}

                {/* CALORIES CARD */}
                <View style={styles.caloriesCard}>
                    <View style={styles.calHeader}>
                        <Ionicons name="flame" size={30} color="#FF7043" />
                        <Text style={styles.calLabel}>Calories</Text>
                    </View>
                    <Text style={styles.calValue}>{finalCalories}</Text>
                </View>

                {/* MACRO BOXES */}
                <View style={styles.macroGrid}>
                    <View style={styles.macroBox}>
                        <Text style={styles.macroLabel}>Proteins</Text>
                        <View style={styles.macroValueContainer}>
                            <Text style={styles.macroValue}>{finalProtein}g</Text>
                        </View>
                    </View>

                    <View style={styles.macroBox}>
                        <Text style={styles.macroLabel}>Carbs</Text>
                        <View style={styles.macroValueContainer}>
                            <Text style={styles.macroValue}>{finalCarbs}g</Text>
                        </View>
                    </View>

                    <View style={styles.macroBox}>
                        <Text style={styles.macroLabel}>Fats</Text>
                        <View style={styles.macroValueContainer}>
                            <Text style={styles.macroValue}>{finalFat}g</Text>
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
  container: { flex: 1, backgroundColor: '#FFF' },
  backBtn: { padding: 20, paddingTop: Platform.OS === 'android' ? 45 : 20 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#011627' },
  subTitle: { fontSize: 16, color: '#7D8592', marginTop: 5, marginBottom: 25 },
  
  photoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  foodImagePreview: { width: '100%', height: '100%' },

  caloriesCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 25, 
    padding: 30, 
    alignItems: 'center', 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  calLabel: { fontSize: 18, color: '#7D8592', marginLeft: 10, fontWeight: '600' },
  calValue: { fontSize: 64, fontWeight: 'bold', color: '#011627' },

  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50 },
  macroBox: { 
    width: '31%', 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2
  },
  macroLabel: { fontSize: 12, color: '#7D8592', fontWeight: 'bold', marginBottom: 10 },
  macroValueContainer: { 
    backgroundColor: '#F9FAFB', 
    width: '100%', 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 10
  },
  macroValue: { fontSize: 14, fontWeight: 'bold', color: '#011627' },

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