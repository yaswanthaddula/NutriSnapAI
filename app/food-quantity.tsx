import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Platform,
  LayoutAnimation,
  Animated,
  KeyboardAvoidingView,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function FoodQuantityScreen() {
  const params = useLocalSearchParams();
  
  const foodName = (params.food_name as string) || (params.foodName as string) || 'Food Item';
  const emoji = (params.emoji as string) || '🍽️';
  const fromMode = params.fromMode; 
  const rawImageUri = params.imageUri as string || params.foodImage as string;
  const foodImage = (Platform.OS === 'web' && rawImageUri === 'captured-web') ? getTempCapturedImageWeb() : rawImageUri;

  // 1. SMART CATEGORY DETECTION
  const category = useMemo(() => categorizeFood(foodName), [foodName]);
  
  // 2. LOOKUP NUTRITION
  const foodInfo = useMemo(() => foodDatabase.find(f => f.name.toLowerCase() === foodName.toLowerCase()), [foodName]);

  const availableUnits = useMemo(() => {
    return getUnitsByCategory(category);
  }, [category]);

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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#011627" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Quantity</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          <View style={styles.foodCard}>
            <View style={styles.imageContainer}>
              {foodImage ? (
                <Image source={{ uri: foodImage }} style={styles.foodImage} />
              ) : (
                <Text style={styles.foodEmoji}>{emoji}</Text>
              )}
            </View>
            <Text style={styles.foodName}>{foodName}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#011627', marginTop: 14 }}>
              Selected: {getSelectedQuantityText()}
            </Text>
          </View>

          {/* LIVE NUTRITION PREVIEW */}
          <View style={styles.premiumStatsGrid}>
            <LinearGradient colors={['#FF9800', '#FFCC80']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="fire" size={24} color="#FFF" />
              <Text style={styles.macroGradientValue}>{liveCalories}</Text>
              <Text style={styles.macroGradientLabel}>Calories</Text>
            </LinearGradient>

            <LinearGradient colors={['#2196F3', '#90CAF9']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#FFF" />
              <Text style={styles.macroGradientValue}>{liveProtein}g</Text>
              <Text style={styles.macroGradientLabel}>Protein</Text>
            </LinearGradient>

            <LinearGradient colors={['#9C27B0', '#CE93D8']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="grain" size={24} color="#FFF" />
              <Text style={styles.macroGradientValue}>{liveCarbs}g</Text>
              <Text style={styles.macroGradientLabel}>Carbs</Text>
            </LinearGradient>

            <LinearGradient colors={['#4CAF50', '#A5D6A7']} style={styles.macroGradientCard}>
              <MaterialCommunityIcons name="water-percent" size={24} color="#FFF" />
              <Text style={styles.macroGradientValue}>{liveFat}g</Text>
              <Text style={styles.macroGradientLabel}>Fats</Text>
            </LinearGradient>
          </View>

          {/* SMART OPTIONS */}
          <Text style={styles.sectionLabel}>Quantity Options</Text>
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
              <Text style={styles.sectionLabel}>Measurement Unit</Text>
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

              <Text style={styles.sectionLabel}>Custom Amount</Text>
              <View style={styles.adjustContainer}>
                <TouchableOpacity 
                  style={styles.adjustBtn} 
                  onPress={() => handleQuantityChange(Math.max(0, quantity - (['grams', 'ml'].includes(selectedUnit) ? 10 : 0.5)))}
                >
                  <Ionicons name="remove" size={24} color="#00C853" />
                </TouchableOpacity>
                
                <View style={styles.qtyDisplay}>
                  <TextInput 
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={String(quantity)}
                    onChangeText={(text) => {
                      const val = parseFloat(text);
                      if (!isNaN(val)) setQuantity(val);
                      else if (text === '') setQuantity(0);
                    }}
                  />
                  <Text style={styles.unitSuffix}>{selectedUnit}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.adjustBtn} 
                  onPress={() => handleQuantityChange(quantity + (['grams', 'ml'].includes(selectedUnit) ? 10 : 0.5))}
                >
                  <Ionicons name="add" size={24} color="#00C853" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.continueBtn, quantity <= 0 && styles.btnDisabled]} 
            disabled={quantity <= 0}
            onPress={() => router.push({
              pathname: '/final-nutrition',
              params: { 
                ...params,
                foodName, 
                emoji, 
                finalQuantity: quantity,
                unit_type: selectedUnit,
                fromMode 
              }
            })}
          >
            <Text style={styles.continueText}>Confirm & Log Meal</Text>
            <Ionicons name="checkmark-circle" size={24} color="white" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#011627' },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  
  foodCard: { 
    backgroundColor: '#F8FBF9', 
    borderRadius: 24, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F5E9'
  },
  imageContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
  foodEmoji: { fontSize: 45 },
  foodImage: { width: 90, height: 90, borderRadius: 45 },
  foodName: { fontSize: 22, fontWeight: 'bold', color: '#011627', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  categoryText: { fontSize: 10, fontWeight: '800', color: '#00C853', letterSpacing: 1 },

  previewCard: { backgroundColor: '#011627', borderRadius: 24, padding: 20, marginBottom: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  previewTitle: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: 6, opacity: 0.9 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)' },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, fontWeight: '600' },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#7D8592', marginBottom: 12, marginLeft: 4, marginTop: 5 },
  unitScroll: { marginBottom: 20, flexDirection: 'row' },
  unitChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, backgroundColor: '#F5F7FA', marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  unitChipActive: { backgroundColor: '#011627', borderColor: '#011627' },
  unitChipText: { fontSize: 14, fontWeight: '600', color: '#7D8592' },
  unitChipTextActive: { color: '#FFF' },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  presetBtn: { 
    width: '18%',
    marginRight: '2%',
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  presetBtnActive: { backgroundColor: '#00C853', borderColor: '#00C853', elevation: 4 },
  presetText: { fontSize: 13, color: '#374151', fontWeight: '700' },
  presetTextActive: { color: '#FFF' },

  adjustContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 20, 
    padding: 12, 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 35,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  adjustBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  qtyDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  qtyInput: { fontSize: 36, fontWeight: '800', color: '#011627', textAlign: 'center', padding: 0, minWidth: 80 },
  unitSuffix: { fontSize: 16, color: '#7D8592', marginLeft: 8, fontWeight: '600' },

  continueBtn: { 
    backgroundColor: '#00C853', 
    height: 65, 
    borderRadius: 20, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15
  },
  continueText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  btnDisabled: { backgroundColor: '#A5D6A7', elevation: 0 },
  premiumStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 15,
  },
  macroGradientCard: {
    width: '48%',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  macroGradientValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  macroGradientLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  }
});