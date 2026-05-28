import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

export default function HealthFoodSelectionScreen() {
  const { mainIngredient } = useLocalSearchParams();

  const foodItems = [
    { id: '1', name: `Grilled ${mainIngredient}`, emoji: '🔥' },
    { id: '2', name: `${mainIngredient} Salad`, emoji: '🥗' },
    { id: '3', name: `Roasted ${mainIngredient}`, emoji: '🥘' },
    { id: '4', name: `Boiled ${mainIngredient}`, emoji: '🍲' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#555" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.headerTitle}>{mainIngredient} Dishes</Text>
        <Text style={styles.subTitle}>Select the specific food item</Text>

        <FlatList
          data={foodItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.foodCard}
              onPress={() => router.push({
                pathname: '/health-quantity',
                params: { foodName: item.name, emoji: item.emoji } // Standardized param names
              })}
            >
              <Text style={styles.foodEmoji}>{item.emoji}</Text>
              <Text style={styles.foodName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  backBtn: { padding: 20 },
  content: { flex: 1, paddingHorizontal: 25 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#011627' },
  subTitle: { fontSize: 16, color: '#7D8592', marginTop: 5, marginBottom: 20 },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12
  },
  foodEmoji: { fontSize: 24, marginRight: 15 },
  foodName: { flex: 1, fontSize: 18, fontWeight: '600', color: '#011627' }
});