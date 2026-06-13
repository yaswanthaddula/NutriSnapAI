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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 
import useAppStore from '../src/store/useAppStore';
import apiService from '../src/services/apiService';
import notificationService from '../src/services/notificationService';
import DateTimePicker from '@react-native-community/datetimepicker';

const CircularWebTimePickerModal = ({ visible, initialValue, onClose, onSave, theme }: any) => {
  const [h, setH] = useState('12');
  const [m, setM] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (visible && initialValue) {
      const parts = initialValue.split(/[: ]/);
      setH(parts[0] || '12');
      setM(parts[1] || '00');
      setAmpm(parts[2] || 'AM');
      setMode('hour');
    }
  }, [visible, initialValue]);

  if (!visible) return null;

  const clockSize = 240;
  const center = clockSize / 2;
  const radius = clockSize * 0.38;

  const getCoordinates = (value: number, total: number) => {
    const angle = (value / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle) - 18,
      y: center + radius * Math.sin(angle) - 18,
    };
  };

  const getRotation = (value: number, total: number) => {
    return (value / total) * 360;
  };

  const renderClockNumbers = () => {
    const isHour = mode === 'hour';
    const total = isHour ? 12 : 60;
    const step = isHour ? 1 : 5;
    const items = [];

    const selectedValue = isHour ? parseInt(h, 10) % 12 : parseInt(m, 10);
    const rotation = getRotation(selectedValue, total);

    // Render Hand
    items.push(
      <View key="hand-container" style={{ position: 'absolute', top: center, left: center, width: 0, height: 0, zIndex: 1 }}>
        <View style={{
          position: 'absolute',
          width: 2,
          height: radius,
          backgroundColor: '#1976D2',
          bottom: 0,
          left: -1,
          transformOrigin: 'bottom center',
          transform: [{ rotate: `${rotation}deg` }]
        }} />
        <View style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#1976D2', left: -4, top: -4 }} />
      </View>
    );

    // Render Numbers
    for (let i = 0; i < total; i += step) {
      const displayVal = isHour ? (i === 0 ? 12 : i) : i;
      const { x, y } = getCoordinates(i, total);
      const isSelected = selectedValue === i;

      items.push(
        <TouchableOpacity
          key={`num-${i}`}
          onPress={() => {
            if (isHour) {
              setH(String(displayVal).padStart(2, '0'));
              setMode('minute');
            } else {
              setM(String(displayVal).padStart(2, '0'));
            }
          }}
          style={{
            position: 'absolute', left: x, top: y, width: 36, height: 36, borderRadius: 18,
            backgroundColor: isSelected ? '#1976D2' : 'transparent',
            justifyContent: 'center', alignItems: 'center', zIndex: 2
          }}
        >
          <Text style={{ color: isSelected ? '#FFF' : '#333', fontSize: 16 }}>{displayVal}</Text>
        </TouchableOpacity>
      );
    }
    return items;
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={{ width: 320, backgroundColor: '#FFF', borderRadius: 4, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10 }}>
        {/* Header */}
        <View style={{ backgroundColor: '#1976D2', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <TouchableOpacity onPress={() => setMode('hour')}>
              <Text style={{ fontSize: 48, color: mode === 'hour' ? '#FFF' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{h}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 48, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginHorizontal: 5 }}>:</Text>
            <TouchableOpacity onPress={() => setMode('minute')}>
              <Text style={{ fontSize: 48, color: mode === 'minute' ? '#FFF' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{m}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: 15, justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => setAmpm('AM')} style={{ marginBottom: 5 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: ampm === 'AM' ? '#FFF' : 'rgba(255,255,255,0.6)' }}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAmpm('PM')}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: ampm === 'PM' ? '#FFF' : 'rgba(255,255,255,0.6)' }}>PM</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clock Face */}
        <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#FFF' }}>
          <View style={{ width: clockSize, height: clockSize, borderRadius: clockSize / 2, backgroundColor: '#F0F0F0', position: 'relative' }}>
            {renderClockNumbers()}
          </View>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 15, backgroundColor: '#FFF' }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 10, marginRight: 15 }}>
            <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 16 }}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSave(`${h}:${m} ${ampm}`)} style={{ padding: 10 }}>
            <Text style={{ color: '#1976D2', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Custom Time Picker Component
const CustomTimePicker = ({ label, value, onChange, theme }: any) => {
  const parseToDate = (timeStr: string) => {
    const now = new Date();
    if (!timeStr) return now;

    const ampmMatch = timeStr.match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*(AM|PM)$/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      if (ampmMatch[3].toUpperCase() === 'PM' && h < 12) h += 12;
      if (ampmMatch[3].toUpperCase() === 'AM' && h === 12) h = 0;
      now.setHours(h, parseInt(ampmMatch[2], 10), 0, 0);
      return now;
    }

    const match24 = timeStr.match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?$/);
    if (match24) {
      now.setHours(parseInt(match24[1], 10), parseInt(match24[2], 10), 0, 0);
      return now;
    }

    return now;
  };

  const [currentDate, setCurrentDate] = useState(parseToDate(value));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setCurrentDate(parseToDate(value));
  }, [value]);

  const onChangePicker = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate && event.type !== 'dismissed') {
        let h = selectedDate.getHours();
        const m = String(selectedDate.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        onChange(`${String(h).padStart(2, '0')}:${m} ${ampm}`);
      }
    } else if (Platform.OS === 'ios') {
      if (selectedDate) {
        setCurrentDate(selectedDate);
      }
    }
  };

  const handleIosDone = () => {
    let h = currentDate.getHours();
    const m = String(currentDate.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    onChange(`${String(h).padStart(2, '0')}:${m} ${ampm}`);
    setShowPicker(false);
  };

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timePickerLabel, { color: theme.subText }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.timePickerValueBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.timePickerValueText, { color: theme.text }]}>
          {value || "Select Time"}
        </Text>
        <Ionicons name="time-outline" size={18} color={theme.text} />
      </TouchableOpacity>

      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent={true} animationType="slide" visible={showPicker}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: theme.cardBg, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <DateTimePicker
                value={currentDate}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={onChangePicker}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10 }}>
                <TouchableOpacity onPress={() => setShowPicker(false)} style={{ flex: 1, backgroundColor: theme.cardBg, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleIosDone} style={{ flex: 1, backgroundColor: '#00C853', padding: 15, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="time"
          is24Hour={false}
          display="default" // Native Android Clock Wheel
          onChange={onChangePicker}
        />
      )}
      
      {Platform.OS === 'web' && (
        <CircularWebTimePickerModal
          visible={showPicker}
          initialValue={value}
          onClose={() => setShowPicker(false)}
          onSave={(newVal: string) => {
            onChange(newVal);
            setShowPicker(false);
          }}
          theme={theme}
        />
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

// Custom Repeat Picker Component
const RepeatPicker = ({ value, onChange, theme }: any) => {
  const options = ["Daily", "Weekdays", "Weekends", "Custom Days"];
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timePickerLabel, { color: theme.subText }]}>Repeat</Text>
      <TouchableOpacity 
        style={[styles.timePickerValueBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={[styles.timePickerValueText, { color: theme.text }]}>{value || "Daily"}</Text>
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

// Reminder Preview Component
const ReminderPreview = ({ title, time, repeat, theme }: any) => (
  <View style={{ marginTop: 10, padding: 15, borderRadius: 12, backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }}>
    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase', marginBottom: 8 }}>Preview Before Save</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="notifications" size={20} color="#00C853" />
      <View style={{ marginLeft: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{title}</Text>
        <Text style={{ fontSize: 14, color: theme.subText, marginTop: 2 }}>{time} • {repeat}</Text>
      </View>
    </View>
  </View>
);

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
      breakfastRepeat: notificationPrefs.breakfastRepeat || 'Daily',
      lunchRepeat: notificationPrefs.lunchRepeat || 'Daily',
      dinnerRepeat: notificationPrefs.dinnerRepeat || 'Daily',
      snackRepeat: notificationPrefs.snackRepeat || 'Daily',
      workoutRepeat: notificationPrefs.workoutRepeat || 'Daily',
      sleepRepeat: notificationPrefs.sleepRepeat || 'Daily',
    });
  }, [userProfile]);

  const handleAutoSave = async (updatedFields: any) => {
    try {
      const merged = { ...localProfile, ...updatedFields };
      setLocalProfile(merged);

      const toSave = { ...userProfile, ...merged };
      setUserProfile(toSave); // This directly syncs with dashboard
      
      // Save repeat preferences locally
      if (updatedFields.breakfastRepeat) updateNotificationPrefs('breakfastRepeat', updatedFields.breakfastRepeat);
      if (updatedFields.lunchRepeat) updateNotificationPrefs('lunchRepeat', updatedFields.lunchRepeat);
      if (updatedFields.dinnerRepeat) updateNotificationPrefs('dinnerRepeat', updatedFields.dinnerRepeat);
      if (updatedFields.snackRepeat) updateNotificationPrefs('snackRepeat', updatedFields.snackRepeat);
      if (updatedFields.workoutRepeat) updateNotificationPrefs('workoutRepeat', updatedFields.workoutRepeat);
      if (updatedFields.sleepRepeat) updateNotificationPrefs('sleepRepeat', updatedFields.sleepRepeat);

      // Save to backend silently
      apiService.saveProfile(toSave).catch(e => console.log("Silent backend save error:", e));
      
      // Reschedule Native Notifications instantly
      await notificationService.scheduleReminderNotifications();
      console.log("Reminder Auto-Saved & Rescheduled Instantly!");
    } catch (err) {
      console.error("Failed to auto-save reminder:", err);
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
                onChange={(val: string) => handleAutoSave({ breakfastReminderTime: val })}
                theme={theme}
              />
              <RepeatPicker value={localProfile.breakfastRepeat} onChange={(val: string) => handleAutoSave({ breakfastRepeat: val })} theme={theme} />
              <ReminderPreview title="Breakfast Reminder" time={localProfile.breakfastReminderTime} repeat={localProfile.breakfastRepeat} theme={theme} />
              
              <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

              <CustomTimePicker
                label="Lunch"
                value={localProfile.lunchReminderTime}
                onChange={(val: string) => handleAutoSave({ lunchReminderTime: val })}
                theme={theme}
              />
              <RepeatPicker value={localProfile.lunchRepeat} onChange={(val: string) => handleAutoSave({ lunchRepeat: val })} theme={theme} />
              <ReminderPreview title="Lunch Reminder" time={localProfile.lunchReminderTime} repeat={localProfile.lunchRepeat} theme={theme} />

              <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

              <CustomTimePicker
                label="Dinner"
                value={localProfile.dinnerReminderTime}
                onChange={(val: string) => handleAutoSave({ dinnerReminderTime: val })}
                theme={theme}
              />
              <RepeatPicker value={localProfile.dinnerRepeat} onChange={(val: string) => handleAutoSave({ dinnerRepeat: val })} theme={theme} />
              <ReminderPreview title="Dinner Reminder" time={localProfile.dinnerReminderTime} repeat={localProfile.dinnerRepeat} theme={theme} />
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
                onChange={(val: string) => handleAutoSave({ workoutReminderTime: val })}
                theme={theme}
              />
              <RepeatPicker value={localProfile.workoutRepeat} onChange={(val: string) => handleAutoSave({ workoutRepeat: val })} theme={theme} />
              <ReminderPreview title="Workout Reminder" time={localProfile.workoutReminderTime} repeat={localProfile.workoutRepeat} theme={theme} />
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
                onChange={(val: string) => handleAutoSave({ waterReminderInterval: val })}
                theme={theme}
              />
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
                onChange={(val: string) => handleAutoSave({ sleepReminderTime: val })}
                theme={theme}
              />
              <RepeatPicker value={localProfile.sleepRepeat} onChange={(val: string) => handleAutoSave({ sleepRepeat: val })} theme={theme} />
              <ReminderPreview title="Sleep Reminder" time={localProfile.sleepReminderTime} repeat={localProfile.sleepRepeat} theme={theme} />
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
  gridPickerWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    padding: 15,
  },
  gridSectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 12,
  },
  gridItem: {
    width: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmItem: {
    width: '47%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeGridBtn: {
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
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
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: 300,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  spinnerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    position: 'relative',
  },
  highlightLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    borderBottomWidth: 1,
    zIndex: -1,
  },
  colonText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 20,
  },
  modalBtn: {
    padding: 10,
  },
  modalBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  }
});