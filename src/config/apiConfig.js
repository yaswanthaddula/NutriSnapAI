export const SCANNER_GEMINI_API_KEY = process.env.EXPO_PUBLIC_SCANNER_GEMINI_API_KEY || '';
export const SCANNER_GEMINI_API_KEY_ALT = process.env.EXPO_PUBLIC_SCANNER_GEMINI_API_KEY_ALT || '';
export const CHAT_GEMINI_API_KEY = process.env.EXPO_PUBLIC_CHAT_GEMINI_API_KEY || '';
export const OPENAI_CHAT_API_KEY = process.env.EXPO_PUBLIC_OPENAI_CHAT_API_KEY || '';

export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const OPENAI_MODEL = 'gpt-4o-mini';

// Cloud backend — always used for both Vercel web and Expo Go mobile
const CLOUD_API_URL = 'https://nutrisnapai.onrender.com';

const getBaseUrl = () => {
  // Explicit override via environment variable (highest priority)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Always use cloud backend — ensures both web and mobile use Neon PostgreSQL
  return CLOUD_API_URL;
};

// Backend API base URL
export const API_BASE_URL = getBaseUrl();
