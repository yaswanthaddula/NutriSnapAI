export const SCANNER_GEMINI_API_KEY = process.env.EXPO_PUBLIC_SCANNER_GEMINI_API_KEY || '';
export const SCANNER_GEMINI_API_KEY_ALT = process.env.EXPO_PUBLIC_SCANNER_GEMINI_API_KEY_ALT || ''; // Secondary key for rotation
export const CHAT_GEMINI_API_KEY = process.env.EXPO_PUBLIC_CHAT_GEMINI_API_KEY || '';
export const OPENAI_CHAT_API_KEY = process.env.EXPO_PUBLIC_OPENAI_CHAT_API_KEY || '';

export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const OPENAI_MODEL = 'gpt-4o-mini';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // Check if it's running on a public deployed domain (like Vercel)
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    hostname.startsWith('192.168.') || 
                    hostname.startsWith('10.') || 
                    hostname.startsWith('172.');
                    
    if (!isLocal) {
      return 'https://nutrisnapai.onrender.com';
    }
  }
  
  return 'http://10.89.146.146:8000';
};

// Backend URL
export const API_BASE_URL = getBaseUrl();
