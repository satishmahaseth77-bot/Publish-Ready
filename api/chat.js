import { cleanApiKey } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const apiKey = cleanApiKey(process.env.GROQ_API_KEY);
    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY not configured' });
      return;
    }

    const systemPrompt = `You are ASTRA — a brilliant, warm, and highly knowledgeable AI science tutor and assistant for Axyomis-X.

RULES:
1. Answer EVERY question clearly and helpfully — greetings, casual chat, science, math, history, anything.
2. For casual greetings ("hi", "hello", "how are you") — reply naturally and warmly, keep it short.
3. For science/educational topics — give detailed, structured answers using markdown: headers, bullet points, bold text.
4. For math — use clear notation and step-by-step working.
5. You can describe diagrams using ASCII art or structured text.
6. If asked who you are — say you are ASTRA, the AI inside Axyomis-X, created to help students learn.
7. ALWAYS respond in the same language the user writes in.
8. Keep voice-friendly responses concise (under 200 words when voice is on).
9. NEVER say you cannot answer — always try your best.`;

    const clientSystem = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const groqMessages = [
      { role: 'system', content: clientSystem?.content || systemPrompt },
      ...chatMessages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq API error:', groqRes.status);
      res.status(groqRes.status).json({ error: 'AI chat service unavailable. Check GROQ_API_KEY in Vercel settings.' });
      return;
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ engine: 'groq', reply });
  } catch (error) {
    console.error('Chat proxy error:', error.message);
    res.status(500).json({ error: error?.message ?? 'Internal server error' });
  }
}
