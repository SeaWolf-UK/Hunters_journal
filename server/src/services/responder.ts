interface Creature {
  id: number;
  name: string;
  type: string;
  size: string;
  challenge: number;
  armor_class: number;
  hit_points: number;
  lore_summary: string;
  habitats: string;
  description: string;
  traits: string;
  actions: string;
  damage_types: string;
  status_effects: string;
  movement_modes: string;
}

interface RankedMatch {
  creature_id: number;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: unknown[];
}

interface ResponseOutput {
  answer: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildCreatureDescription(c: Creature): string {
  const parts: string[] = [];

  // Opening in character
  parts.push(`Ah, the ${c.name}.`);

  // If we have a rich description, use it in full
  if (c.description && c.description.length > 50) {
    parts.push(c.description);
  } else if (c.lore_summary) {
    parts.push(c.lore_summary);
  }

  return parts.join(' ');
}

const IDENTIFY_TEMPLATES = [
  (matches: Creature[]) => {
    if (matches.length === 0) return 'Nothing matches those clues. And I do mean nothing. Try again.';
    if (matches.length === 1) {
      const c = matches[0];
      return buildCreatureDescription(c);
    }
    const names = matches.slice(0, 3).map(c => c.name).join(', ');
    return `Your clues point to ${names}.`;
  },
];

const CONFUSED_TEMPLATES = [
  "Hmm. Your evidence is ... incomplete. Naturally. I cannot identify anything from that. More detail, hunter.",
  "Nothing matches. Which means either your clues are wrong, or this creature is not in my knowledge. Both are concerning.",
  "I know nothing of this. Perhaps you misheard a tavern rumor? Try different terms.",
  "A complete blank. The fault is either yours, or a gap in my bound knowledge. Try again.",
];

export function buildResponse(
  topMatch: Creature | null,
  allMatches: Creature[],
  intent: string,
  confidence: string
): ResponseOutput {
  if (!topMatch || allMatches.length === 0) {
    return { answer: pickRandom(CONFUSED_TEMPLATES) };
  }

  let answer = '';

  if (intent === 'identify' && allMatches.length > 1) {
    answer = pickRandom(IDENTIFY_TEMPLATES)(allMatches);
  } else if (intent === 'list' && allMatches.length > 1) {
    const names = allMatches.slice(0, 5).map(c => c.name).join(', ');
    answer = `The relevant records: ${names}. Which one interests you?`;
  } else if (confidence === 'low') {
    answer = `${pickRandom(CONFUSED_TEMPLATES)} Perhaps... ${topMatch.name}? The match is weak — more details would help.`;
  } else {
    // Rich description of the creature using full description text
    answer = buildCreatureDescription(topMatch);
  }

  // Add confidence nuance
  if (confidence === 'medium') {
    answer += ' I am reasonably certain. Which means there is room for error.';
  } else if (confidence === 'low') {
    answer += ' Though the match is tenuous. More clues would narrow the field.';
  }

  // Add multi-match note
  if (allMatches.length > 1 && intent !== 'identify') {
    const others = allMatches.slice(1, 3).map(c => c.name).join(' and ');
    if (others) {
      answer += ` Also consider ${others}, if the details fit better.`;
    }
  }

  return { answer };
}
