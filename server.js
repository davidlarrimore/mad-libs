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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mad Libs server listening on http://localhost:${PORT}`);
});


