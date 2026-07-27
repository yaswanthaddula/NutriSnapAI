import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { searchFoods, getFoodDetail } from '../src/services/fatSecretService';

/**
 * Health Search Screen - Manual Food Database fallback.
 * Uses FatSecret API via backend.
 */
export default function HealthSearchScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce logic for search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchFoods(searchQuery);
        setResults(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectFood = async (food: any) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch full details to get detailed nutrition if available
      const detail = await getFoodDetail(food.food_id);
      
      // Use first serving as default
      const defaultServing = detail.servings[0];

      router.push({
        pathname: '/health-quantity',
        params: { 
          ...params,
          foodName: detail.food_name,
          foodId: detail.food_id,
          foodImage: detail.food_image || '',
          servingData: JSON.stringify(defaultServing),
          unitType: defaultServing.metric_serving_unit || 'serving',
          calories: defaultServing.calories,
          protein: defaultServing.protein,
          carbs: defaultServing.carbs,
          fat: defaultServing.fat,
          fromMode: 'health'
        }
      });
    } catch (err: any) {
      console.warn("Detail fetch failed, using search results as fallback:", err.message);
      // Fallback: Use what we have from search results
      if (food.calories !== undefined) {
        router.push({
          pathname: '/health-quantity',
          params: { 
            ...params,
            foodName: food.food_name,
            foodId: food.food_id,
            unitType: 'serving',
            calories: food.calories,
            protein: 0,
            carbs: 0,
            fat: 0,
            fromMode: 'health'
          }
        });
      } else {
        setError("Food details unavailable. Please try another item.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
          <View style={styles.content}>
            
            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={28} color="#011627" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Food</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* SEARCH BAR SECTION */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#7D8592" />
                    <TextInput
                        style={styles.input}
                        placeholder="Egg"
                        placeholderTextColor="#7D8592"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {loading && <ActivityIndicator size="small" color="#00C853" />}
                </View>
            </View>

            {/* ERROR HANDLING */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* RESULTS LIST */}
            <FlatList
              data={results}
              keyExtractor={(item) => item.food_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                !loading && searchQuery.length >= 3 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={60} color="#EEE" />
                    <Text style={styles.noResults}>No foods found.</Text>
                  </View>
                ) : null
              )}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.foodCard}
                  onPress={() => handleSelectFood(item)}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>{item.food_name}</Text>
                    {item.brand_name && (
                      <Text style={styles.brandName}>{item.brand_name}</Text>
                    )}
                    <Text style={styles.foodSub}>{item.serving_size} • {item.calories} kcal</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addCircle}
                    onPress={() => handleSelectFood(item)}
                  >
                    <Ionicons name="add" size={24} color="#00C853" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#011627' },
  searchSection: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 10 },
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 50, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  input: { flex: 1, fontSize: 16, color: '#011627', marginLeft: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  foodCard: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 16, 
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  cardInfo: { flex: 1 },
  foodName: { fontSize: 17, fontWeight: 'bold', color: '#011627', marginBottom: 2 },
  brandName: { fontSize: 13, fontWeight: 'bold', color: '#00C853', marginBottom: 2 },
  foodSub: { fontSize: 13, color: '#7D8592' },
  addCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: '#EEE', 
    backgroundColor: '#F9FAFB',
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 10
  },
  errorBox: { margin: 20, padding: 15, backgroundColor: '#FFEBEE', borderRadius: 10 },
  errorText: { color: '#D32F2F', textAlign: 'center', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  noResults: { color: '#7D8592', textAlign: 'center', marginTop: 10, fontSize: 16 },
});
