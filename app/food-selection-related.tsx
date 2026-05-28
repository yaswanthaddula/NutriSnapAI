import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function FoodSelectionRelatedScreen() {
  const params = useLocalSearchParams();
  
  // Get the ingredient name from the previous page (e.g., "Chicken")
  const mainIngredient = (params.foodName as string) || 'Chicken';

  // This data would normally come from an API, but here is the logic for your screenshot
  const relatedDishes = [
    { name: 'Chicken Biryani', kcal: '520', protein: '38g', emoji: '🍛' },
    { name: 'Chicken Curry', kcal: '450', protein: '35g', emoji: '🥘' },
    { name: 'Grilled Chicken', kcal: '280', protein: '45g', emoji: '🍗' },
    { name: 'Chicken Rice Bowl', kcal: '420', protein: '32g', emoji: '🍚' },
    { name: 'Chicken Stir Fry', kcal: '380', protein: '40g', emoji: '🥢' },
  ];

  const handleDishSelect = (dish: any) => {
    // Navigate to the Quantity page with the specific dish data
    router.push({
      pathname: '/food-quantity',
      params: { 
        foodName: dish.name, 
        emoji: dish.emoji,
        // Passing these values so final nutrition is accurate
        calories: dish.kcal,
        protein: dish.protein.replace('g', '') 
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color="#7D8592" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Select Your Food</Text>
        <Text style={styles.subtitle}>Related {mainIngredient.toLowerCase()} dishes</Text>

        {/* RELATED DISHES LIST */}
        {relatedDishes.map((dish, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.dishCard}
            onPress={() => handleDishSelect(dish)}
          >
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{dish.name}</Text>
              <Text style={styles.dishStats}>
                {dish.kcal} kcal  •  {dish.protein} protein
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: { padding: 20 },
  scroll: { paddingHorizontal: 25, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#011627' },
  subtitle: { fontSize: 16, color: '#7D8592', marginTop: 5, marginBottom: 30 },
  
  dishCard: { 
    flexDirection: 'row',
    backgroundColor: 'white', 
    height: 90, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#F0F0F0', 
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 18, fontWeight: 'bold', color: '#011627' },
  dishStats: { fontSize: 14, color: '#7D8592', marginTop: 4 },
});