import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function FoodSelectionScreen() {
  const params = useLocalSearchParams();
  
  const foodName = params.foodName ? String(params.foodName) : 'Apple';
  const confidence = params.confidence ? Number(params.confidence) : 95;
  const emoji = params.emoji ? String(params.emoji) : '🍽️';
  const fromMode = params.fromMode; 

  const predictions = params.predictions ? JSON.parse(params.predictions as string) : [];

  // 1. Confidence Logic: < 85% -> Manual Search
  React.useEffect(() => {
    if (confidence < 85) {
      router.push({
        pathname: '/food-database',
        params: { fromMode, error: 'Low confidence detection' }
      });
    }
  }, [confidence]);

  if (confidence < 85) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={{ marginTop: 20 }}>Redirecting to manual search...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Confidence Logic: 85-94% -> Show Top 3 Predictions
  const showMultiple = confidence >= 85 && confidence < 95 && predictions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color="#7D8592" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-circle" size={80} color="#00C853" />
        </View>

        <Text style={styles.title}>Food Detected!</Text>
        <Text style={styles.subtitle}>
          {showMultiple ? "We found a few possibilities" : "We identified this food item"}
        </Text>

        {showMultiple ? (
          <View style={{ width: '100%', marginBottom: 20 }}>
            {predictions.slice(0, 3).map((item: string, index: number) => (
              <TouchableOpacity 
                key={index}
                style={[styles.greenCard, { padding: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' }]}
                onPress={() => router.push({ 
                  pathname: '/food-quantity', 
                  params: { ...params, foodName: item } 
                })}
              >
                <Text style={[styles.foodName, { fontSize: 18 }]}>{item}</Text>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.greenCard}>
            <Text style={styles.foodEmoji}>{emoji}</Text>
            <Text style={styles.foodName}>{foodName}</Text>
            <Text style={styles.confidence}>{confidence}% confidence</Text>
          </View>
        )}

        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>Is this correct?</Text>
          <Text style={styles.confirmSub}>We'll calculate nutrition based on this</Text>
        </View>

        {!showMultiple && (
          <TouchableOpacity 
            style={styles.continueBtn} 
            onPress={() => router.push({ 
              pathname: '/food-quantity', 
              params: { 
                foodName, 
                emoji,
                fromMode 
              } 
            })}
          >
            <Text style={styles.continueText}>Yes, Continue</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.wrongBtn} 
          onPress={() => router.push({
            pathname: '/food-database',
            params: { fromMode } 
          })}
        >
          <Text style={styles.wrongText}>No, Wrong Detection</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: { padding: 20 },
  content: { alignItems: 'center', paddingHorizontal: 30 },
  successCircle: { 
    width: 120, 
    height: 120, 
    backgroundColor: '#E8F5E9', 
    borderRadius: 60, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#011627' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 8, marginBottom: 30 },
  greenCard: { 
    backgroundColor: '#00C853', 
    width: '100%', 
    borderRadius: 25, 
    padding: 35, 
    alignItems: 'center',
    elevation: 4,
    marginBottom: 30
  },
  foodEmoji: { fontSize: 60, marginBottom: 10 },
  foodName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  confidence: { color: 'white', fontSize: 14, opacity: 0.9 },
  confirmBox: { alignItems: 'center', marginBottom: 40 },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', color: '#011627' },
  confirmSub: { fontSize: 14, color: '#7D8592', marginTop: 4 },
  continueBtn: { 
    backgroundColor: '#00C853', 
    width: '100%', 
    height: 60, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15
  },
  continueText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  wrongBtn: { 
    backgroundColor: 'white', 
    width: '100%', 
    height: 60, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#DDD', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  wrongText: { color: '#7D8592', fontSize: 16, fontWeight: '600' }
});