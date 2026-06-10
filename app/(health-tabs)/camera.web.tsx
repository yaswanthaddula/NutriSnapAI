import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { isScannerReady, setTempCapturedImageWeb } from '../../src/services/scannerGeminiService';

export default function TabCameraScreen() {
  const params = useLocalSearchParams();
  const [cooldownTime, setCooldownTime] = useState(0);

  // Web Camera States
  const [webStream, setWebStream] = useState<any>(null);
  const [webPermission, setWebPermission] = useState<boolean | null>(null);
  const [webFacing, setWebFacing] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<any>(null);

  useEffect(() => {
    let timer: any;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  // Web Camera Setup
  useEffect(() => {
    let activeStream: any = null;

    async function initWebCamera() {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser context (HTTPS required)");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: webFacing },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          }
        });
        activeStream = stream;
        setWebStream(stream);
        setWebPermission(true);
      } catch (err) {
        console.warn("Direct HD camera access failed, trying fallback...", err);
        try {
          if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API is not supported in this browser context (HTTPS required)");
          }
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
          });
          activeStream = fallbackStream;
          setWebStream(fallbackStream);
          setWebPermission(true);
        } catch (fallbackErr) {
          console.error("Camera access denied:", fallbackErr);
          setWebPermission(false);
        }
      }
    }

    initWebCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track: any) => track.stop());
      }
    };
  }, [webFacing]);

  // Sync web stream to video element
  useEffect(() => {
    if (videoRef.current && webStream) {
      if (videoRef.current.srcObject !== webStream) {
        videoRef.current.srcObject = webStream;
      }
    }
  }, [webStream]);

  const handleWebCapture = () => {
    if (!isScannerReady()) {
      Alert.alert('Scanner Cooldown', 'Please wait a few seconds before scanning again.');
      return;
    }

    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          setTempCapturedImageWeb(dataUrl);
          setCooldownTime(4); // Start 4s countdown

          router.push({
            pathname: '/food-analysis',
            params: { 
              imageUri: 'captured-web', 
              fromMode: params.fromMode || 'health' 
            }
          });
        }
      } catch (error) {
        console.error("Web capture error:", error);
        Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
      }
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

  if (webPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={60} color="#666" />
        <Text style={styles.permissionText}>Camera access is required to scan your meals. Please allow camera access in your browser settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <video
        ref={(el) => {
          videoRef.current = el;
          if (el && webStream && el.srcObject !== webStream) {
            el.srcObject = webStream;
          }
        }}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <View style={{ width: 45 }} />
        </View>

        <View style={styles.viewportContainer}>
          <View style={styles.scannerFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
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
            onPress={handleWebCapture}
            disabled={cooldownTime > 0}
          >
            <View style={[styles.captureBtnInner, cooldownTime > 0 && { backgroundColor: '#777' }]}>
              {cooldownTime > 0 && (
                <Text style={{ fontWeight: 'bold', color: 'white' }}>{cooldownTime}s</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sideBtn} 
            onPress={() => {
              setWebFacing(prev => prev === 'environment' ? 'user' : 'environment');
            }}
          >
            <Ionicons name="refresh-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 10 },
  iconBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  viewportContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 260, height: 260, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  scannerText: { color: 'white', fontSize: 16, fontWeight: '500', textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderColor: 'white', borderTopLeftRadius: 20 },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderColor: 'white', borderTopRightRadius: 20 },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: 'white', borderBottomLeftRadius: 20 },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'white', borderBottomRightRadius: 20 },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: 60 },
  captureBtnOuter: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  sideBtn: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#FFF' },
  permissionText: { textAlign: 'center', fontSize: 16, color: '#333', marginBottom: 25, lineHeight: 24 }
});
