import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Alert,
  Animated
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { isScannerReady, setTempCapturedImageWeb } from '../../src/services/scannerGeminiService';

export default function TabCameraScreen() {
  const params = useLocalSearchParams(); // Catch the 'fromMode' from Health Home
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cameraRef = useRef<any>(null);
  
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 260,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [scanAnim]);

  useEffect(() => {
    let timer: any;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!permission || !permission.granted) {
        try {
          await requestPermission();
        } catch (error) {
          console.error("Error requesting camera permissions:", error);
        }
      }
    };
    checkPermissions();
  }, []);

  if (!permission) return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={60} color="#666" />
        <Text style={styles.permissionText}>Camera access is required to scan your meals.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={() => requestPermission()}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Action: Capture Photo
  const handleCapture = async () => {
    if (!isScannerReady()) {
      Alert.alert('Scanner Cooldown', 'Please wait a few seconds before scanning again.');
      return;
    }

    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5, // Requirement: 0.5
          base64: false,
        });

        if (!photo || !photo.uri) {
          throw new Error('Camera captured an invalid photo object');
        }

        console.log("Photo Captured");
        console.log("Image URI Generated");

        setCooldownTime(4); // Start 4s countdown

        let finalUri = photo.uri;
        if (Platform.OS === 'web') {
          setTempCapturedImageWeb(photo.uri);
          finalUri = 'captured-web';
        }

        // Pass the photo URI to analysis screen
        router.push({
          pathname: '/food-analysis',
          params: { 
            imageUri: finalUri,
            fromMode: params.fromMode || 'health'
          }
        });
      } catch (error) {
        Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
      }
    } else {
      Alert.alert('Camera Not Ready', 'Please wait for the camera to initialize.');
    }
  };

  const handleGallery = async () => {
    if (!isScannerReady()) {
      Alert.alert('Scanner Cooldown', 'Please wait a few seconds before scanning again.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Requirement: 0.5
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCooldownTime(4); // Start 4s countdown
        router.push({
          pathname: '/food-analysis',
          params: { 
            imageUri: result.assets[0].uri,
            fromMode: params.fromMode || 'health'
          }
        });
      }
    } catch (error) {
      Alert.alert('Gallery Error', 'Failed to open gallery');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="back" 
        enableTorch={torch}
        ref={cameraRef}
        onCameraReady={() => {
          setIsCameraReady(true);
          console.log("Camera Opened");
        }}
      >
        <SafeAreaView style={styles.overlay}>
          
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconBtn}>
              <Ionicons 
                name={torch ? "flashlight" : "flashlight-outline"} 
                size={26} 
                color={torch ? "#FFD700" : "white"} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.viewportContainer}>
            <View style={styles.scannerFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
              <Animated.View style={[styles.laser, { transform: [{ translateY: scanAnim }] }]} />
              <Text style={styles.scannerText}>Point camera at food</Text>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={[styles.sideBtn, cooldownTime > 0 && { opacity: 0.5 }]} 
              onPress={handleGallery}
              disabled={cooldownTime > 0}
            >
              <Ionicons name="images-outline" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.captureBtnOuter, cooldownTime > 0 && { borderColor: '#777' }]} 
              onPress={handleCapture}
              disabled={cooldownTime > 0}
            >
              <View style={[styles.captureBtnInner, cooldownTime > 0 && { backgroundColor: '#777' }]}>
                {cooldownTime > 0 && (
                  <Text style={{ fontWeight: 'bold', color: 'white' }}>{cooldownTime}s</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideBtn} onPress={() => setTorch(false)}>
              <Ionicons name="refresh-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 25, 
    paddingTop: Platform.OS === 'android' ? 50 : 10 
  },
  iconBtn: { 
    width: 45, 
    height: 45, 
    borderRadius: 22, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  viewportContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { 
    width: 260, 
    height: 260, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  scannerText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '500', 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },

  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#00E676', borderTopLeftRadius: 20, shadowColor: '#00E676', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width:0, height:0 } },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#00E676', borderTopRightRadius: 20, shadowColor: '#00E676', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width:0, height:0 } },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#00E676', borderBottomLeftRadius: 20, shadowColor: '#00E676', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width:0, height:0 } },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#00E676', borderBottomRightRadius: 20, shadowColor: '#00E676', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width:0, height:0 } },
  laser: { position: 'absolute', top: 0, left: 20, right: 20, height: 2, backgroundColor: '#00E676', shadowColor: '#00E676', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width:0, height:0 } },

  bottomBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-evenly', 
    alignItems: 'center', 
    paddingBottom: 60 
  },
  captureBtnOuter: { 
    width: 84, 
    height: 84, 
    borderRadius: 42, 
    borderWidth: 4, 
    borderColor: '#00E676', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOpacity: 0.6,
    shadowRadius: 15
  },
  captureBtnInner: { 
    width: 66, 
    height: 66, 
    borderRadius: 33, 
    backgroundColor: 'white' 
  },
  sideBtn: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(0,200,83,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,200,83,0.5)'
  },

  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#FFF' },
  permissionText: { textAlign: 'center', fontSize: 16, color: '#333', marginBottom: 25, lineHeight: 24 },
  permissionBtn: { backgroundColor: '#00C853', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});