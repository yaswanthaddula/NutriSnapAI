export const SCANNER_GEMINI_API_KEY = process.env.EXPO_PUBLIC_SCANNER_GEMINI_API_KEY || '';
export const SCANNER_GEMINI_API_KEY_ALT = process.env.EXPO_PUBLIC_SCANNER_GEMINI_API_KEY_ALT || ''; // Secondary key for rotation
export const CHAT_GEMINI_API_KEY = process.env.EXPO_PUBLIC_CHAT_GEMINI_API_KEY || '';
export const OPENAI_CHAT_API_KEY = process.env.EXPO_PUBLIC_OPENAI_CHAT_API_KEY || '';

export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const OPENAI_MODEL = 'gpt-4o-mini';

// Backend URL - Using your specific local IP
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.89.146.146:8000';
