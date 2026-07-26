import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';
import { Audio } from 'expo-av';

const SOUNDS = [
  { id: 'default_bell', name: 'Default Bell', file: require('../assets/sounds/default_bell.wav') },
  { id: 'soft_bell', name: 'Soft Bell', file: require('../assets/sounds/soft_bell.wav') },
  { id: 'gentle_chime', name: 'Gentle Chime', file: require('../assets/sounds/gentle_chime.wav') },
  { id: 'water_drop', name: 'Water Drop', file: require('../assets/sounds/water_drop.wav') },
  { id: 'alert_tone', name: 'Alert Tone', file: require('../assets/sounds/alert_tone.wav') },
  { id: 'alarm', name: 'Alarm', file: require('../assets/sounds/alarm.wav') },
  { id: 'heartbeat', name: 'Heartbeat', file: require('../assets/sounds/heartbeat.wav') },
  { id: 'gym_bell', name: 'Gym Bell', file: require('../assets/sounds/gym_bell.wav') },
  { id: 'classic_notification', name: 'Classic Notification', file: require('../assets/sounds/classic_notification.wav') },
  { id: 'digital_bell', name: 'Digital Bell', file: require('../assets/sounds/digital_bell.wav') },
];

export default function NotificationSoundSettings() {
  const { isDark } = useTheme();
  const { fromMode } = useLocalSearchParams();
  const currentMode = fromMode === 'gym' ? 'gym' : 'health';

  const { 
    healthNotificationSound, 
    gymNotificationSound, 
    setHealthNotificationSound, 
    setGymNotificationSound 
  } = useAppStore();

  const currentSoundId = currentMode === 'gym' ? gymNotificationSound : healthNotificationSound;

  const [selectedSound, setSelectedSound] = useState(currentSoundId || 'default_bell');
  const [playingSoundObj, setPlayingSoundObj] = useState<Audio.Sound | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    return () => {
      if (playingSoundObj) {
        playingSoundObj.unloadAsync();
      }
    };
  }, [playingSoundObj]);

  const playPreview = async (file: any) => {
    try {
      if (playingSoundObj) {
        await playingSoundObj.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(file);
      setPlayingSoundObj(sound);
      await sound.playAsync();
    } catch (e) {
      console.log('Error playing sound preview', e);
    }
  };

  const handleSave = () => {
    if (currentMode === 'gym') {
      setGymNotificationSound(selectedSound);
    } else {
      setHealthNotificationSound(selectedSound);
    }
    setSuccessMsg('✅ Notification sound updated successfully.');
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>Notification Sound</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {currentMode === 'gym' ? 'Gym Dashboard Sounds' : 'Health Dashboard Sounds'}
          </Text>
        </View>

        {successMsg ? (
          <View style={[styles.successBanner, { backgroundColor: isDark ? '#1b5e20' : '#E8F5E9' }]}>
            <Text style={[styles.successText, { color: isDark ? '#a5d6a7' : '#2E7D32' }]}>{successMsg}</Text>
          </View>
        ) : null}

        <View style={[styles.listContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {SOUNDS.map((s, index) => {
            const isSelected = selectedSound === s.id;
            return (
              <TouchableOpacity 
                key={s.id} 
                style={[
                  styles.soundItem, 
                  { borderBottomColor: index === SOUNDS.length - 1 ? 'transparent' : theme.border }
                ]}
                onPress={() => setSelectedSound(s.id)}
              >
                <View style={styles.leftContent}>
                  <TouchableOpacity onPress={() => playPreview(s.file)} style={styles.playBtn}>
                    <Ionicons name="play" size={20} color="#00C853" />
                    <Text style={[styles.playText, { color: theme.subText }]}>Preview</Text>
                  </TouchableOpacity>
                  <Text style={[styles.soundName, { color: theme.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>{s.name}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#00C853" />}
                {!isSelected && <Ionicons name="ellipse-outline" size={24} color={theme.border} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 50 },
  backBtn: { marginBottom: 20, marginLeft: -5 },
  headerText: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  successBanner: { padding: 15, borderRadius: 12, marginBottom: 20 },
  successText: { fontSize: 16, fontWeight: '500' },
  listContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  soundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 15
  },
  playText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold'
  },
  soundName: {
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#00C853',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
