import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Platform,
  LayoutAnimation
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { foodDatabase } from '../src/data/foodDatabase';
import { 
  categorizeFood, 
  getUnitsByCategory, 
  getPresetsByUnit, 
  getNutritionMultiplier,
  getSmartQuantityOptions,
  pluralizeFood
} from '../src/utils/foodCategorizer';
import { getTempCapturedImageWeb } from '../src/services/scannerGeminiService';

export default function HealthQuantityScreen() {
  const params = useLocalSearchParams();
  
  const foodName = (params.foodName as string) || (params.food_name as string) || 'Food Item';
  const emoji = (params.emoji as string) || '🍽️';
  const fromMode = 'health';
  const rawImageUri = (params.foodImage as string) || (params.imageUri as string);
  const foodImage = (Platform.OS === 'web' && rawImageUri === 'captured-web') ? getTempCapturedImageWeb() : rawImageUri;

  // 1. SMART CATEGORY DETECTION
  const category = useMemo(() => categorizeFood(foodName), [foodName]);
  const availableUnits = useMemo(() => getUnitsByCategory(category), [category]);

  const smartOptions = useMemo(() => getSmartQuantityOptions(foodName, category), [foodName, category]);

  // Determine initial unit and quantity
  const initialConfig = useMemo(() => {
    switch (category) {
      case 'Whole Foods':
        return { unit: 'pieces', quantity: 1 };
      case 'Sliced / Cut Foods':
        return { unit: 'grams', quantity: 100 };
      case 'Cooked Meals':
        return { unit: 'grams', quantity: 150 };
      case 'Liquids':
        return { unit: 'ml', quantity: 250 };
      case 'Packaged Foods':
        return { unit: 'packet', quantity: 1 };
      default:
        return { unit: 'grams', quantity: 100 };
    }
  }, [category]);

  const [selectedUnit, setSelectedUnit] = useState(initialConfig.unit);
  const [quantity, setQuantity] = useState(initialConfig.quantity);
  const [isCustomActive, setIsCustomActive] = useState(false);

  React.useEffect(() => {
    setSelectedUnit(initialConfig.unit);
    setQuantity(initialConfig.quantity);
    setIsCustomActive(false);
  }, [foodName, initialConfig]);
  
  // 2. LOOKUP NUTRITION
  const foodInfo = useMemo(() => foodDatabase.find(f => f.name.toLowerCase() === foodName.toLowerCase()), [foodName]);
  const baseUnitType = useMemo(() => {
    if (foodInfo?.unit) {
      return foodInfo.unit.toLowerCase().includes('g') ? 'grams' : (foodInfo.unit.toLowerCase().includes('ml') ? 'ml' : 'count');
    }
    return category === 'Liquids' ? 'ml' : (category === 'Whole Foods' ? 'count' : 'grams');
  }, [foodInfo, category]);

  const baseCalories = foodInfo?.calories || parseFloat(String(params.calories || '100'));
  const baseProtein = foodInfo?.protein || parseFloat(String(params.protein || '5'));
  const baseCarbs = foodInfo?.carbs || parseFloat(String(params.carbs || '10'));
  const baseFat = foodInfo?.fat || parseFloat(String(params.fat || '2'));
  
  // 3. SMART MULTIPLIER
  const multiplier = getNutritionMultiplier(quantity, selectedUnit, baseUnitType, foodName);

  const liveCalories = Math.round(baseCalories * multiplier);
  const liveProtein = (baseProtein * multiplier).toFixed(1);
  const liveCarbs = (baseCarbs * multiplier).toFixed(1);
  const liveFat = (baseFat * multiplier).toFixed(1);

  const handleQuantityChange = (val: number) => {
    if (val < 0) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuantity(val);
  };

  const handleUnitChange = (unit: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedUnit(unit);
    const presets = getPresetsByUnit(unit);
    setQuantity(presets[2] || presets[0] || 1);
  };

  const getSelectedQuantityText = () => {
    if (selectedUnit === 'pieces' || selectedUnit === 'piece') {
      if (quantity === 0.5) return `1/2 ${foodName}`;
      return `${quantity} ${quantity > 1 ? pluralizeFood(foodName) : foodName}`;
    }
    if (selectedUnit === 'litre') {
      return `${quantity} ${quantity > 1 ? 'litres' : 'litre'}`;
    }
    if (selectedUnit === 'packet') {
      return `${quantity} ${quantity > 1 ? 'packets' : 'packet'}`;
    }
    return `${quantity}${selectedUnit}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#011627" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Quantity</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        <View style={styles.foodPreviewCard}>
          <Text style={{ fontSize: 70 }}>{emoji}</Text>
          <Text style={styles.foodNameText}>{foodName}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#011627', marginTop: 14 }}>
            Selected: {getSelectedQuantityText()}
          </Text>
        </View>

        {/* LIVE NUTRITION PREVIEW */}
        <View style={styles.previewCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{liveCalories}</Text>
              <Text style={styles.statLabel}>kcal</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{liveProtein}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{liveCarbs}g</Text>
              <Text style={styles.statLabel}>Carbs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{liveFat}g</Text>
              <Text style={styles.statLabel}>Fats</Text>
            </View>
          </View>
        </View>

        {/* SMART OPTIONS */}
        <Text style={styles.label}>Quantity Options</Text>
        <View style={styles.presetRow}>
          {smartOptions.map((opt, index) => {
            const isActive = opt.value === 'custom' 
              ? isCustomActive 
              : (!isCustomActive && quantity === opt.value && selectedUnit === opt.unit);

            return (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.presetBtn, 
                  isActive && styles.presetBtnActive,
                  opt.value === 'custom' && { borderColor: '#E5E7EB' },
                  smartOptions.length > 5 && { width: '31%', marginRight: '2%', marginBottom: 10 }
                ]} 
                onPress={() => {
                  if (opt.value === 'custom') {
                    setIsCustomActive(true);
                  } else if (opt.value === 'custom_grams') {
                    setIsCustomActive(true);
                    setSelectedUnit('grams');
                    setQuantity(50);
                  } else {
                    setIsCustomActive(false);
                    setSelectedUnit(opt.unit);
                    setQuantity(opt.value as number);
                  }
                }}
              >
                <Text style={[styles.presetText, isActive && styles.presetTextActive, { fontSize: 13, textAlign: 'center' }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CUSTOM ADJUSTMENT */}
        {isCustomActive && (
          <View>
            <Text style={styles.label}>Measurement Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              {availableUnits.map((unit) => (
                <TouchableOpacity 
                  key={unit}
                  style={[styles.unitChip, selectedUnit === unit && styles.unitChipActive]} 
                  onPress={() => handleUnitChange(unit)}
                >
                  <Text style={[styles.unitChipText, selectedUnit === unit && styles.unitChipTextActive]}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Custom Amount</Text>
            <View style={styles.qtyContainer}>
              <TouchableOpacity 
                style={styles.circleBtn} 
                onPress={() => handleQuantityChange(Math.max(0, quantity - (['grams', 'ml'].includes(selectedUnit) ? 10 : 0.5)))}
              >
                <Ionicons name="remove" size={30} color="#333" />
              </TouchableOpacity>

              <View style={styles.qtyInputRow}>
                <TextInput 
                  style={styles.qtyNumber}
                  keyboardType="numeric"
                  value={String(quantity)}
                  onChangeText={(text) => {
                    const val = parseFloat(text);
                    if (!isNaN(val)) setQuantity(val);
                    else if (text === '') setQuantity(0);
                  }}
                />
                <Text style={styles.unitSuffixText}>{selectedUnit}</Text>
              </View>

              <TouchableOpacity 
                style={styles.circleBtn} 
                onPress={() => handleQuantityChange(quantity + (['grams', 'ml'].includes(selectedUnit) ? 10 : 0.5))}
              >
                <Ionicons name="add" size={30} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          router.push({
            pathname: '/health-nutrition',
            params: {
              ...params,
              foodName,
              emoji,
              finalQuantity: quantity,
              unitType: selectedUnit,
              fromMode: 'health'
            }
          });
        }}>
          <Text style={styles.calcBtnText}>Calculate Nutrition</Text>
          <Ionicons name="chevron-forward" size={20} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  backBtn: { padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#011627' },
  content: { paddingHorizontal: 25 },
  
  foodPreviewCard: {
    backgroundColor: '#F1FDF5',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F5E9'
  },
  foodNameText: { fontSize: 24, fontWeight: 'bold', color: '#011627', marginTop: 15, marginBottom: 10 },
  categoryBadge: { backgroundColor: '#00C853', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  categoryText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  previewCard: { backgroundColor: '#011627', borderRadius: 20, padding: 15, marginBottom: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statDivider: { width: 1, height: 20, backgroundColor: '#333' },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#7D8592', fontSize: 10, marginTop: 2 },
  
  label: { fontSize: 14, fontWeight: '700', color: '#011627', marginBottom: 12 },
  unitScroll: { marginBottom: 20 },
  unitChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 15, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  unitChipActive: { backgroundColor: '#011627', borderColor: '#011627' },
  unitChipText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  unitChipTextActive: { color: '#FFF' },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  presetBtn: {
    width: '18%',
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginRight: '2%',
    marginBottom: 10
  },
  presetBtnActive: {
    borderColor: '#00C853',
    backgroundColor: '#F1FDF5',
  },
  presetText: { fontSize: 14, color: '#4B5563', fontWeight: 'bold' },
  presetTextActive: { color: '#00C853' },

  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qtyInputRow: { alignItems: 'center', justifyContent: 'center' },
  qtyNumber: { fontSize: 36, fontWeight: 'bold', color: '#011627', textAlign: 'center', padding: 0, minWidth: 80 },
  unitSuffixText: { fontSize: 14, color: '#7D8592', fontWeight: '600', marginTop: -5 },

  calcBtn: {
    backgroundColor: '#00C853',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 4,
    marginBottom: 20
  },
  calcBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});