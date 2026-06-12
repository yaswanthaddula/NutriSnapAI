import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface StorageItem {
  key: string;
  value: any;
}

export default function DebugStorageScreen() {
  const [storageData, setStorageData] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      
      const formattedData = result.map(([key, value]) => {
        let parsedValue: any = value;
        if (value) {
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        return { key, value: parsedValue };
      });
      
      setStorageData(formattedData);
    } catch (e) {
      console.error("Failed to fetch AsyncStorage keys", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Storage",
      "Are you sure? This will wipe all local data including profile and history.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear Everything", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            fetchStorage();
            Alert.alert("Success", "AsyncStorage cleared.");
          } 
        }
      ]
    );
  };

  const handleRemoveKey = (key: string) => {
    Alert.alert(
      "Remove Key",
      `Delete ${key}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(key);
            fetchStorage();
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Storage Debugger</Text>
        <TouchableOpacity onPress={fetchStorage} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color="#00C853" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Keys in AsyncStorage ({storageData.length})</Text>
        
        {storageData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{loading ? "Loading..." : "No keys found in storage."}</Text>
          </View>
        ) : (
          storageData.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemKey}>{item.key}</Text>
                <TouchableOpacity onPress={() => handleRemoveKey(item.key)}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.itemValue}>
                  {typeof item.value === 'object' 
                    ? JSON.stringify(item.value, null, 2) 
                    : String(item.value)}
                </Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
          <Text style={styles.clearBtnText}>Clear All AsyncStorage</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          This screen is for development only. Do not link it from the main UI.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 45 : 10, 
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD'
  },
  backBtn: { padding: 5 },
  refreshBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  itemCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10, marginBottom: 10 },
  itemKey: { fontSize: 16, fontWeight: 'bold', color: '#00C853' },
  valueContainer: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8 },
  itemValue: { fontSize: 12, color: '#444', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  clearBtn: { backgroundColor: '#FF5252', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  clearBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999' },
  footerNote: { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 30, marginBottom: 50 }
});
