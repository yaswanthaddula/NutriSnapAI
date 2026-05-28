import { OPENAI_CHAT_API_KEY, OPENAI_MODEL } from '../config/apiConfig';

/**
 * Chat with OpenAI GPT model for gym/fitness assistance.
 */
export const chatWithAi = async (userMessage, history = []) => {
  if (!OPENAI_CHAT_API_KEY) {
    throw new Error('OpenAI API key not configured.');
  }

  const systemPrompt = {
    role: 'system',
    content: `You are the NutriSnap AI Fitness Assistant. 
    Your goal is to provide expert advice on:
    - workout questions
    - protein questions
    - calorie guidance
    - recovery tips
    - beginner gym help
    Keep your answers helpful, motivating, and concise.`
  };

  const messages = [systemPrompt];

  // Add history
  history.forEach(msg => {
    messages.push({
      role: msg.isAi ? 'assistant' : 'user',
      content: msg.text
    });
  });

  // Add current message
  messages.push({
    role: 'user',
    content: userMessage
  });

  const body = {
    model: OPENAI_MODEL,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1024
  };

  try {
    console.log('--- OpenAI Request ---');
    console.log('Model:', OPENAI_MODEL);
    console.log('Message Count:', messages.length);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // Increased to 12s

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_CHAT_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data?.error);
      
      if (response.status === 429) {
        throw new Error('OpenAI Quota Exceeded (429). Please check your billing.');
      } else if (response.status === 401) {
        throw new Error('Invalid OpenAI API Key (401).');
      } else if (response.status === 404) {
        throw new Error(`Model ${OPENAI_MODEL} not found or not accessible with this key.`);
      }
      
      throw new Error(data?.error?.message || 'OpenAI API error occurred.');
    }

    console.log('OpenAI Response Success');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Chat Service Exception:', error);
    if (error.name === 'AbortError') {
      throw new Error('AI assistant took too long to respond. Try again.');
    }
    throw new Error(error.message || 'Connection to AI assistant failed.');
  }
};
