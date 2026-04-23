import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server' });
  }

  const requestId = Math.random().toString(36).slice(2, 8);
  const startedAt = Date.now();
  console.log(`\n[image ${requestId}] → OpenAI (${prompt.length} chars)`);
  console.log(`[image ${requestId}] prompt:\n${prompt}\n`);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    const data = await response.json();
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    if (response.ok && data?.data?.[0]?.url) {
      console.log(`[image ${requestId}] ← ok in ${elapsed}s`);
      if (data.data[0].revised_prompt) {
        console.log(`[image ${requestId}] DALL-E revised prompt:\n${data.data[0].revised_prompt}\n`);
      }
      return res.json({ url: data.data[0].url });
    }
    console.error(`[image ${requestId}] ← FAILED in ${elapsed}s (HTTP ${response.status}):`, data);
    return res.status(response.status || 500).json({
      error: data?.error?.message || 'Image generation failed',
    });
  } catch (err) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.error(`[image ${requestId}] ← threw after ${elapsed}s:`, err);
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { systemPrompt, messages, temperature, maxTokens } = req.body || {};
  if (!systemPrompt || typeof systemPrompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid systemPrompt' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or empty messages array' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server' });
  }

  const requestId = Math.random().toString(36).slice(2, 8);
  const startedAt = Date.now();
  const label = req.body?.label || 'chat';
  console.log(`\n[${label} ${requestId}] → OpenAI (${messages.length} turns)`);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: typeof temperature === 'number' ? temperature : 0.8,
        max_tokens: typeof maxTokens === 'number' ? maxTokens : 400,
      }),
    });

    const data = await response.json();
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

    const content = data?.choices?.[0]?.message?.content;
    if (response.ok && content) {
      console.log(`[${label} ${requestId}] ← ok in ${elapsed}s (${content.length} chars)`);
      return res.json({ content });
    }
    console.error(`[${label} ${requestId}] ← FAILED in ${elapsed}s (HTTP ${response.status}):`, data);
    return res.status(response.status || 500).json({
      error: data?.error?.message || 'Chat completion failed',
    });
  } catch (err) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.error(`[${label} ${requestId}] ← threw after ${elapsed}s:`, err);
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mad Libs server listening on http://localhost:${PORT}`);
});


