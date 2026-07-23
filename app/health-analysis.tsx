import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Animated,
  Easing,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { analyzeImage, getTempCapturedImageWeb } from '../src/services/scannerGeminiService';
import { searchFoods, getFoodDetail } from '../src/services/fatSecretService';

export default function HealthAnalysisScreen() {
  const params = useLocalSearchParams();
  const rawImageUri = params.imageUri;
  const imageUri = Array.isArray(rawImageUri) ? rawImageUri[0] : (rawImageUri as string);
  const resolvedImageUri = (Platform.OS === 'web' && imageUri === 'captured-web') ? getTempCapturedImageWeb() : imageUri;
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Analyzing, 2: Finding Match, 3: Select/Confirm
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [fatSecretResults, setFatSecretResults] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (!imageUri) return;

    const performAnalysis = async () => {
      setIsLoading(true);
      try {
        // STEP 1: Gemini Analysis (Food Name, Quantity, Unit)
        setCurrentStep(1);
        const geminiResult = await analyzeImage(imageUri);
        const { food_name, quantity, unit, confidence, estimated_nutrition } = geminiResult;

        console.log(`AI Detected: ${food_name} (${quantity} ${unit}) - ${confidence}%`);

        // STEP 2: Confidence Logic
        if (confidence < 70) {
          Alert.alert(
            "Low Confidence",
            "Couldn't detect clearly. Please search manually.",
            [{ text: "OK", onPress: () => navigateToManual() }]
          );
          return;
        }

        // STEP 3: FatSecret Search (Finding Match)
        setCurrentStep(2);
        const fsResults = await searchFoods(food_name, estimated_nutrition);
        
        if (!fsResults || fsResults.length === 0) {
          Alert.alert(
            "No Match Found",
            "Could not find nutrition data for this item. Please search manually.",
            [{ text: "OK", onPress: () => navigateToManual() }]
          );
          return;
        }

        setFatSecretResults(fsResults);

        if (confidence >= 85) {
          // High Confidence: Auto-select top result and show for confirmation
          const detail = await getFoodDetail(fsResults[0].food_id);
          setDetectionResult({
            food_name: detail.food_name,
            foodImage: detail.food_image,
            confidence: confidence,
            quantity: quantity,
            unit: unit,
            estimated_nutrition: {
              calories: detail.servings[0].calories,
              protein: detail.servings[0].protein,
              carbs: detail.servings[0].carbs,
              fat: detail.servings[0].fat
            }
          });
        } else {
          // Medium Confidence (70-84): Let user select from top 3
          // Set analysisData for handleSelectFood to use
          setAnalysisData({ quantity, unit });
        }

        setCurrentStep(3);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Analysis Error:", error);
        
        let message = "Analysis timed out or failed. Please search manually.";
        if (error.message?.includes("quota") || error.message?.includes("429")) {
          message = "AI scanner is temporarily busy. Please search manually.";
        }

        Alert.alert("Scanner Unavailable", message, [
          { text: "Manual Search", onPress: () => navigateToManual() }
        ]);
      }
    };

    performAnalysis();
  }, [imageUri]);

  const navigateToManual = () => {
    router.replace({ pathname: '/health-search', params: { fromMode: 'health' } });
  };

  const handleSelectFood = async (foodId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const detail = await getFoodDetail(foodId);
      router.push({
        pathname: '/health-quantity',
        params: { 
          ...params, 
          foodName: detail.food_name, 
          foodImage: detail.food_image || '',
          calories: detail.servings[0].calories,
          protein: detail.servings[0].protein,
          carbs: detail.servings[0].carbs,
          fat: detail.servings[0].fat,
          emoji: '🍽️',
          detectedQuantity: analysisData?.quantity,
          detectedUnit: analysisData?.unit
        }
      });
    } catch (err) {
      Alert.alert("Error", "Food database unavailable. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!detectionResult || isProcessing) return;
    setIsProcessing(true);
    router.push({
      pathname: '/health-quantity',
      params: { 
        ...params, 
        foodName: detectionResult.food_name, 
        foodImage: detectionResult.foodImage || '',
        calories: detectionResult.estimated_nutrition?.calories,
        protein: detectionResult.estimated_nutrition?.protein,
        carbs: detectionResult.estimated_nutrition?.carbs,
        fat: detectionResult.estimated_nutrition?.fat,
        emoji: '🍽️',
        detectedQuantity: detectionResult.quantity,
        detectedUnit: detectionResult.unit
      }
    });
    // Reset processing state after navigation if needed (usually handled by router)
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={isProcessing}>
        <Ionicons name="close" size={28} color="#555" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.headerTitle}>AI Scanner Analysis</Text>

        <View style={styles.photoFrame}>
          {resolvedImageUri ? (
            <Animated.Image 
              source={{ uri: resolvedImageUri }} 
              style={[styles.photo, { opacity: isLoading ? 0.6 : 1 }]} 
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image" size={50} color="#DDD" />
            </View>
          )}
          {isLoading && (
            <View style={styles.loaderOverlay}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync" size={40} color="white" />
              </Animated.View>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.checklist}>
            <View style={styles.checkItem}>
              <Ionicons 
                name={currentStep > 1 ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={currentStep > 1 ? "#00C853" : "#DDD"} 
              />
              <Text style={[styles.checkText, currentStep === 1 && styles.checkTextActive]}>Analyzing Food...</Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons 
                name={currentStep > 2 ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={currentStep > 2 ? "#00C853" : "#DDD"} 
              />
              <Text style={[styles.checkText, currentStep === 2 && styles.checkTextActive]}>Finding Match...</Text>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%' }}>
            {detectionResult ? (
              // High Confidence Case
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Detected:</Text>
                <Text style={styles.resultValue}>{detectionResult.food_name}</Text>
                <Text style={styles.confidenceText}>Confidence: {detectionResult.confidence}%</Text>
                
                <TouchableOpacity 
                  style={[styles.continueBtn, isProcessing && styles.btnDisabled]} 
                  disabled={isProcessing}
                  onPress={handleContinue}
                >
                  <Text style={styles.continueText}>Confirm & Continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Medium Confidence Case: Selection List
              <View style={{ flex: 1 }}>
                <Text style={styles.selectionTitle}>Select the correct item:</Text>
                <ScrollView style={styles.resultList}>
                  {fatSecretResults.slice(0, 3).map((item, index) => (
                    <TouchableOpacity 
                      key={item.food_id} 
                      style={styles.foodItem}
                      onPress={() => handleSelectFood(item.food_id)}
                      disabled={isProcessing}
                    >
                      <View style={styles.foodItemContent}>
                        <View>
                          <Text style={styles.foodName}>{item.food_name}</Text>
                          <Text style={styles.foodBrand}>{item.brand_name || 'General'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#DDD" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={styles.wrongBtn} 
              onPress={navigateToManual}
              disabled={isProcessing}
            >
              <Text style={styles.wrongText}>No, Search Manually</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  backBtn: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  content: { flex: 1, paddingHorizontal: 30, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#011627', marginTop: 10, marginBottom: 20 },
  photoFrame: { width: 180, height: 180, borderRadius: 25, overflow: 'hidden', backgroundColor: '#F3F4F6', marginBottom: 30, position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  checklist: { width: '100%', marginBottom: 50 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkText: { fontSize: 18, color: '#7D8592', marginLeft: 15, fontWeight: '500' },
  checkTextActive: { color: '#011627', fontWeight: 'bold' },
  
  resultBox: { width: '100%', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 20, borderRadius: 20, marginBottom: 20 },
  resultLabel: { fontSize: 14, color: '#7D8592', textTransform: 'uppercase', letterSpacing: 1 },
  resultValue: { fontSize: 22, fontWeight: 'bold', color: '#011627', marginVertical: 10, textAlign: 'center' },
  confidenceText: { fontSize: 14, color: '#00C853', fontWeight: '600', marginBottom: 20 },
  
  selectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#011627', marginBottom: 15 },
  resultList: { width: '100%', maxHeight: 250 },
  foodItem: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EDF2F7' },
  foodItemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: 16, fontWeight: '600', color: '#011627' },
  foodBrand: { fontSize: 13, color: '#7D8592', marginTop: 2 },
  
  continueBtn: { backgroundColor: '#00C853', width: '100%', height: 56, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  btnDisabled: { backgroundColor: '#A5D6A7', elevation: 0 },
  continueText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  wrongBtn: { marginTop: 25, alignSelf: 'center' },
  wrongText: { color: '#FF5252', fontWeight: '600', fontSize: 15 }
});