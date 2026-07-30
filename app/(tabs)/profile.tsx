import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Switch, 
  Platform, 
  Alert,
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { router, useGlobalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../_layout'; 
import useAppStore from '../../src/store/useAppStore';
import { getAvatarColor } from '../../src/utils/avatarUtils';
import apiService from '../../src/services/apiService';

export default function ProfileScreen() {
  const params = useGlobalSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { userProfile, loadStoredData } = useAppStore();

  // 2. States for user info
  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age.toString());

  useEffect(() => {
    loadStoredData();
  }, []);

  // 3. EFFECT: Watch for parameter changes and update the UI immediately
  useEffect(() => {
    setName(userProfile.name);
    setAge(userProfile.age.toString());
  }, [userProfile.name, userProfile.age]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to change your profile picture.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        // Optimistic UI update
        useAppStore.getState().updateUserProfile('profileImage', uri);
        
        // Upload to backend
        try {
          const uploadResp = await apiService.uploadProfilePhoto(uri);
          if (uploadResp.data && uploadResp.data.url) {
            useAppStore.getState().updateUserProfile('profileImage', uploadResp.data.url);
          }
        } catch (uploadErr) {
          console.warn("Upload failed:", uploadErr);
        }
      }
    } catch (e) {
      console.warn("Error picking image:", e);
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await apiService.logout();
      await useAppStore.getState().logout();
      try {
        await AsyncStorage.removeItem('gym_chat_session');
        await AsyncStorage.removeItem('health_chat_session');
      } catch (e) {
        console.warn("Failed to clear chat sessions", e);
      }
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout }
      ]);
    }
  };

  // 4. Define Theme Colors
  const theme = {
    background: isDark ? '#121212' : '#F9FAFB',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#333333',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    border: isDark ? '#333333' : '#F8F8F8',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* --- TOP LOGIN-STYLE HEADER --- */}
      <LinearGradient colors={['#E8F5E9', '#4CAF50']} style={styles.greenHeader}>
        <View style={styles.userInfoArea}>
          <View style={styles.avatarRing}>
            <TouchableOpacity style={styles.avatarCircle} onPress={pickImage} activeOpacity={0.8}>
              {userProfile.profileImage ? (
                <Image source={{ uri: userProfile.profileImage }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ width: '100%', height: '100%', backgroundColor: getAvatarColor(userProfile.name), justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 40, fontWeight: 'bold' }}>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.userName, { color: '#1B5E20' }]}>{name}</Text>
            <Text style={[styles.userAge, { color: '#388E3C' }]}>{age} years old</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
            <Text style={[styles.statNum, { color: '#1B5E20' }]}>{userProfile.weight}</Text>
            <Text style={[styles.statLab, { color: '#388E3C' }]}>Weight</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
            <Text style={[styles.statNum, { color: '#1B5E20' }]}>{userProfile.height}</Text>
            <Text style={[styles.statLab, { color: '#388E3C' }]}>Height</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
            <Text style={[styles.statNum, { color: '#1B5E20' }]}>
              {((userProfile.weight / ((userProfile.height / 100) ** 2)) || 0).toFixed(1)}
            </Text>
            <Text style={[styles.statLab, { color: '#388E3C' }]}>BMI</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- MAIN PROFILE DETAILS --- */}
        <View style={[styles.menuGroup, { backgroundColor: theme.card }]}>
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.subText }]}>Email</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{userProfile.email || 'Not set'}</Text>
          </View>
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.subText }]}>Gender</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{userProfile.gender}</Text>
          </View>
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.subText }]}>BMI Status</Text>
            <Text style={[styles.detailValue, { color: '#00C853', fontWeight: 'bold' }]}>{userProfile.bmiStatus}</Text>
          </View>
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.subText }]}>Current Goal</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{userProfile.goal}</Text>
          </View>
          <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: theme.subText }]}>Activity Level</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{userProfile.activityLevel}</Text>
          </View>
        </View>

        {/* --- SETTINGS GROUP --- */}
        <View style={[styles.menuGroup, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/profile-edit')}>
            <Ionicons name="person-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="swap-horizontal-outline" size={22} color={theme.text} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.menuLabelFixed, { color: theme.text }]}>Selected Mode</Text>
              <Text style={styles.modeSubText}>{userProfile.selected_mode || 'Gym'}</Text>
            </View>
          </View>

          <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="bulb-outline" size={22} color={theme.text} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.menuLabelFixed, { color: theme.text }]}>Suggested Mode</Text>
              <Text style={[styles.modeSubText, { color: '#2196F3' }]}>{userProfile.suggested_mode || 'Health'}</Text>
            </View>
            {userProfile.suggested_mode && userProfile.selected_mode && 
             userProfile.suggested_mode.toLowerCase() !== userProfile.selected_mode.toLowerCase() && (
              <View style={styles.recBadge}>
                <Text style={styles.recBadgeText}>New Suggestion</Text>
              </View>
            )}
          </View>

          {userProfile.suggested_mode && userProfile.selected_mode && 
           userProfile.suggested_mode.toLowerCase() !== userProfile.selected_mode.toLowerCase() && (
            <View style={styles.recBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#00C853" />
              <Text style={styles.recText}>
                Your updated profile suggests {userProfile.suggested_mode} Mode.
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push({ pathname: '/notifications', params: { fromMode: 'gym' } })}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Reminders</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push({ pathname: '/notification-sound', params: { fromMode: 'gym' } })}>
            <Ionicons name="musical-notes-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Notification Sound</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Ionicons name="moon-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { flex: 1, color: theme.text }]}>Dark Mode</Text>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme} 
              trackColor={{ false: '#DDD', true: '#00C853' }} 
            />
          </View>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => router.push('/goals')}>
            <MaterialCommunityIcons name="tune-variant" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Goals & Targets</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* --- SUPPORT GROUP --- */}
        <View style={[styles.menuGroup, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/support')}>
            <Ionicons name="help-circle-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderTopColor: theme.border, borderTopWidth: 1 }]} onPress={() => router.push('/privacy-policy')}>
            <Ionicons name="shield-checkmark-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderTopColor: theme.border, borderTopWidth: 1 }]} onPress={() => router.push('/about')}>
            <Ionicons name="information-circle-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>About NutriSnap AI</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greenHeader: { 
    paddingTop: 50, 
    paddingBottom: 35, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    paddingHorizontal: 25,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  userInfoArea: { flexDirection: 'column', alignItems: 'center' },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15
  },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', overflow: 'visible', position: 'relative' },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#333', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  nameContainer: { alignItems: 'center' },
  userName: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  userAge: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 4, fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  statBox: { width: '31%', height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLab: { fontSize: 13, color: '#7D8592', marginTop: 4, fontWeight: '600' },
  scrollContent: { paddingBottom: 30, paddingTop: 20 },
  menuGroup: { borderRadius: 24, marginHorizontal: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1 },
  detailLabel: { fontSize: 14, fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '500' },
  menuLabel: { fontSize: 16, fontWeight: '500', marginLeft: 15, flex: 1 },
  menuLabelFixed: { fontSize: 16, fontWeight: '500' },
  modeSubText: { color: '#00C853', fontSize: 13, fontWeight: 'bold' },
  modeLabelSmall: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  modeValueSmall: { fontSize: 13, fontWeight: 'bold' },
  recBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1FBF2', 
    paddingVertical: 10, 
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9'
  },
  recText: { 
    fontSize: 12, 
    color: '#00C853', 
    marginLeft: 8, 
    fontWeight: '600' 
  },
  recBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recBadgeText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  logoutBtn: { backgroundColor: '#FF3B30', marginHorizontal: 20, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});