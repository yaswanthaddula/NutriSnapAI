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
  Modal,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
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
    </Modal>
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
const ReminderPreview = ({ title, time, repeat, theme, onDelete }: any) => (
  <LinearGradient colors={theme.background === '#121212' ? ['#1B5E20', '#2E7D32'] : ['#E8F5E9', '#C8E6C9']} style={{ marginTop: 10, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.background === '#121212' ? '#388E3C' : '#A5D6A7' }}>
    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.background === '#121212' ? '#A5D6A7' : '#2E7D32', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Active Reminder</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.background === '#121212' ? '#4CAF50' : '#4CAF50', justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 5 }}>
        <Ionicons name="notifications" size={22} color="#FFF" />
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.background === '#121212' ? '#FFF' : '#1B5E20' }}>{title}</Text>
        <Text style={{ fontSize: 14, color: theme.background === '#121212' ? 'rgba(255,255,255,0.7)' : '#388E3C', marginTop: 2, fontWeight: '600' }}>{time} • {repeat || 'Daily'}</Text>
      </View>
      {onDelete && (
        <TouchableOpacity style={{ marginLeft: 'auto', padding: 8, backgroundColor: 'rgba(244,67,54,0.15)', borderRadius: 12 }} onPress={onDelete}>
          <Ionicons name="trash-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      )}
    </View>
  </LinearGradient>
);

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const fromMode = params.fromMode || 'health';

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    cardBg: isDark ? '#262626' : '#FFFFFF',
    border: isDark ? '#333333' : '#F0F0F0',
  };

  const { notificationPrefs, updateNotificationPrefs, userProfile, setUserProfile, reminders, deleteReminder, medicineReminders, addMedicineReminder, deleteMedicineReminder } = useAppStore();
  const [localProfile, setLocalProfile] = useState<any>(null);
  
  // Medicine Form State
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [medicineTime, setMedicineTime] = useState('09:00 AM');
  const [medicineRepeat, setMedicineRepeat] = useState('Daily');
  const [medicineNotes, setMedicineNotes] = useState('');

  const handleDeleteReminder = (typeStr: string) => {
    const activeReminder = reminders?.find((r: any) => r.reminder_type === typeStr && r.is_enabled);
    if (!activeReminder) {
      Alert.alert("Notice", "This reminder is not currently active on the server.", [{text: "OK"}]);
      return;
    }
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteReminder(activeReminder.id);
            if (typeStr === 'workout') updateNotificationPrefs('workout', false);
            else if (typeStr === 'water') updateNotificationPrefs('water', false);
            else if (typeStr === 'sleep') updateNotificationPrefs('sleep', false);
            else updateNotificationPrefs('meals', false);
            
            // Sync Native Notifications immediately
            await notificationService.scheduleReminderNotifications();
            
            Alert.alert("Success", "Reminder deleted successfully.");
          }
        }
      ]
    );
  };

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
      console.log("Reminder Preferences Auto-Saved to Profile locally.");
    } catch (err) {
      console.error("Failed to auto-save reminder:", err);
    }
  };

  const handleTogglePref = async (key: string, val: boolean) => {
    console.log("Toggle clicked:", key, val);
    
    // Set local toggle ON optimistically
    updateNotificationPrefs(key, val);

    if (val) {
      let permission = 'granted';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        permission = window.Notification.permission;
      }
      
      console.log("Notification permission:", permission);
      
      const granted = await notificationService.registerForPushNotificationsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Notifications are blocked. Please enable them in browser/app settings.",
          [{ text: "OK" }]
        );
        // Revert toggle
        updateNotificationPrefs(key, false);
      }
    }
  };

  const handleSaveReminder = async () => {
    try {
      const result = await notificationService.scheduleReminderNotifications();
      if (!result || result.success === false) {
        throw new Error(result?.error || "Backend save failed");
      }
      Alert.alert("Success", "✅ Reminder Saved Successfully");
    } catch (error: any) {
      console.log("Reminder save failed:", error);
      Alert.alert("Error", error.message || "Failed to save reminder. Please try again.");
    }
  };

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

  const renderMealSection = () => (
    <>
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
          <ReminderPreview title="Breakfast Reminder" time={localProfile.breakfastReminderTime} repeat={localProfile.breakfastRepeat} theme={theme} onDelete={() => handleDeleteReminder('breakfast')} />
          
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

          <CustomTimePicker
            label="Lunch"
            value={localProfile.lunchReminderTime}
            onChange={(val: string) => handleAutoSave({ lunchReminderTime: val })}
            theme={theme}
          />
          <RepeatPicker value={localProfile.lunchRepeat} onChange={(val: string) => handleAutoSave({ lunchRepeat: val })} theme={theme} />
          <ReminderPreview title="Lunch Reminder" time={localProfile.lunchReminderTime} repeat={localProfile.lunchRepeat} theme={theme} onDelete={() => handleDeleteReminder('lunch')} />

          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

          <CustomTimePicker
            label="Dinner"
            value={localProfile.dinnerReminderTime}
            onChange={(val: string) => handleAutoSave({ dinnerReminderTime: val })}
            theme={theme}
          />
          <RepeatPicker value={localProfile.dinnerRepeat} onChange={(val: string) => handleAutoSave({ dinnerRepeat: val })} theme={theme} />
          <ReminderPreview title="Dinner Reminder" time={localProfile.dinnerReminderTime} repeat={localProfile.dinnerRepeat} theme={theme} onDelete={() => handleDeleteReminder('dinner')} />
          <TouchableOpacity style={[styles.saveButton, { marginTop: 20 }]} onPress={handleSaveReminder}>
            <Text style={styles.saveButtonText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderWorkoutSection = () => (
    <>
      <NotificationOption 
        title="Workout & Exercise Reminders" 
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
          <ReminderPreview title="Workout Reminder" time={localProfile.workoutReminderTime} repeat={localProfile.workoutRepeat} theme={theme} onDelete={() => handleDeleteReminder('workout')} />
          <TouchableOpacity style={[styles.saveButton, { marginTop: 20 }]} onPress={handleSaveReminder}>
            <Text style={styles.saveButtonText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderWaterSection = () => (
    <>
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
          <ReminderPreview title="Water Reminder" time={localProfile.waterReminderInterval} repeat="Daily" theme={theme} onDelete={() => handleDeleteReminder('water')} />
          <TouchableOpacity style={[styles.saveButton, { marginTop: 20 }]} onPress={handleSaveReminder}>
            <Text style={styles.saveButtonText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderSleepSection = () => (
    <>
      <NotificationOption 
        title={fromMode === 'gym' ? "Recovery Reminder" : "Sleep Reminder"} 
        sub="Time to rest and recover" 
        value={notificationPrefs.sleep} 
        onToggle={(val: boolean) => handleTogglePref('sleep', val)} 
      />
      {notificationPrefs.sleep && localProfile && (
        <View style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <CustomTimePicker
            label={fromMode === 'gym' ? "Recovery Time" : "Bedtime Reminder"}
            value={localProfile.sleepReminderTime}
            onChange={(val: string) => handleAutoSave({ sleepReminderTime: val })}
            theme={theme}
          />
          <RepeatPicker value={localProfile.sleepRepeat} onChange={(val: string) => handleAutoSave({ sleepRepeat: val })} theme={theme} />
          <ReminderPreview title={fromMode === 'gym' ? "Recovery Reminder" : "Sleep Reminder"} time={localProfile.sleepReminderTime} repeat={localProfile.sleepRepeat} theme={theme} onDelete={() => handleDeleteReminder('sleep')} />
          <TouchableOpacity style={[styles.saveButton, { marginTop: 20 }]} onPress={handleSaveReminder}>
            <Text style={styles.saveButtonText}>Save Reminder</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderMedicineSection = () => (
    <>
      <View style={[styles.optionContainer, { borderBottomColor: theme.border }]}>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Medicine / Tablet Reminder</Text>
          <Text style={[styles.optionSubtitle, { color: theme.subText }]}>Never miss your medication</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowMedicineForm(!showMedicineForm)}>
          <Ionicons name={showMedicineForm ? "close" : "add"} size={20} color="#FFF" />
          <Text style={styles.addButtonText}>{showMedicineForm ? "Close" : "Add"}</Text>
        </TouchableOpacity>
      </View>

      {showMedicineForm && (
        <View style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border, padding: 15 }]}>
          <Text style={{color: theme.text, marginBottom: 5, fontWeight: 'bold'}}>Medicine Name</Text>
          <TextInput 
            style={{backgroundColor: isDark ? '#333' : '#F0F0F0', color: theme.text, padding: 10, borderRadius: 8, marginBottom: 15}}
            placeholder="e.g. Vitamin D"
            placeholderTextColor={theme.subText}
            value={medicineName}
            onChangeText={setMedicineName}
          />
          <CustomTimePicker
            label="Time"
            value={medicineTime}
            onChange={(val: string) => setMedicineTime(val)}
            theme={theme}
          />
          <RepeatPicker value={medicineRepeat} onChange={(val: string) => setMedicineRepeat(val)} theme={theme} />
          
          <Text style={{color: theme.text, marginTop: 15, marginBottom: 5, fontWeight: 'bold'}}>Notes (Optional)</Text>
          <TextInput 
            style={{backgroundColor: isDark ? '#333' : '#F0F0F0', color: theme.text, padding: 10, borderRadius: 8, marginBottom: 15}}
            placeholder="e.g. After breakfast"
            placeholderTextColor={theme.subText}
            value={medicineNotes}
            onChangeText={setMedicineNotes}
          />

          <TouchableOpacity style={[styles.saveButton, {marginTop: 10}]} onPress={() => {
            if(!medicineName.trim()) {
               Alert.alert("Required", "Please enter a medicine name");
               return;
            }
            addMedicineReminder({
              name: medicineName,
              time: medicineTime,
              repeat: medicineRepeat,
              notes: medicineNotes,
              enabled: true
            });
            setMedicineName('');
            setMedicineNotes('');
            setShowMedicineForm(false);
          }}>
            <Text style={styles.saveButtonText}>Save Medicine Reminder</Text>
          </TouchableOpacity>
        </View>
      )}

      {medicineReminders && medicineReminders.map((med: any) => (
        <View key={med.id} style={[styles.expandedConfig, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 10 }]}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
             <View>
               <Text style={{color: theme.text, fontSize: 16, fontWeight: 'bold'}}>{med.name}</Text>
               <Text style={{color: theme.subText, fontSize: 14}}>{med.time} • {med.repeat}</Text>
               {med.notes ? <Text style={{color: theme.subText, fontSize: 12, marginTop: 4}}>{med.notes}</Text> : null}
             </View>
             <TouchableOpacity onPress={() => deleteMedicineReminder(med.id)}>
               <Ionicons name="trash-outline" size={24} color="#EF4444" />
             </TouchableOpacity>
           </View>
        </View>
      ))}
    </>
  );

  const renderGoalsSection = () => (
    <NotificationOption 
      title={fromMode === 'gym' ? "Workout Goals & Achievements" : "Daily Nutrition Goal"} 
      sub={fromMode === 'gym' ? "Celebrate your fitness milestones" : "Celebrate your nutrition milestones"}
      value={notificationPrefs.goals} 
      onToggle={(val: boolean) => handleTogglePref('goals', val)} 
    />
  );

  const renderReportsSection = () => (
    <NotificationOption 
      title={fromMode === 'gym' ? "Weekly Fitness Report" : "Weekly Health Report"} 
      sub="Get weekly progress summaries" 
      value={notificationPrefs.reports} 
      onToggle={(val: boolean) => handleTogglePref('reports', val)} 
    />
  );

  const renderQuotesSection = () => (
    <NotificationOption 
      title={fromMode === 'gym' ? "AI Fitness Tips" : "AI Health Tips"} 
      sub={fromMode === 'gym' ? "Personalized workout recommendations" : "Personalized nutrition recommendations"}
      value={notificationPrefs.quotes} 
      onToggle={(val: boolean) => handleTogglePref('quotes', val)} 
    />
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
          <Text style={[styles.title, { color: theme.text }]}>Reminders</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Manage your reminder preferences</Text>
        </View>

        <View style={styles.listContainer}>
          {fromMode === 'gym' ? (
            <>
              {renderWorkoutSection()}
              {renderGoalsSection()}
              {renderSleepSection()}
              {renderReportsSection()}
              {renderQuotesSection()}
            </>
          ) : (
            <>
              {renderMealSection()}
              {renderWaterSection()}
              {renderMedicineSection()}
              {renderSleepSection()}
              {renderGoalsSection()}
              {renderQuotesSection()}
              {renderReportsSection()}
            </>
          )}
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
  optionContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  optionTextContainer: { flex: 1 },
  optionSubtitle: { fontSize: 14, marginTop: 4 },
  addButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#00C853', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { color: '#FFF', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#00C853', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
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