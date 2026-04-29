import { Router } from 'express';
import { getDb } from '../db/connection';
import { parseQuery } from '../services/parser';
import { searchCreatures } from '../services/searcher';
import { rankResults } from '../services/ranker';
import { buildResponse } from '../services/responder';
import { Creature } from '../types';

export const queryRouter = Router();

queryRouter.post('/query', (req, res) => {
  const { text } = req.body as { text: string };
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text field is required' });
    return;
  }

  const db = getDb();

  // 1. Parse
  const signals = parseQuery(text);

  // 2. Search
  const searchMatches = searchCreatures(db, signals, text);

  // 3. Rank
  const ranked = rankResults(searchMatches);

  // 4. Build response
  const matchCreatures = ranked.map(r =>
    db.prepare('SELECT * FROM creatures WHERE id = ?').get(r.creature_id)
  ).filter(Boolean) as Creature[];

  const topMatch = matchCreatures[0] || null;
  const confidence = ranked[0]?.confidence || 'low';
  const intent = signals.intent;

  const { answer } = buildResponse(topMatch, matchCreatures, intent, confidence);

  // 5. Log query
  db.prepare('INSERT INTO query_log (raw_text, parsed_json, result_ids) VALUES (?, ?, ?)').run(
    text,
    JSON.stringify(signals),
    ranked.map(r => r.creature_id).join(','),
  );

  // 6. Return
  res.json({
    answer,
    matches: ranked.map(r => ({
      creature: matchCreatures.find(c => c.id === r.creature_id),
      score: r.score,
      confidence: r.confidence,
      reasons: r.reasons,
    })),
    intent,
  });
});
