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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';
import notificationService from '../src/services/notificationService';

// Custom Time Picker Component
const CustomTimePicker = ({ label, value, onChange, theme }: any) => {
  const parseTo12h = (timeStr: string) => {
    // Get current system time as fallback defaults
    const now = new Date();
    let defaultHourRaw = now.getHours();
    const defaultAmPm = defaultHourRaw >= 12 ? 'PM' : 'AM';
    defaultHourRaw = defaultHourRaw % 12;
    if (defaultHourRaw === 0) defaultHourRaw = 12;
    const defaultHour = String(defaultHourRaw).padStart(2, '0');
    // Round to nearest 5 minutes
    const defaultMinute = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');

    if (!timeStr) return { hour: defaultHour, minute: defaultMinute, ampm: defaultAmPm };

    // Try matching 12h format: "08:00 AM" or "8.00 PM"
    const ampmMatch = timeStr.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      return {
        hour: String(parseInt(ampmMatch[1], 10)).padStart(2, '0'),
        minute: ampmMatch[2],
        ampm: ampmMatch[3].toUpperCase()
      };
    }

    // Try matching 24h format: "18.30" or "08:30"
    const match24 = timeStr.match(/^(\d{1,2})[:.](\d{2})$/);
    if (match24) {
      let hour = parseInt(match24[1], 10);
      const minute = match24[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12;
      if (hour === 0) hour = 12;
      return {
        hour: String(hour).padStart(2, '0'),
        minute: minute,
        ampm: ampm
      };
    }

    return { hour: defaultHour, minute: defaultMinute, ampm: defaultAmPm };
  };

  const { hour: currentHour, minute: currentMinute, ampm: currentAmPm } = parseTo12h(value);

  const [showDropdowns, setShowDropdowns] = useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
  const ampms = ["AM", "PM"];

  const handleSelect = (h: string, m: string, ap: string) => {
    onChange(`${h}:${m} ${ap}`);
  };

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timePickerLabel, { color: theme.subText }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.timePickerValueBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => setShowDropdowns(!showDropdowns)}
      >
        <Text style={[styles.timePickerValueText, { color: theme.text }]}>
          {currentHour}:{currentMinute} {currentAmPm}
        </Text>
        <Ionicons name={showDropdowns ? "chevron-up" : "chevron-down"} size={18} color={theme.text} />
      </TouchableOpacity>

      {showDropdowns && (
        <View style={[styles.dropdownsWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', height: 160 }}>
            {/* Hours Column */}
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {hours.map(h => (
                <TouchableOpacity 
                  key={h} 
                  style={[styles.pickerItem, h === currentHour && { backgroundColor: '#00C853' }]}
                  onPress={() => handleSelect(h, currentMinute, currentAmPm)}
                >
                  <Text style={[styles.pickerItemText, { color: h === currentHour ? '#FFF' : theme.text }]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Minutes Column */}
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {minutes.map(m => (
                <TouchableOpacity 
                  key={m} 
                  style={[styles.pickerItem, m === currentMinute && { backgroundColor: '#00C853' }]}
                  onPress={() => handleSelect(currentHour, m, currentAmPm)}
                >
                  <Text style={[styles.pickerItemText, { color: m === currentMinute ? '#FFF' : theme.text }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* AM/PM Column */}
            <View style={styles.pickerScroll}>
              {ampms.map(ap => (
                <TouchableOpacity 
                  key={ap} 
                  style={[styles.pickerItem, ap === currentAmPm && { backgroundColor: '#00C853' }]}
                  onPress={() => handleSelect(currentHour, currentMinute, ap)}
                >
                  <Text style={[styles.pickerItemText, { color: ap === currentAmPm ? '#FFF' : theme.text }]}>{ap}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.closeDropdownBtn, { borderTopColor: theme.border }]} 
            onPress={() => setShowDropdowns(false)}
          >
            <Text style={{ color: '#00C853', fontWeight: 'bold' }}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Custom Water Frequency Picker Component
const WaterIntervalPicker = ({ value, onChange, theme }: any) => {
  const options = ["Every 30 min", "Every 1 hour", "Every 2 hours", "Every 3 hours"];
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timePickerLabel, { color: theme.subText }]}>Reminder Interval</Text>
      <TouchableOpacity 
        style={[styles.timePickerValueBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={[styles.timePickerValueText, { color: theme.text }]}>{value || "Select Interval"}</Text>
        <Ionicons name={showOptions ? "chevron-up" : "chevron-down"} size={18} color={theme.text} />
      </TouchableOpacity>

      {showOptions && (
        <View style={[styles.dropdownsWrapper, { flexDirection: 'column', backgroundColor: theme.card, borderColor: theme.border, padding: 5 }]}>
          {options.map(opt => (
            <TouchableOpacity 
              key={opt} 
              style={[styles.intervalItem, opt === value && { backgroundColor: '#00C853' }]}
              onPress={() => {
                onChange(opt);
                setShowOptions(false);
              }}
            >
              <Text style={{ color: opt === value ? '#FFF' : theme.text, fontWeight: '500' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function NotificationsScreen() {
  const { isDark } = useTheme();

  const { notificationPrefs, updateNotificationPrefs, userProfile, setUserProfile } = useAppStore();

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    cardBg: isDark ? '#262626' : '#FFFFFF',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  const [localProfile, setLocalProfile] = useState<any>(null);

  useEffect(() => {
    setLocalProfile({
      breakfastReminderTime: userProfile.breakfastReminderTime || '08:00 AM',
      lunchReminderTime: userProfile.lunchReminderTime || '01:00 PM',
      dinnerReminderTime: userProfile.dinnerReminderTime || '08:00 PM',
      snackReminderTime: userProfile.snackReminderTime || '04:00 PM',
      waterReminderInterval: userProfile.waterReminderInterval || 'Every 1 hour',
      workoutReminderTime: userProfile.workoutReminderTime || '06:00 PM',
      sleepReminderTime: userProfile.sleepReminderTime || '10:00 PM',
    });
  }, [userProfile]);

  const handleSaveReminder = async () => {
    try {
      const granted = await notificationService.registerForPushNotificationsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Notification permissions are disabled. Please enable them in your device settings to receive reminders.",
          [{ text: "OK" }]
        );
        return;
      }

      const updated = {
        ...userProfile,
        ...localProfile
      };
      
      setUserProfile(updated);
      await apiService.saveProfile(updated);
      await notificationService.scheduleReminderNotifications();

      Alert.alert("Success", "Reminder settings saved successfully!");
    } catch (err) {
      console.error("Failed to save reminders:", err);
      Alert.alert("Error", "Failed to save reminders to the server.");
    }
  };

  const handleTogglePref = async (key: string, val: boolean) => {
    if (val) {
      const granted = await notificationService.registerForPushNotificationsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Notification permissions are disabled. Please enable them in your device settings to receive reminders.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    updateNotificationPrefs(key, val);
    setTimeout(async () => {
      await notificationService.scheduleReminderNotifications();
    }, 100);
  };

  // Helper to render each notification row
  const NotificationOption = ({ title, sub, value, onToggle }: any) => (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.optionSub, { color: theme.subText }]}>{sub}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#DDD', true: '#00C853' }} 
        thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
 
        {/* Title Section */}
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Manage your notification preferences</Text>
        </View>

        {/* Options List */}
        <View style={styles.listContainer}>
          <NotificationOption 
            title="Meal Reminders" 
            sub="Get reminded to log your meals" 
            value={notificationPrefs.meals} 
            onToggle={(val: boolean) => handleTogglePref('meals', val)} 
          />
          {notificationPrefs.meals && localProfile && (
            <View style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <CustomTimePicker
                label="Breakfast"
                value={localProfile.breakfastReminderTime}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, breakfastReminderTime: val }))}
                theme={theme}
              />
              <CustomTimePicker
                label="Lunch"
                value={localProfile.lunchReminderTime}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, lunchReminderTime: val }))}
                theme={theme}
              />
              <CustomTimePicker
                label="Dinner"
                value={localProfile.dinnerReminderTime}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, dinnerReminderTime: val }))}
                theme={theme}
              />
              <CustomTimePicker
                label="Snacks"
                value={localProfile.snackReminderTime}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, snackReminderTime: val }))}
                theme={theme}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder}>
                <Text style={styles.saveBtnText}>Save Meal Reminders</Text>
              </TouchableOpacity>
            </View>
          )}

          <NotificationOption 
            title="Workout Reminders" 
            sub="Daily workout notifications" 
            value={notificationPrefs.workout} 
            onToggle={(val: boolean) => handleTogglePref('workout', val)} 
          />
          {notificationPrefs.workout && localProfile && (
            <View style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <CustomTimePicker
                label="Workout Time"
                value={localProfile.workoutReminderTime}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, workoutReminderTime: val }))}
                theme={theme}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder}>
                <Text style={styles.saveBtnText}>Save Workout Reminder</Text>
              </TouchableOpacity>
            </View>
          )}

          <NotificationOption 
            title="Water Reminders" 
            sub="Stay hydrated throughout the day" 
            value={notificationPrefs.water} 
            onToggle={(val: boolean) => handleTogglePref('water', val)} 
          />
          {notificationPrefs.water && localProfile && (
            <View style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <WaterIntervalPicker
                value={localProfile.waterReminderInterval}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, waterReminderInterval: val }))}
                theme={theme}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder}>
                <Text style={styles.saveBtnText}>Save Water Reminder</Text>
              </TouchableOpacity>
            </View>
          )}

          <NotificationOption 
            title="Sleep Reminder" 
            sub="Time to sleep and recover" 
            value={notificationPrefs.sleep} 
            onToggle={(val: boolean) => handleTogglePref('sleep', val)} 
          />
          {notificationPrefs.sleep && localProfile && (
            <View style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <CustomTimePicker
                label="Bedtime Reminder"
                value={localProfile.sleepReminderTime}
                onChange={(val: string) => setLocalProfile((prev: any) => ({ ...prev, sleepReminderTime: val }))}
                theme={theme}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder}>
                <Text style={styles.saveBtnText}>Save Sleep Reminder</Text>
              </TouchableOpacity>
            </View>
          )}

          <NotificationOption 
            title="Goal Achievements" 
            sub="Celebrate your milestones" 
            value={notificationPrefs.goals} 
            onToggle={(val: boolean) => handleTogglePref('goals', val)} 
          />
          <NotificationOption 
            title="Weekly Reports" 
            sub="Get weekly progress summaries" 
            value={notificationPrefs.reports} 
            onToggle={(val: boolean) => handleTogglePref('reports', val)} 
          />
          <NotificationOption 
            title="Motivational Quotes" 
            sub="Daily inspiration" 
            value={notificationPrefs.quotes} 
            onToggle={(val: boolean) => handleTogglePref('quotes', val)} 
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  backBtn: { marginBottom: 20, marginLeft: -10 },
  headerText: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
  listContainer: { marginTop: 10 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15,
    // Android Shadow
    elevation: 2,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  optionTitle: { fontSize: 18, fontWeight: 'bold' },
  optionSub: { fontSize: 14, marginTop: 4 },

  expandedConfig: {
    padding: 20,
    borderRadius: 20,
    marginTop: -10,
    marginBottom: 15,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5
  },
  timePickerContainer: {
    marginBottom: 15,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timePickerValueBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  timePickerValueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownsWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeDropdownBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  intervalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: '#00C853',
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
});