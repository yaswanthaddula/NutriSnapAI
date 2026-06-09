import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  Alert,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { analyzeImage, getTempCapturedImageWeb } from '../src/services/scannerGeminiService';
import { searchFoods, getFoodDetail } from '../src/services/fatSecretService';

export default function FoodAnalysisScreen() {
  const params = useLocalSearchParams();
  const rawImageUri = params.imageUri as string;
  const resolvedImageUri = (Platform.OS === 'web' && rawImageUri === 'captured-web') ? getTempCapturedImageWeb() : rawImageUri;

  const [currentStep, setCurrentStep] = useState(1); // 1: Analyzing, 2: Getting Data, 3: Ready
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (!rawImageUri) return;

    const performAnalysis = async () => {
      try {
        // STEP 1: Analyzing
        setCurrentStep(1);
        const result = await analyzeImage(rawImageUri);
        
        // STEP 2: Getting Data
        setCurrentStep(2);
        // Simulate a small delay for "Getting Data" feel as requested in UI
        await new Promise(resolve => setTimeout(resolve, 800));
        setDetectionResult(result);

        // STEP 3: Ready
        setCurrentStep(3);
      } catch (error: any) {
        Alert.alert('Scanner Error', error.message, [
          { text: 'Manual Search', onPress: () => router.push({ pathname: '/health-search', params: { fromMode: 'gym' } }) },
          { text: 'Try Again', onPress: () => router.back() }
        ]);
      }
    };

    performAnalysis();
  }, [rawImageUri]);

  const renderCheckItem = (stepNumber: number, label: string) => {
    const isCompleted = currentStep > stepNumber || currentStep === 3;
    const isActive = currentStep === stepNumber;

    return (
      <View style={styles.checkItem}>
        <View style={[
          styles.checkCircle, 
          isCompleted && styles.checkCircleCompleted,
          isActive && styles.checkCircleActive
        ]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={18} color="white" />
          ) : (
            isActive && <View style={styles.activeDot} />
          )}
        </View>
        <Text style={[
          styles.checkText, 
          isCompleted && styles.checkTextCompleted,
          isActive && styles.checkTextActive
        ]}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1A1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Food Analyze</Text>
        <View style={{ width: 48 }} /> 
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.photoContainer}>
          <View style={styles.photoShadow}>
            <View style={styles.photoFrame}>
              {resolvedImageUri ? (
                <Image 
                  source={{ uri: resolvedImageUri }} 
                  style={styles.photo} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image-outline" size={60} color="#CBD5E1" />
                  <Text style={styles.photoPlaceholderText}>Photo</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.checklistContainer}>
          {renderCheckItem(1, "Analytizing")}
          {renderCheckItem(2, "Getting Data")}
          {renderCheckItem(3, "Ready")}
        </View>

        {currentStep === 3 && detectionResult && (
          <View style={styles.detectionInfo}>
            <Text style={styles.detectedLabel}>Detected:</Text>
            <Text style={styles.foodName}>{detectionResult.food_name}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueBtn, currentStep !== 3 && styles.continueBtnDisabled]} 
            onPress={() => {
              if (currentStep === 3) {
                router.push({
                  pathname: '/food-quantity',
                  params: { 
                    ...params, 
                    food_name: detectionResult?.food_name, 
                    unit_type: detectionResult?.unit_type,
                    imageUri: rawImageUri,
                  }
                });
              }
            }}
            disabled={currentStep !== 3}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
          
          {currentStep === 3 && (
            <TouchableOpacity 
              style={styles.manualBtn} 
              onPress={() => router.push({ pathname: '/health-search', params: { fromMode: 'gym' } })}
            >
              <Text style={styles.manualBtnText}>Not correct? Search manually</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1C1E' },
  
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
  
  photoContainer: { marginTop: 40, marginBottom: 50 },
  photoShadow: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 32,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  photoFrame: { 
    width: 200, 
    height: 200, 
    borderRadius: 24, 
    overflow: 'hidden', 
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoPlaceholderText: { marginTop: 8, fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  
  checklistContainer: { width: '100%', paddingLeft: 40, marginBottom: 40 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkCircle: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    borderWidth: 2, 
    borderColor: '#E2E8F0', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  checkCircleActive: { borderColor: '#00C853' },
  checkCircleCompleted: { backgroundColor: '#00C853', borderColor: '#00C853' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  
  checkText: { fontSize: 18, color: '#94A3B8', fontWeight: '500' },
  checkTextActive: { color: '#1A1C1E', fontWeight: '700' },
  checkTextCompleted: { color: '#1A1C1E', fontWeight: '600' },

  detectionInfo: { alignItems: 'center', marginBottom: 30 },
  detectedLabel: { fontSize: 14, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  foodName: { fontSize: 24, fontWeight: '800', color: '#1A1C1E', textAlign: 'center' },

  footer: { width: '100%', marginTop: 'auto', paddingBottom: 40 },
  continueBtn: { 
    backgroundColor: '#00C853', 
    width: '100%', 
    height: 64, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  continueText: { color: 'white', fontSize: 18, fontWeight: '700' },
  
  manualBtn: { marginTop: 20, alignItems: 'center' },
  manualBtnText: { color: '#64748B', fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' }
});