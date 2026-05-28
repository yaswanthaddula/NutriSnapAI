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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useGlobalSearchParams } from 'expo-router';
// --- IMPORT THE THEME HOOK ---
import { useTheme } from '../_layout'; 
import useAppStore from '../../src/store/useAppStore';

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
      
      {/* --- TOP GREEN HEADER (Stays Green) --- */}
      <View style={styles.greenHeader}>
        <View style={styles.userInfoArea}>
          <View style={styles.avatarCircle}>
            <Image 
              source={{ uri: userProfile.gender?.toLowerCase() === 'female' 
                ? 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png' // Female Icon
                : 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' // Male Icon
              }} 
              style={styles.avatarImage} 
              resizeMode="cover"
            />
          </View>
          <View style={styles.nameContainer}>
            {/* --- UPDATED TO USE STATE --- */}
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userAge}>{age} years old</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNum, { color: theme.text }]}>{userProfile.weight}</Text>
            <Text style={styles.statLab}>Weight</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNum, { color: theme.text }]}>{userProfile.height}</Text>
            <Text style={styles.statLab}>Height</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.statNum, { color: theme.text }]}>
              {((userProfile.weight / ((userProfile.height / 100) ** 2)) || 0).toFixed(1)}
            </Text>
            <Text style={styles.statLab}>BMI</Text>
          </View>
        </View>
      </View>

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

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Notifications</Text>
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
          onPress={() => Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel" },
            { text: "Logout", onPress: () => router.replace('/login') }
          ])}
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
    backgroundColor: '#00C853', 
    paddingTop: 50, 
    paddingBottom: 30, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingHorizontal: 25 
  },
  userInfoArea: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  nameContainer: { marginLeft: 15 },
  userName: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  userAge: { color: '#FFF', opacity: 0.9, fontSize: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  statBox: { width: '30%', height: 70, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  statNum: { fontSize: 18, fontWeight: 'bold' },
  statLab: { fontSize: 11, color: '#7D8592', marginTop: 2 },
  scrollContent: { paddingBottom: 30, paddingTop: 20 },
  menuGroup: { borderRadius: 20, marginHorizontal: 20, marginBottom: 20, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1 },
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