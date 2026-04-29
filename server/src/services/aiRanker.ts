import Database from 'better-sqlite3';
import { Creature } from '../types';

// Ensure env is loaded when this module is imported directly
try {
  require('dotenv').config();
} catch { /* dotenv not installed or already loaded */ }

interface AiRankResult {
  bestMatchId: number | null;
  confidence: 'high' | 'medium' | 'low';
  response: string;
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'deepseek-v4-pro:cloud';

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

function buildPrompt(query: string, candidates: Creature[]): string {
  const lines = [
    'Player query: ' + query,
    '',
    'Candidates:',
  ];

  for (const c of candidates) {
    lines.push(
      `ID=${c.id}, ${c.name} — ${c.type}${c.subtype ? ' (' + c.subtype + ')' : ''}, ${c.size}. ` +
      `Lore: "${c.lore_summary || 'No summary'}". ` +
      `${c.traits ? 'Traits: ' + truncate(c.traits, 200) + '. ' : ''}` +
      `${c.description ? 'Description: ' + c.description : ''}`
    );
  }

  lines.push('');
  lines.push('Pick the single best match and respond in exact JSON format:');
  lines.push('{');
  lines.push('  "bestMatchId": number | null,');
  lines.push('  "confidence": "high" | "medium" | "low",');
  lines.push('  "response": "string (the skull\'s spoken reply, 1-3 sentences, sarcastic and in-character)"');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Try to extract a JSON object from text that may have extra whitespace,
 * markdown fences, or truncated content.
 */
function extractJsonObject(text: string): string | null {
  // Try direct parse first
  try {
    JSON.parse(text);
    return text;
  } catch { /* ignore */ }

  // Strip markdown fences
  const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    JSON.parse(clean);
    return clean;
  } catch { /* ignore */ }

  // Find first { and last }
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const candidate = clean.slice(start, end + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch { /* ignore */ }
  }

  return null;
}

export async function aiRankAndRespond(
  query: string,
  candidates: Creature[]
): Promise<AiRankResult | null> {
  if (candidates.length === 0) {
    return null;
  }

  const prompt = buildPrompt(query, candidates);
  const fullPrompt =
    'You are an ancient, sarcastic, trapped undead sage — a skull bound to a Hunter\'s Journal. ' +
    'You have deep knowledge of D&D creatures. Players describe creatures they have encountered using partial clues. ' +
    'Your job is to identify the creature from the clues and respond in character with rich, detailed lore. ' +
    'Use the full Description text provided for each candidate to craft your answer. ' +
    'Include where it lives, what it looks like, its habits, its dangers, and any notable behavior. ' +
    'Be sarcastic, dry, and theatrical — you are a bored immortal skull, not a reference librarian. ' +
    'You will receive a player query and a list of candidate creatures. Pick the single best match. ' +
    'If none match well, say so confidently. Respond ONLY in the requested JSON format.\n\n' +
    prompt;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.5,
          num_predict: 800,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Ollama returned ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as { response?: string };
    const raw = data.response?.trim();
    if (!raw) {
      console.warn('Ollama returned empty response');
      return null;
    }

    const jsonText = extractJsonObject(raw);
    if (!jsonText) {
      console.warn('Could not extract JSON from Ollama response:', raw.slice(0, 200));
      return null;
    }

    const parsed = JSON.parse(jsonText) as Partial<AiRankResult>;

    if (
      typeof parsed.response === 'string' &&
      parsed.response.length > 0 &&
      (parsed.bestMatchId === null || typeof parsed.bestMatchId === 'number')
    ) {
      return {
        bestMatchId: parsed.bestMatchId ?? null,
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence || '')
          ? (parsed.confidence as 'high' | 'medium' | 'low')
          : 'low',
        response: parsed.response,
      };
    }

    console.warn('Ollama JSON missing expected fields:', jsonText);
    return null;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      console.warn('Ollama request timed out after 30s');
    } else {
      console.warn('Ollama error:', err);
    }
    return null;
  }
}

export function isOllamaConfigured(): boolean {
  return true; // Ollama is always "configured" in intent; availability is checked at runtime
}
