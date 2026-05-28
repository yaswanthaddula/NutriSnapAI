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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from './_layout'; 

export default function PrivacyPolicy() {
  const { isDark } = useTheme();

  const theme = {
    background: isDark ? '#121212' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#011627',
    subText: isDark ? '#AAAAAA' : '#7D8592',
    banner: isDark ? '#1B2E1D' : '#F1FBF2',
    bannerBorder: isDark ? '#2E4D31' : '#DFF6E3',
  };

  const BulletPoint = ({ text }: { text: string }) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: theme.text }]}>•</Text>
      <Text style={[styles.bulletText, { color: theme.subText }]}>{text}</Text>
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
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, { color: theme.subText }]}>Last updated: April 23, 2026</Text>

        {/* 1. Information We Collect */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>
            We collect the following information to provide you with personalized nutrition and fitness guidance:
          </Text>
          <BulletPoint text="Personal details (name, age, gender)" />
          <BulletPoint text="Body metrics (height, weight, activity level)" />
          <BulletPoint text="Food photos and meal data" />
          <BulletPoint text="Workout and progress tracking data" />
          <BulletPoint text="Device and usage information" />
        </View>

        {/* 2. How We Use Your Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. How We Use Your Data</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>Your data is used to:</Text>
          <BulletPoint text="Calculate personalized nutrition targets" />
          <BulletPoint text="Provide AI-powered food recognition" />
          <BulletPoint text="Track your fitness and health progress" />
          <BulletPoint text="Generate workout recommendations" />
          <BulletPoint text="Improve our AI algorithms" />
        </View>

        {/* 3. Data Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Data Security</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>
            We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest. We never sell your personal data to third parties.
          </Text>
        </View>

        {/* 4. Your Rights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Your Rights</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>You have the right to:</Text>
          <BulletPoint text="Access your personal data" />
          <BulletPoint text="Request data correction or deletion" />
          <BulletPoint text="Opt-out of data collection" />
          <BulletPoint text="Export your data" />
          <BulletPoint text="Withdraw consent at any time" />
        </View>

        {/* 5. Third-Party Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Third-Party Services</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>
            We use trusted third-party services for analytics and cloud storage. These partners are bound by strict data protection agreements and cannot use your data for their own purposes.
          </Text>
        </View>

        {/* 6. Children's Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Children's Privacy</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>
            NutriSnap AI is not intended for users under 13 years of age. We do not knowingly collect data from children.
          </Text>
        </View>

        {/* 7. Contact Us */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Contact Us</Text>
          <Text style={[styles.sectionDesc, { color: theme.subText }]}>
            For privacy related questions or to exercise your rights, contact us at:
          </Text>
          <Text style={styles.linkText}>privacy@nutrisnap.ai</Text>
        </View>

        {/* Green Privacy Banner */}
        <View style={[styles.banner, { backgroundColor: theme.banner, borderColor: theme.bannerBorder }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color="#00C853" />
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>Your Privacy Matters</Text>
            <Text style={[styles.bannerSub, { color: theme.subText }]}>
              We're committed to protecting your personal information and being transparent about how we use it.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 25, paddingBottom: 50 },
  backBtn: { marginBottom: 20, marginLeft: -10 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  lastUpdated: { fontSize: 14, marginBottom: 30 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  sectionDesc: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', marginBottom: 6, paddingLeft: 5 },
  bullet: { fontSize: 18, marginRight: 10, lineHeight: 22 },
  bulletText: { fontSize: 15, lineHeight: 22, flex: 1 },
  linkText: { color: '#00C853', fontSize: 15, fontWeight: '600', marginTop: 5 },
  banner: { 
    flexDirection: 'row', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginTop: 20,
    alignItems: 'flex-start'
  },
  bannerContent: { marginLeft: 15, flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  bannerSub: { fontSize: 13, lineHeight: 18 }
});