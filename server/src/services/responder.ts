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

interface ResponseOutput {
  answer: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ───── Persona: the skull ───── */
const OPENINGS = [
  "*A hollow sigh echoes from the jawbone*",
  "*The eye sockets flare with faint violet light*",
  "*The skull clatters its teeth in irritation*",
  "*A dry, ancient chuckle rattles the cranium*",
  "*Dust falls from the cheekbones as the jaw creaks open*",
  "*The skull tilts, regarding you with empty contempt*",
];

const VAGUE_COMPLAINTS = [
  "You wake me from centuries of blessed silence for THIS? 'What breathes fire?' Half the wretched Material Plane breathes fire, you mewling tadpole.",
  "Oh, splendid. Another vague mumble from a meat-brain who thinks 'big and scary' is a useful description. I have been dead longer than your kingdom has stood.",
  "Centuries. I have rested for centuries. And YOU rattle my bones with half-remembered tavern gossip. Give me something to WORK with, hunter.",
  "*The jaw grinds audibly* Do you have ANY idea how many creatures match that drivel? I could list them until your beard turns grey. Oh — you don't have one. Pity.",
  "I was a sage when your ancestors were scratching tally marks on cave walls. And THIS is the quality of question I am reduced to answering? Try harder, or let me sleep.",
];

const NO_MATCH_COMPLAINTS = [
  "Nothing. Not a single thing in my bound knowledge matches your fever-dream of a clue. Either you are hallucinating, or this creature does not exist. Both are your problem, not mine.",
  "A complete blank. I have catalogued five hundred and twenty-two creatures, and NOT ONE fits your babbling. Go back to the tavern. Ask the barkeep. He will lie to you more kindly than I will.",
  "Hmm. Your evidence is ... incomplete. Naturally. I cannot identify anything from that. More detail, hunter. Or better yet — ask someone who cares.",
  "I know nothing of this. Perhaps you misheard a tavern rumor? Try different terms. Or try a different skull. This one is going back to sleep.",
];

const FOLLOW_UP_PROMPTS = [
  "So — was it flying? Swimming? Burrowing? Did it have horns, tentacles, or a crown of bone? Give me SOMETHING to narrow this farce down.",
  "I need more, hunter. Habitat. Size. Colour. Anything that distinguishes it from the other four hundred creatures that nearly fit. Do better.",
  "You want a proper answer? Then tell me WHERE you saw it, HOW BIG it was, and what it DID to you. Or your friends. I do hope it ate someone interesting.",
  "That list is the best I can do with your pathetic clues. If you want a single name, come back with SIZE, LOCATION, and BEHAVIOUR. The skull demands specifics.",
];

const CLOSINGS = [
  "Now let me rest.",
  "Do not wake me again unless you have WORTHY prey.",
  "Let the silence reclaim me.",
  "I am going back to my dust. You should return to your ignorance.",
  "Begone. And take your vague questions with you.",
  "*The jaw clamps shut with a hollow snap*",
];

function isVagueQuery(allMatches: Creature[], signals: { creatureRefs: string[]; intent: string }): boolean {
  // Vague if no specific creature name was mentioned AND we got many matches
  return signals.creatureRefs.length === 0 && allMatches.length > 3;
}

function buildSingleCreatureDescription(c: Creature): string {
  const parts: string[] = [];
  parts.push(pickRandom(OPENINGS));
  parts.push(`Ah. The ${c.name}.`);

  if (c.description && c.description.length > 50) {
    parts.push(c.description);
  } else if (c.lore_summary) {
    parts.push(c.lore_summary);
  }

  parts.push(pickRandom(CLOSINGS));
  return parts.join(' ');
}

function buildVagueListResponse(allMatches: Creature[], signals: { intent: string }): string {
  const parts: string[] = [];
  parts.push(pickRandom(OPENINGS));
  parts.push(pickRandom(VAGUE_COMPLAINTS));

  // Build a categorized list
  const byType = new Map<string, Creature[]>();
  for (const c of allMatches.slice(0, 20)) {
    const t = c.type || 'Unknown';
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(c);
  }

  parts.push("Here is what matches your pitiful clue:");

  for (const [type, creatures] of byType) {
    const names = creatures.map(c => c.name).join(', ');
    parts.push(`**${type.charAt(0).toUpperCase() + type.slice(1)}**: ${names}.`);
  }

  if (allMatches.length > 20) {
    parts.push(`And ${allMatches.length - 20} more I am too bored to list. You get the idea.`);
  }

  parts.push(pickRandom(FOLLOW_UP_PROMPTS));
  parts.push(pickRandom(CLOSINGS));
  return parts.join(' ');
}

export function buildResponse(
  topMatch: Creature | null,
  allMatches: Creature[],
  intent: string,
  confidence: string,
  signals: { creatureRefs: string[]; intent: string }
): ResponseOutput {
  if (!topMatch || allMatches.length === 0) {
    return { answer: pickRandom(OPENINGS) + ' ' + pickRandom(NO_MATCH_COMPLAINTS) + ' ' + pickRandom(CLOSINGS) };
  }

  // Vague query with many matches — list them ALL
  if (isVagueQuery(allMatches, signals)) {
    return { answer: buildVagueListResponse(allMatches, signals) };
  }

  // Single specific creature identified
  if (allMatches.length === 1 || signals.creatureRefs.length > 0) {
    return { answer: buildSingleCreatureDescription(topMatch) };
  }

  // Multiple but not vague — narrowed down to a few
  const parts: string[] = [];
  parts.push(pickRandom(OPENINGS));
  parts.push(`Several candidates, hunter. The likeliest is ${topMatch.name}.`);
  if (topMatch.description) {
    parts.push(topMatch.description);
  } else if (topMatch.lore_summary) {
    parts.push(topMatch.lore_summary);
  }

  const others = allMatches.slice(1, 5).map(c => c.name).join(', ');
  if (others) {
    parts.push(`Also consider ${others}, if the details fit better.`);
  }

  parts.push(pickRandom(FOLLOW_UP_PROMPTS));
  parts.push(pickRandom(CLOSINGS));
  return { answer: parts.join(' ') };
}
