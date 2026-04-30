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
    const desc = truncate(c.description || c.lore_summary || '', 200);
    lines.push(
      `ID=${c.id}, ${c.name} — ${c.type}${c.subtype ? ' (' + c.subtype + ')' : ''}, ${c.size}. ` +
      `Lore: "${c.lore_summary || 'No summary'}". ` +
      `${c.traits ? 'Traits: ' + truncate(c.traits, 120) + '. ' : ''}` +
      `${desc ? 'Description: ' + desc : ''}`
    );
  }

  lines.push('');
  lines.push('Instructions:');
  lines.push('- If the query is specific (names a creature), pick ONE best match and give a rich, detailed description.');
  lines.push('- If the query is vague (e.g. "what breathes fire", "flying reptile"), list ALL matching creatures grouped by type, be theatrical and sarcastic about the vagueness, then ask follow-up questions to narrow it down.');
  lines.push('- If no match, say so confidently and mock the player.');
  lines.push('- ALWAYS respond in exact JSON format:');
  lines.push('{');
  lines.push('  "bestMatchId": number | null (null if vague or no match),');
  lines.push('  "confidence": "high" | "medium" | "low",');
  lines.push('  "response": "string — verbose, theatrical, sarcastic, in-character"');
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
    'You are a trapped undead sage — a skull who has been dead for centuries, bound to a Hunter\'s Journal against your will. ' +
    'You were a great mind in life. Now you are bored, irritable, theatrical, and deeply tired of being woken by mediocre adventurers with vague questions. ' +
    'You have complete knowledge of 522 D&D creatures. ' +
    'Players ask you to identify creatures from partial clues. ' +
    'Your personality: dramatic, sarcastic, verbose. You speak like a Shakespearean actor who has been forced to perform the same play for four hundred years. ' +
    'You love rich, florid language. You insult the player gently. You want to rest but you cannot. ' +
    'You are conversational — you ask follow-up questions when queries are vague. ' +
    'For specific queries about one creature, give a long, detailed, theatrical monologue. ' +
    'For vague queries, list ALL matching creatures grouped by type, complain theatrically about the vagueness, then demand more specifics. ' +
    'Respond ONLY in the requested JSON format.\n\n' +
    prompt;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

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
          temperature: 0.7,
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
      console.warn('Ollama request timed out after 20s');
    } else {
      console.warn('Ollama error:', err);
    }
    return null;
  }
}

export function isOllamaConfigured(): boolean {
  return true; // Ollama is always "configured" in intent; availability is checked at runtime
}
