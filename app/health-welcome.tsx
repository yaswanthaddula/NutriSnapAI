import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Animated, 
  Platform 
} from 'react-native';
import { Platform as RNPlatform } from 'react-native';
const LottieView = RNPlatform.OS !== 'web' ? require('lottie-react-native').default : null;
import { router, useLocalSearchParams } from 'expo-router';

export default function HealthWelcomeScreen() {
  const params = useLocalSearchParams();
  const userName = (params.name as string) || 'User';
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Start the fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Navigation timer (3.5 seconds)
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(health-tabs)/health-home',
        params: { name: userName }
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* LOTTIE ANIMATION CONTAINER */}
        <View style={styles.lottieWrapper}>
          {LottieView ? (
            <LottieView
              autoPlay
              loop
              style={styles.lottie}
              source={require('../assets/animations/health-mode-welcome.json')}
              onAnimationFailure={(error: any) => console.log('Lottie Error: ', error)}
            />
          ) : (
            <Text style={{ fontSize: 100 }}>🥗</Text>
          )}
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.topLabel}>WELCOME TO</Text>
          <Text style={styles.mainTitle}>Health Mode</Text>
          
          <View style={styles.greenLine} />
          
          <Text style={styles.greeting}>
            Ready to track your health, <Text style={styles.nameHighlight}>{userName}</Text>?
          </Text>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    width: '100%', 
    alignItems: 'center' 
  },
  lottieWrapper: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textGroup: {
    alignItems: 'center',
  },
  topLabel: { 
    fontSize: 14, 
    color: '#7D8592', 
    letterSpacing: 4, 
    fontWeight: '600' 
  },
  mainTitle: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#011627', 
    marginTop: 10 
  },
  greenLine: {
    width: 40,
    height: 4,
    backgroundColor: '#00C853',
    borderRadius: 2,
    marginVertical: 20
  },
  greeting: {
    fontSize: 18,
    color: '#444',
  },
  nameHighlight: {
    color: '#00C853',
    fontWeight: 'bold'
  }
});