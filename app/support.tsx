import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Linking,
  Platform,
  LayoutAnimation,
  UIManager,
  Alert // <-- FIXED: Added this to prevent the "Not Open" error
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// FIXED: Path for app folder (one dot)
import { useTheme } from './_layout'; 

// Enable Animation for Android (Redmi)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportScreen() {
  const { isDark } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    faqBg: isDark ? '#1E1E1E' : '#FFFFFF',
    faqBorder: isDark ? '#333333' : '#E0E0E0',
  };

  const faqs = [
    {
      q: "How do I scan food?",
      a: "Tap the camera icon in the center of the bottom navigation. Point your camera at the food and tap the capture button."
    },
    {
      q: "Can I switch between Health and Gym modes?",
      a: "No, it is not possible to switch directly from the main dashboard. You can only see your 'Selected Mode' in the Profile section and switch it through the 'Switch Mode' settings there."
    },
    {
      q: "How accurate is the calorie tracking?",
      a: "Our AI uses advanced image recognition with 95%+ accuracy for common foods. You can always adjust portions manually."
    },
    {
      q: "How do I change my workout plan?",
      a: "Go to Weekly Plans and tap on any workout day to see exercises. You can replace individual workouts using the Replace button."
    },
    {
      q: "What if the food detection is wrong?",
      a: "Tap \"No, Wrong Detection\" on the food detected screen. You can then select the main ingredient and choose the correct dish."
    }
  ];

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: theme.text }]}>Help & Support</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Get answers to common questions</Text>
        </View>

        {/* AI Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lifebuoy" size={28} color="#00C853" />
            </View>
            <View style={styles.aiText}>
              <Text style={styles.aiTitle}>Need instant help?</Text>
              <Text style={styles.aiSub}>Chat with our AI Assistant</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.aiBtn} 
            onPress={() => Alert.alert("AI Chat", "Coming Soon!")}
          >
            <Text style={styles.aiBtnText}>Open AI Assistant</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={[styles.faqSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.faqHeaderTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqWrapper}>
              <TouchableOpacity 
                style={[styles.faqItem, { backgroundColor: theme.faqBg, borderColor: theme.faqBorder }]}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqText, { color: theme.text }]}>{faq.q}</Text>
                <Ionicons 
                  name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#7D8592" 
                />
              </TouchableOpacity>
              
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
                  <Text style={[styles.answerText, { color: theme.subText }]}>{faq.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={[styles.contactCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>Contact Us</Text>
          <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:support@nutrisnap.ai')}>
            <Ionicons name="mail" size={20} color="#00C853" />
            <Text style={[styles.contactText, { color: theme.text }]}>support@nutrisnap.ai</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+1234567890')}>
            <Ionicons name="call" size={20} color="#00C853" />
            <Text style={[styles.contactText, { color: theme.text }]}>+1 (234) 567-890</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  backBtn: { marginBottom: 20, marginLeft: -10 },
  headerArea: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  aiCard: { backgroundColor: '#00C853', borderRadius: 25, padding: 20, marginBottom: 25 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  aiText: { marginLeft: 15 },
  aiTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  aiSub: { color: '#FFF', opacity: 0.9, fontSize: 14 },
  aiBtn: { backgroundColor: '#FFF', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  aiBtnText: { color: '#00C853', fontWeight: 'bold', fontSize: 16 },
  faqSection: { borderRadius: 25, padding: 15, marginBottom: 25 },
  faqHeaderTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  faqWrapper: { marginBottom: 15 },
  faqItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 15, borderWidth: 1 },
  faqText: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 10 },
  answerContainer: { paddingHorizontal: 15, paddingTop: 15 },
  answerText: { fontSize: 14, lineHeight: 22 },
  contactCard: { borderRadius: 25, padding: 25, marginBottom: 40 },
  contactTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  contactText: { marginLeft: 15, fontSize: 16, fontWeight: '500' }
});