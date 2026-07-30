import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Welcome to NutriSnap AI',
    subtitle: 'Your personal AI-powered nutrition and fitness companion.',
    image: require('../assets/onboarding/scanner.png'),
    features: [
      { icon: 'scan-outline', text: 'AI Food Scanner' },
      { icon: 'nutrition-outline', text: 'Nutrition Tracking' },
      { icon: 'analytics-outline', text: 'Smart Health Analysis' }
    ]
  },
  {
    id: '2',
    title: 'Track Every Meal',
    subtitle: 'Scan food instantly and automatically calculate calories, protein, carbs, fats, and other nutrition values.',
    image: require('../assets/onboarding/tracking.png'),
    features: [
      { icon: 'camera-outline', text: 'AI Scan' },
      { icon: 'flame-outline', text: 'Calories & Macros' },
      { icon: 'barbell-outline', text: 'Protein' },
      { icon: 'water-outline', text: 'Water Tracking' }
    ]
  },
  {
    id: '3',
    title: 'Achieve Your Fitness Goals',
    subtitle: 'Track workouts, monitor progress, receive reminders, and stay motivated every day.',
    image: require('../assets/onboarding/recommendations.png'),
    features: [
      { icon: 'fitness-outline', text: 'Workout & Exercise' },
      { icon: 'calendar-outline', text: 'Weekly Progress' },
      { icon: 'notifications-outline', text: 'Smart Reminders' },
      { icon: 'flag-outline', text: 'Goal Tracking' }
    ]
  },
  {
    id: '4',
    title: "Let's Build a Healthier You",
    subtitle: 'Start your AI-powered health journey today.',
    // Reusing tracking image for 4th screen as we only have 3 assets
    image: require('../assets/onboarding/tracking.png'),
    features: []
  }
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {}
    router.replace('/login'); // We can navigate to sign up flow if we wanted to
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {}
    router.replace('/login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item, index }: { item: typeof ONBOARDING_DATA[0], index: number }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.imageContainer, { height: height * 0.45 }]}>
          <View style={[styles.imageGlow, { width: Math.min(width * 0.7, 400), height: Math.min(width * 0.7, 400), borderRadius: Math.min(width * 0.7, 400) / 2 }]} />
          <Image source={item.image} style={[styles.image, { width: Math.min(width * 0.85, 450) }]} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          
          <View style={styles.featuresContainer}>
            {item.features.map((feat, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feat.icon as any} size={20} color="#00C853" />
                </View>
                <Text style={styles.featureText}>{feat.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderIndicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {ONBOARDING_DATA.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity }
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F4F9F4', '#E8F5E9', '#FFFFFF']} style={styles.gradientBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.miniLogo} resizeMode="contain" />
          <Text style={styles.logoText}>NutriSnap AI</Text>
        </View>
        {currentIndex !== ONBOARDING_DATA.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        {renderIndicator()}
        
        {currentIndex === ONBOARDING_DATA.length - 1 ? (
          <View style={styles.finalButtonsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              activeOpacity={0.9}
              onPress={handleFinish}
            >
              <LinearGradient colors={['#00E676', '#00C853']} style={styles.primaryGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFinish}>
              <Text style={styles.secondaryButtonText}>Already have an account? <Text style={{fontWeight: '800', color: '#00C853'}}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ height: 120 }} /> // Spacer to keep indicators aligned
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    height: 60,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 15,
    color: '#707070',
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  imageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGlow: {
    position: 'absolute',
    backgroundColor: '#00E676',
    opacity: 0.08,
  },
  image: {
    height: '100%',
  },
  textContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    marginBottom: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
    marginHorizontal: 5,
  },
  finalButtonsContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButton: {
    width: '100%',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginBottom: 20,
  },
  primaryGradient: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '500',
  }
});
