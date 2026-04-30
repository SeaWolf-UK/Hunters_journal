import { Router } from 'express';
import { getDb } from '../db/connection';
import { parseQuery } from '../services/parser';
import { searchCreatures } from '../services/searcher';
import { rankResults } from '../services/ranker';
import { buildResponse } from '../services/responder';
import { aiRankAndRespond } from '../services/aiRanker';
import { aiQueryCache, hashQuery } from '../services/aiCache';
import { Creature } from '../types';

export const queryRouter = Router();

queryRouter.post('/query', async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text field is required' });
      return;
    }

    const db = getDb();
    const cacheKey = hashQuery(text.trim().toLowerCase());
    const cached = aiQueryCache.get<{ answer: string; matches: unknown[]; intent: string }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // 1. Parse
    const signals = parseQuery(text);

    // 2. Search (retrieve broad candidates)
    const searchMatches = searchCreatures(db, signals, text);

    // 3. Pre-rank to get top candidates for the LLM
    const preRanked = rankResults(searchMatches);

    // Fetch creature data for all candidates
    const allCandidateCreatures = preRanked.map(r =>
      db.prepare('SELECT * FROM creatures WHERE id = ?').get(r.creature_id)
    ).filter(Boolean) as Creature[];

    // 4. Try AI re-ranking + response generation
    let answer: string;
    let finalMatches = preRanked;
    let confidence = preRanked[0]?.confidence || 'low';

    if (allCandidateCreatures.length > 0) {
      const topCandidates = allCandidateCreatures.slice(0, 15);
      const aiResult = await aiRankAndRespond(text, topCandidates);

      if (aiResult) {
        // AI returned a valid result
        answer = aiResult.response;

        if (aiResult.bestMatchId !== null) {
          // Reorder matches so the AI's pick is first
          const aiPickIndex = preRanked.findIndex(r => r.creature_id === aiResult.bestMatchId);
          if (aiPickIndex >= 0) {
            const aiPick = preRanked[aiPickIndex];
            const others = preRanked.filter((_, i) => i !== aiPickIndex);
            finalMatches = [
              { ...aiPick, confidence: aiResult.confidence },
              ...others,
            ];
            confidence = aiResult.confidence;
          }
        }
      } else {
        // AI failed — fall back to rule-based
        const topMatch = allCandidateCreatures[0] || null;
        const intent = signals.intent;
        const result = buildResponse(topMatch, allCandidateCreatures, intent, confidence, signals);
        answer = result.answer;
      }
    } else {
      // No candidates at all
      const result = buildResponse(null, [], signals.intent, 'low', signals);
      answer = result.answer;
      finalMatches = [];
    }

    // Build match creatures for response
    const matchCreatures = finalMatches.map(r =>
      db.prepare('SELECT * FROM creatures WHERE id = ?').get(r.creature_id)
    ).filter(Boolean) as Creature[];

    const responsePayload = {
      answer,
      matches: finalMatches.map(r => ({
        creature: matchCreatures.find(c => c.id === r.creature_id),
        score: r.score,
        confidence: r.confidence,
        reasons: r.reasons,
      })),
      intent: signals.intent,
    };

    // Cache the result
    aiQueryCache.set(cacheKey, responsePayload);

    // Log query
    db.prepare('INSERT INTO query_log (raw_text, parsed_json, result_ids) VALUES (?, ?, ?)').run(
      text,
      JSON.stringify(signals),
      finalMatches.map(r => r.creature_id).join(','),
    );

    res.json(responsePayload);
  } catch (err) {
    console.error('Query route error:', err);
    res.status(500).json({ error: 'The skull falters. Something went wrong internally.' });
  }
});
