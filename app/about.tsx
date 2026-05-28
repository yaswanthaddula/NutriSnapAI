import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 

export default function AboutScreen() {
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    card: isDark ? '#1E1E1E' : '#F9FAFB',
    tagBg: isDark ? '#2A2A2A' : '#FFFFFF',
    tagBorder: isDark ? '#444' : '#E0E0E0',
  };

  const FeatureItem = ({ title, desc }: { title: string, desc: string }) => (
    <View style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={22} color="#FFF" />
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );

  const TechTag = ({ name }: { name: string }) => (
    <View style={[styles.tag, { backgroundColor: theme.tagBg, borderColor: theme.tagBorder }]}>
      <Text style={[styles.tagText, { color: theme.text }]}>{name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>About NutriSnap AI</Text>
        <Text style={[styles.version, { color: theme.subText }]}>Version 1.0.0</Text>

        {/* App Icon & Branding */}
        <View style={styles.brandSection}>
          <View style={styles.iconBox}>
            <Ionicons name="camera" size={50} color="white" />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>NutriSnap AI</Text>
          <Text style={styles.slogan}>Snap Smart. Live Better.</Text>
          <Text style={[styles.appDesc, { color: theme.subText }]}>
            Your AI-powered companion for nutrition tracking, fitness planning, and achieving your health goals.
          </Text>
        </View>

        {/* Key Features Green Card */}
        <View style={styles.greenCard}>
          <Text style={styles.cardHeader}>Key Features</Text>
          <FeatureItem 
            title="AI Food Recognition" 
            desc="Instant nutrition tracking with 95%+ accuracy" 
          />
          <FeatureItem 
            title="Personalized Plans" 
            desc="Custom nutrition and workout recommendations" 
          />
          <FeatureItem 
            title="Dual Modes" 
            desc="Health Mode for wellness, Gym Mode for muscle building" 
          />
          <FeatureItem 
            title="24/7 AI Assistant" 
            desc="Get instant answers to your nutrition questions" 
          />
        </View>

        {/* Technologies Section */}
        <View style={[styles.techSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.techHeader, { color: theme.text }]}>Technologies</Text>
          <View style={styles.tagCloud}>
            <TechTag name="React Native" />
            <TechTag name="AI Vision" />
            <TechTag name="Machine Learning" />
            <TechTag name="Expo Router" />
            <TechTag name="TypeScript" />
            <TechTag name="Firebase" />
            <TechTag name="Node.js" />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerMain, { color: theme.subText }]}>
            Made with ❤️ for your health journey
          </Text>
          <Text style={[styles.footerCopyright, { color: theme.subText }]}>
            © 2026 NutriSnap AI. All rights reserved.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25 },
  backBtn: { marginBottom: 15, marginLeft: -10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  version: { fontSize: 14, marginBottom: 30 },
  
  brandSection: { alignItems: 'center', marginBottom: 35 },
  iconBox: { 
    width: 100, height: 100, borderRadius: 25, 
    backgroundColor: '#00C853', justifyContent: 'center', 
    alignItems: 'center', elevation: 8, shadowColor: '#00C853',
    shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
  },
  appName: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  slogan: { color: '#00C853', fontSize: 16, fontWeight: '600', marginTop: 5 },
  appDesc: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 15, paddingHorizontal: 20 },

  greenCard: { 
    backgroundColor: '#00C853', borderRadius: 25, padding: 22, 
    marginBottom: 25, elevation: 4 
  },
  cardHeader: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  featureText: { marginLeft: 12, flex: 1 },
  featureTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  featureDesc: { color: '#FFF', fontSize: 13, opacity: 0.9, marginTop: 2 },

  techSection: { borderRadius: 25, padding: 22, marginBottom: 40 },
  techHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { 
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, 
    borderWidth: 1, marginRight: 8, marginBottom: 10 
  },
  tagText: { fontSize: 13, fontWeight: '500' },

  footer: { alignItems: 'center', marginBottom: 30 },
  footerMain: { fontSize: 14, marginBottom: 5 },
  footerCopyright: { fontSize: 12, opacity: 0.7 }
});