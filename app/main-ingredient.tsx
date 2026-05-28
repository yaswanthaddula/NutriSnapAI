import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { searchFoods, getFoodDetail } from '../src/services/fatSecretService';

export default function MainIngredientScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Serving Modal State
  const [selectedFood, setSelectedFood] = React.useState<any>(null);
  const [servingModalVisible, setServingModalVisible] = React.useState(false);
  const [fetchingDetail, setFetchingDetail] = React.useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await searchFoods(text);
      if (data) {
        setResults(data.slice(0, 10));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = async (food: any) => {
    setFetchingDetail(true);
    try {
      const detail = await getFoodDetail(food.food_id);
      setSelectedFood(detail);
      setServingModalVisible(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleSelectServing = (serving: any) => {
    setServingModalVisible(false);
    router.push({
      pathname: '/food-quantity',
      params: { 
        ...params,
        foodName: selectedFood.food_name,
        foodId: selectedFood.food_id,
        servingData: JSON.stringify(serving),
        unitType: serving.metric_serving_unit || 'g',
        calories: serving.calories,
        protein: serving.protein,
        carbs: serving.carbs,
        fat: serving.fat
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color="#7D8592" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Food Database 🍎</Text>
        <Text style={styles.subtitle}>Search thousands of items</Text>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Type at least 3 characters..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={20} color="#7D8592" />
        </View>

        {loading && <ActivityIndicator size="small" color="#00C853" style={{ marginBottom: 20 }} />}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* RESULTS FLATLIST */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.food_id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            !loading && searchQuery.length >= 3 ? (
              <Text style={styles.noResults}>No foods found for "{searchQuery}"</Text>
            ) : null
          )}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.ingredientBtn}
              onPress={() => handleSelectFood(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientText}>{item.food_name}</Text>
                <Text style={styles.ingredientSub}>{item.food_description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* SERVING SELECTION MODAL */}
      <Modal visible={servingModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Serving</Text>
              <TouchableOpacity onPress={() => setServingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#7D8592" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.selectedFoodName}>{selectedFood?.food_name}</Text>
            
            <ScrollView style={{ maxHeight: 400 }}>
              {selectedFood?.servings.map((serving: any, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.servingItem}
                  onPress={() => handleSelectServing(serving)}
                >
                  <Text style={styles.servingDesc}>{serving.serving_description}</Text>
                  <Text style={styles.servingStats}>
                    {serving.calories} kcal  •  P: {serving.protein}g  •  C: {serving.carbs}g  •  F: {serving.fat}g
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {fetchingDetail && (
        <View style={styles.fullLoading}>
          <ActivityIndicator size="large" color="#00C853" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: { padding: 20 },
  content: { flex: 1, paddingHorizontal: 25 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#011627' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 5, marginBottom: 30 },
  ingredientBtn: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#F0F0F0', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 12,
  },
  ingredientText: { fontSize: 16, fontWeight: 'bold', color: '#011627' },
  ingredientSub: { fontSize: 12, color: '#7D8592', marginTop: 4 },
  searchContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 55, 
    alignItems: 'center',
    marginBottom: 20
  },
  searchInput: { flex: 1, fontSize: 16, color: '#011627' },
  errorContainer: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 10, marginTop: 20 },
  errorText: { color: '#D32F2F', textAlign: 'center' },
  noResults: { color: '#7D8592', textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  selectedFoodName: { fontSize: 16, color: '#00C853', fontWeight: 'bold', marginBottom: 20 },
  servingItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  servingDesc: { fontSize: 16, fontWeight: '600', color: '#011627' },
  servingStats: { fontSize: 12, color: '#7D8592', marginTop: 4 },
  fullLoading: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(255,255,255,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});