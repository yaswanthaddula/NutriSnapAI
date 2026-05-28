import { CHAT_GEMINI_API_KEY, GEMINI_API_URL } from '../config/apiConfig';

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
 * Log this to console to check available model names.
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
  console.log("Chat Service Started. Key present:", !!CHAT_GEMINI_API_KEY);
  if (!CHAT_GEMINI_API_KEY || CHAT_GEMINI_API_KEY.length < 10) {
    throw new Error('Gemini API key not configured correctly in apiConfig.js');
  }

  // Format history for Gemini, ensuring alternating roles (user/model)
  const contents = [
    {
      role: 'user',
      parts: [{ text: CHAT_PROMPT }]
    }
  ];

  contents.push({
    role: 'model',
    parts: [{ text: "Understood. I am ready to help as your NutriSnap AI Fitness Assistant." }]
  });

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

  const callApi = async (url) => {
    let retries = 1;
    while (retries >= 0) {
      const response = await fetch(
        `${url}?key=${CHAT_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
        continue;
      }
      return { response, data };
    }
  };

  try {
    let modelName = 'gemini-2.0-flash';
    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    
    console.log("Chat model:", modelName);
    console.log("Chat endpoint:", endpoint);

    let { response, data } = await callApi(endpoint);
    console.log("Gemini status:", response.status);
    console.log("Gemini raw body:", JSON.stringify(data));

    // Fallback if primary fails
    if (!response.ok) {
      const fallbackModel = 'gemini-2.5-flash';
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent`;
      console.warn("Primary model failed, trying fallback:", fallbackModel);
      
      const fallbackResult = await callApi(fallbackEndpoint);
      response = fallbackResult.response;
      data = fallbackResult.data;
      
      console.log("Chat model (Fallback):", fallbackModel);
      console.log("Chat endpoint (Fallback):", fallbackEndpoint);
      console.log("Gemini status (Fallback):", response.status);
      console.log("Gemini raw body (Fallback):", JSON.stringify(data));
    }

    if (!response.ok) {
      if (response.status === 401) throw new Error("Invalid API key.");
      if (response.status === 429) throw new Error("Quota exceeded.");
      if (response.status === 404) throw new Error("Model not found.");
      if (response.status === 400) throw new Error("Invalid request format.");
      
      throw new Error(data?.error?.message || "AI assistant model unavailable. Please try later.");
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI assistant model unavailable. Please try later.";
  } catch (error) {
    console.error('Final Chat Service Error:', error.message);
    throw error;
  }
};
