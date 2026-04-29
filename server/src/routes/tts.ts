import { Router } from 'express';
import { generateSpeech } from '../services/tts';

export const ttsRouter = Router();

ttsRouter.post('/tts', async (req, res) => {
  const { text } = req.body as { text: string };

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text field is required' });
    return;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(501).json({ error: 'ElevenLabs not configured. Set ELEVENLABS_API_KEY in .env' });
    return;
  }

  try {
    const audio = await generateSpeech(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    res.send(audio);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});
