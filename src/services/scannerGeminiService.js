import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { SCANNER_GEMINI_API_KEY, SCANNER_GEMINI_API_KEY_ALT } from '../config/apiConfig';

let isScanning = false;
let cooldownActive = false;

// Web-only captured image cache to prevent routing crash with large base64 strings
let tempCapturedImageWeb = null;

export const setTempCapturedImageWeb = (uri) => {
  tempCapturedImageWeb = uri;
};

export const getTempCapturedImageWeb = () => {
  return tempCapturedImageWeb;
};

export const clearTempCapturedImageWeb = () => {
  tempCapturedImageWeb = null;
};

const SCANNER_PROMPT = `Analyze this food image and identify the primary food item.
Return ONLY valid JSON in this exact format:
{
  "food_name": "name of the food",
  "confidence": 95,
  "unit_type": "count" or "grams" or "ml"
}
Choose "count" for discrete items (eggs, apples, slices), "grams" for solid/loose food (rice, chicken breast, pasta), and "ml" for liquids (milk, soup, juice).
Do NOT include any other text or markdown formatting.`;

/**
 * Converts an image URI to base64.
 * On web: uses fetch + FileReader (expo-image-manipulator doesn't work in browsers).
 * On native: uses expo-image-manipulator to resize + compress before encoding.
 */
const getBase64FromUri = async (imageUri) => {
  if (Platform.OS === 'web') {
    if (imageUri.startsWith('data:')) {
      console.log("Blob Created");
      return imageUri.split(',')[1];
    }
    // Browser: fetch the blob and convert to base64 via FileReader
    console.log("Blob Created: fetching image blob for conversion");
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // result is "data:image/jpeg;base64,XXXX" — strip the prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // Native: resize + compress with expo-image-manipulator
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 512 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manipulatedImage.base64;
  }
};

/**
 * Detects food name, confidence, and unit type from an image.
 */
export const analyzeImage = async (imageUri) => {
  if (isScanning || cooldownActive) {
    throw new Error('AI scanner temporarily unavailable. Please wait.');
  }

  isScanning = true;

  // Resolve cached web camera image
  let resolvedUri = imageUri;
  if (Platform.OS === 'web' && imageUri === 'captured-web') {
    resolvedUri = getTempCapturedImageWeb() || '';
  }

  const callApi = async (modelName, base64Image, apiKey) => {
    const body = {
      contents: [{
        parts: [
          { text: SCANNER_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
        ],
      }],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      console.log("AI Request Started");
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      return { response, data };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    // Get base64 image — works on both web and native
    const base64Image = await getBase64FromUri(resolvedUri);

    if (!base64Image) {
      throw new Error('Could not read image. Please try a different photo.');
    }

    const keysToTry = [SCANNER_GEMINI_API_KEY, SCANNER_GEMINI_API_KEY_ALT];
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

    let lastError = null;

    for (const apiKey of keysToTry) {
      if (!apiKey) continue;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Scanner: Trying ${modelName} with key starting ${apiKey.substring(0, 5)}...`);
          const { response, data } = await callApi(modelName, base64Image, apiKey);

          if (response.ok) {
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResult) {
              let cleanedText = textResult.trim();
              const firstBrace = cleanedText.indexOf('{');
              const lastBrace = cleanedText.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1) {
                cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
              }
              const parsed = JSON.parse(cleanedText);
              if (parsed.food_name) {
                console.log("AI Response Received");
                startCooldown();
                isScanning = false;
                return {
                  food_name: parsed.food_name,
                  confidence: parsed.confidence || 0,
                  unit_type: parsed.unit_type || 'grams'
                };
              }
            }
          } else {
            console.warn(`Scanner: ${modelName} failed (Status ${response.status})`);
            lastError = data?.error?.message || `Status ${response.status}`;
            if (response.status !== 429) {
              console.log('Scanner: Non-quota error, continuing rotation...');
            }
          }
        } catch (err) {
          console.error(`Scanner: Request failed: ${err.message}`);
          lastError = err.message;
        }
      }
    }

    throw new Error(lastError || 'AI Scanner is currently busy. Please try again or search manually.');

  } catch (error) {
    console.error('Scanner Final Error:', error.message);
    throw error;
  } finally {
    isScanning = false;
  }
};

const startCooldown = async () => {
  cooldownActive = true;
  await new Promise(resolve => setTimeout(resolve, 4000));
  cooldownActive = false;
};

/**
 * Helper to check if scanner is ready
 */
export const isScannerReady = () => !isScanning && !cooldownActive;
