import { CHAT_GEMINI_API_KEY, SCANNER_GEMINI_API_KEY, SCANNER_GEMINI_API_KEY_ALT } from '../config/apiConfig';

const CHAT_PROMPT = `You are the NutriSnap AI Fitness Assistant. 
Your goal is to provide expert advice on:
- Gym workouts and exercise form
- Protein and calorie intake for fitness goals
- Recovery tips and muscle growth
- Beginner gym guidance
Keep your answers helpful, motivating, and concise. 
Do NOT return JSON. Answer in plain text only.`;

/**
 * Debug function to list all models available for the current API key.
 */
export const listModels = async () => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${CHAT_GEMINI_API_KEY}`
    );
    const data = await response.json();
    console.log('--- AVAILABLE GEMINI MODELS ---');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Failed to list models:', error);
  }
};

export const chatWithAi = async (userMessage, history = []) => {
  console.log("Chat Service Started.");

  // Rotate through all available keys to handle quota exhaustion dynamically
  const keysToTry = [
    CHAT_GEMINI_API_KEY,
    SCANNER_GEMINI_API_KEY_ALT,
    SCANNER_GEMINI_API_KEY
  ].filter(k => k && k.length > 10);

  // Get unique keys
  const uniqueKeys = [...new Set(keysToTry)];

  if (uniqueKeys.length === 0) {
    throw new Error('Gemini API key not configured correctly in apiConfig.js');
  }

  // Format history for Gemini, ensuring alternating roles (user/model)
  const contents = [
    {
      role: 'user',
      parts: [{ text: CHAT_PROMPT }]
    },
    {
      role: 'model',
      parts: [{ text: "Understood. I am ready to help as your NutriSnap AI Fitness Assistant." }]
    }
  ];

  history.forEach(msg => {
    const role = msg.isAi ? 'model' : 'user';
    const lastRole = contents[contents.length - 1].role;
    if (role !== lastRole) {
      contents.push({
        role: role,
        parts: [{ text: msg.text }]
      });
    } else {
      contents[contents.length - 1].parts[0].text += "\n" + msg.text;
    }
  });

  const lastRole = contents[contents.length - 1].role;
  if (lastRole === 'user') {
    contents[contents.length - 1].parts[0].text += "\n" + userMessage;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });
  }

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  let lastError = null;

  for (const apiKey of uniqueKeys) {
    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        console.log(`Chat: Trying ${modelName} with key starting ${apiKey.substring(0, 5)}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();

        if (response.ok) {
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return reply;
          }
        } else {
          console.warn(`Chat: ${modelName} failed with status ${response.status}`);
          lastError = data?.error?.message || `Status ${response.status}`;
        }
      } catch (err) {
        console.error(`Chat error: ${err.message}`);
        lastError = err.message;
      }
    }
  }

  throw new Error(lastError || "AI assistant model unavailable. Please try later.");
};
