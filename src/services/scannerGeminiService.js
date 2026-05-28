import * as ImageManipulator from 'expo-image-manipulator';
import { SCANNER_GEMINI_API_KEY, SCANNER_GEMINI_API_KEY_ALT } from '../config/apiConfig';

let isScanning = false;
let cooldownActive = false;

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
 * Detects food name, confidence, and unit type from an image.
 */
export const analyzeImage = async (imageUri) => {
  if (isScanning || cooldownActive) {
    throw new Error('AI scanner temporarily unavailable. Please wait.');
  }

  isScanning = true;
  
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 512 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    const base64Image = manipulatedImage.base64;
    
    const keysToTry = [SCANNER_GEMINI_API_KEY, SCANNER_GEMINI_API_KEY_ALT];
    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    
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
              console.log("Scanner: Non-quota error, continuing rotation...");
            }
          }
        } catch (err) {
          console.error(`Scanner: Request failed: ${err.message}`);
          lastError = err.message;
        }
      }
    }

    throw new Error(lastError || 'AI Scanner is currently busy. Please try again in a moment or search manually.');

  } catch (error) {
    console.error("Scanner Final Error:", error.message);
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
