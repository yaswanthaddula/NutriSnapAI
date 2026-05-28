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
import { categorizeFood, getUnitsByCategory, getPresetsByUnit, getNutritionMultiplier } from '../src/utils/foodCategorizer';

export default function HealthQuantityScreen() {
  const params = useLocalSearchParams();
  
  const foodName = (params.foodName as string) || (params.food_name as string) || 'Food Item';
  const emoji = (params.emoji as string) || '🍽️';
  const fromMode = 'health';

  // 1. SMART CATEGORY DETECTION
  const category = useMemo(() => categorizeFood(foodName), [foodName]);
  const availableUnits = useMemo(() => getUnitsByCategory(category), [category]);
  
  const [selectedUnit, setSelectedUnit] = useState(availableUnits[0]);
  const presets = useMemo(() => getPresetsByUnit(selectedUnit), [selectedUnit]);
  
  const [quantity, setQuantity] = useState(presets[2] || presets[0] || 1);
  
  // 2. LOOKUP NUTRITION
  const foodInfo = foodDatabase.find(f => f.name.toLowerCase() === foodName.toLowerCase());
  const baseUnitType = foodInfo?.unit?.toLowerCase().includes('g') ? 'grams' : (foodInfo?.unit?.toLowerCase().includes('ml') ? 'ml' : 'count');

  const baseCalories = foodInfo?.calories || parseFloat(String(params.calories || '100'));
  const baseProtein = foodInfo?.protein || parseFloat(String(params.protein || '5'));
  const baseCarbs = foodInfo?.carbs || parseFloat(String(params.carbs || '10'));
  const baseFat = foodInfo?.fat || parseFloat(String(params.fat || '2'));
  
  // 3. SMART MULTIPLIER
  const multiplier = getNutritionMultiplier(quantity, selectedUnit, baseUnitType);

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
    const newPresets = getPresetsByUnit(unit);
    setQuantity(newPresets[2] || newPresets[0] || 1);
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
          </View>
        </View>

        {/* Unit Selector Chips */}
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

        {/* Quick Presets */}
        <Text style={styles.label}>Quick Select</Text>
        <View style={styles.presetRow}>
          {presets.map((val) => (
            <TouchableOpacity 
              key={val}
              style={[styles.presetBtn, quantity === val && styles.presetBtnActive]} 
              onPress={() => handleQuantityChange(val)}
            >
              <Text style={[styles.presetText, quantity === val && styles.presetTextActive]}>{val}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Quantity Selector */}
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