import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/connection';
import { seedCreatures } from './db/seed';
import { queryRouter } from './routes/query';
import { ttsRouter } from './routes/tts';
import { creaturesRouter } from './routes/creatures';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
const db = initDb();
seedCreatures(db);

// Routes
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    creatureCount: db.prepare('SELECT COUNT(*) as count FROM creatures').get(),
    ttsConfigured: !!process.env.ELEVENLABS_API_KEY,
  });
});

app.use('/api', queryRouter);
app.use('/api', ttsRouter);
app.use('/api', creaturesRouter);

app.listen(PORT, () => {
  console.log(`Skull awaits at http://localhost:${PORT}`);
});
