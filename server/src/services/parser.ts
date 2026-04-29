import { Creature } from '../types';

interface ParsedSignals {
  intent: 'describe' | 'identify' | 'list';
  creatureRefs: string[];
  typeFilters: string[];
  sizeFilters: string[];
  habitatFilters: string[];
  abilityKeywords: string[];
  damageTypeFilters: string[];
  statusFilters: string[];
  movementFilters: string[];
  negations: string[];
}

const ALIASES: Record<string, { type?: string; size?: string; habitat?: string; ability?: string; damageType?: string; status?: string; movement?: string }> = {
  'reptile': { type: 'dragon' },
  'dragon': { type: 'dragon' },
  'draconic': { type: 'dragon' },
  'undead': { type: 'undead' },
  'zombie': { type: 'undead' },
  'skeleton': { type: 'undead' },
  'ghost': { type: 'undead' },
  'ghoul': { type: 'undead' },
  'vampire': { type: 'undead' },
  'lich': { type: 'undead' },
  'wight': { type: 'undead' },
  'specter': { type: 'undead' },
  'wraith': { type: 'undead' },
  'beast': { type: 'beast' },
  'monstrosity': { type: 'monstrosity' },
  'aberration': { type: 'aberration' },
  'aberrant': { type: 'aberration' },
  'fiend': { type: 'fiend' },
  'demon': { type: 'fiend' },
  'devil': { type: 'fiend' },
  'demonic': { type: 'fiend' },
  'diabolic': { type: 'fiend' },
  'celestial': { type: 'celestial' },
  'angel': { type: 'celestial' },
  'fey': { type: 'fey' },
  'fairy': { type: 'fey' },
  'fae': { type: 'fey' },
  'giant': { type: 'giant' },
  'humanoid': { type: 'humanoid' },
  'human': { type: 'humanoid' },
  'elf': { type: 'humanoid' },
  'dwarf': { type: 'humanoid' },
  'orc': { type: 'humanoid' },
  'goblin': { type: 'humanoid' },
  'kobold': { type: 'humanoid' },
  'ooze': { type: 'ooze' },
  'slime': { type: 'ooze' },
  'plant': { type: 'plant' },
  'elemental': { type: 'elemental' },
  'construct': { type: 'construct' },
  'golem': { type: 'construct' },

  'acid': { damageType: 'acid' },
  'acidic': { damageType: 'acid' },
  'fire': { damageType: 'fire' },
  'fiery': { damageType: 'fire' },
  'flame': { damageType: 'fire' },
  'flaming': { damageType: 'fire' },
  'burn': { damageType: 'fire' },
  'burning': { damageType: 'fire' },
  'cold': { damageType: 'cold' },
  'frost': { damageType: 'cold' },
  'ice': { damageType: 'cold' },
  'freeze': { damageType: 'cold' },
  'freezing': { damageType: 'cold' },
  'lightning': { damageType: 'lightning' },
  'electric': { damageType: 'lightning' },
  'shock': { damageType: 'lightning' },
  'poison': { damageType: 'poison' },
  'poisonous': { damageType: 'poison' },
  'toxic': { damageType: 'poison' },
  'necrotic': { damageType: 'necrotic' },
  'necrotic energy': { damageType: 'necrotic' },
  'life drain': { damageType: 'necrotic' },
  'psychic': { damageType: 'psychic' },
  'psychic damage': { damageType: 'psychic' },

  'fire breath': { ability: 'Fire Breath', damageType: 'fire' },
  'fire breathing': { ability: 'Fire Breath', damageType: 'fire' },
  'breathes fire': { ability: 'Fire Breath', damageType: 'fire' },
  'acid breath': { ability: 'Acid Breath', damageType: 'acid' },
  'acid breathing': { ability: 'Acid Breath', damageType: 'acid' },
  'spits acid': { ability: 'Acid Breath', damageType: 'acid' },
  'poison breath': { ability: 'Poison Breath', damageType: 'poison' },
  'cold breath': { ability: 'Cold Breath', damageType: 'cold' },
  'frost breath': { ability: 'Cold Breath', damageType: 'cold' },
  'lightning breath': { ability: 'Lightning Breath', damageType: 'lightning' },
  'breathes lightning': { ability: 'Lightning Breath', damageType: 'lightning' },
  'regenerate': { ability: 'Regeneration' },
  'regeneration': { ability: 'Regeneration' },
  'regrows': { ability: 'Regeneration' },
  'spellcast': { ability: 'Spellcasting' },
  'spells': { ability: 'Spellcasting' },
  'breath weapon': { ability: '' },
  'breath': { ability: '' },

  'paralyze': { status: 'paralyzed' },
  'paralysis': { status: 'paralyzed' },
  'paralyzing': { status: 'paralyzed' },
  'frighten': { status: 'frightened' },
  'fear': { status: 'frightened' },
  'terrify': { status: 'frightened' },
  'frightful': { status: 'frightened' },
  'charm': { status: 'charmed' },
  'charmed': { status: 'charmed' },
  'poisoned': { status: 'poisoned' },
  'petrify': { status: 'petrified' },
  'stone': { status: 'petrified' },
  'turn to stone': { status: 'petrified' },
  'stun': { status: 'stunned' },
  'stunned': { status: 'stunned' },
  'possess': { status: 'possessed' },
  'possession': { status: 'possessed' },

  'swamp': { habitat: 'swamp' },
  'bog': { habitat: 'swamp' },
  'marsh': { habitat: 'swamp' },
  'forest': { habitat: 'forest' },
  'jungle': { habitat: 'forest' },
  'woods': { habitat: 'forest' },
  'grassland': { habitat: 'grassland' },
  'plains': { habitat: 'grassland' },
  'mountain': { habitat: 'mountain' },
  'volcano': { habitat: 'mountain' },
  'desert': { habitat: 'desert' },
  'arid': { habitat: 'desert' },
  'arctic': { habitat: 'arctic' },
  'tundra': { habitat: 'arctic' },
  'frozen': { habitat: 'arctic' },
  'underdark': { habitat: 'underdark' },
  'underground': { habitat: 'underdark' },
  'cave': { habitat: 'underdark' },
  'dungeon': { habitat: 'underdark' },
  'ruin': { habitat: 'underdark' },
  'tomb': { habitat: 'underdark' },
  'crypt': { habitat: 'underdark' },
  'grave': { habitat: 'underdark' },
  'castle': { habitat: 'urban' },
  'city': { habitat: 'urban' },
  'urban': { habitat: 'urban' },
  'coastal': { habitat: 'coastal' },
  'coast': { habitat: 'coastal' },
  'ocean': { habitat: 'underwater' },
  'underwater': { habitat: 'underwater' },
  'feywild': { habitat: 'planar (feywild)' },
  'shadowfell': { habitat: 'planar (shadowfell)' },
  'planar': { habitat: 'planar' },

  'huge': { size: 'huge' },
  'large': { size: 'large' },
  'medium': { size: 'medium' },
  'small': { size: 'small' },
  'tiny': { size: 'tiny' },
  'gargantuan': { size: 'gargantuan' },

  'fly': { movement: 'flying' },
  'flying': { movement: 'flying' },
  'flight': { movement: 'flying' },
  'swim': { movement: 'swimming' },
  'swimming': { movement: 'swimming' },
  'burrow': { movement: 'burrowing' },
  'burrowing': { movement: 'burrowing' },
  'hover': { movement: 'hover' },
  'hovering': { movement: 'hover' },

  'ambush': { ability: '' },
  'ambush predator': { ability: '' },
  'invisible': { ability: '' },
  'invisibility': { ability: '' },
  'shapeshift': { ability: 'Shapechanger' },
  'shapeshifter': { ability: 'Shapechanger' },
  'shapechange': { ability: 'Shapechanger' },
  'disguise': { ability: 'Shapechanger', },
};

const CREATURE_NAMES = [
  'red dragon', 'black dragon', 'blue dragon', 'green dragon', 'white dragon',
  'brass dragon', 'bronze dragon', 'copper dragon', 'gold dragon', 'silver dragon',
  'dragon turtle', 'lich', 'vampire', 'beholder', 'mind flayer', 'illithid', 'owlbear',
  'gelatinous cube', 'displacer beast', 'goblin', 'orc', 'troll', 'mimic',
  'ghost', 'skeleton', 'zombie', 'kobold', 'aboleth', 'ankheg', 'basilisk',
  'behir', 'bulette', 'chuul', 'cloaker', 'cockatrice', 'couatl', 'gargoyle',
  'griffon', 'hydra', 'manticore', 'medusa', 'minotaur', 'mummy', 'naga',
  'night hag', 'otyugh', 'pegasus', 'purple worm', 'remorhaz', 'roc',
  'rust monster', 'salamander', 'satyr', 'shadow', 'shambling mound',
  'shield guardian', 'sphinx', 'treant', 'unicorn', 'wraith', 'wyvern',
  'yeti', 'yuan-ti', 'azer', 'balor', 'barlgura', 'chasme', 'dretch',
  'glabrezu', 'goristro', 'hezrou', 'marilith', 'nalfeshnee', 'quasit',
  'shadow demon', 'vrock', 'yochlol', 'androsphinx', 'gynosphinx',
  'dao', 'djinni', 'efreeti', 'marid', 'xorn', 'flameskull',
];

export function parseQuery(text: string): ParsedSignals {
  const lower = text.toLowerCase();

  const signals: ParsedSignals = {
    intent: 'describe',
    creatureRefs: [],
    typeFilters: [],
    sizeFilters: [],
    habitatFilters: [],
    abilityKeywords: [],
    damageTypeFilters: [],
    statusFilters: [],
    movementFilters: [],
    negations: [],
  };

  // Intent detection
  if (/^(what|who|which|identify|name the|tell me what|i think it)/i.test(text.trim())) {
    signals.intent = 'identify';
  } else if (/^(list|show|find|search|all)/i.test(text.trim())) {
    signals.intent = 'list';
  }

  // Direct creature name matches
  for (const name of CREATURE_NAMES) {
    if (lower.includes(name)) {
      signals.creatureRefs.push(name);
    }
  }

  // Check multi-word aliases first (longer phrases)
  const phrases = Object.keys(ALIASES).sort((a, b) => b.length - a.length);
  const matchedKeywords = new Set<string>();

  for (const phrase of phrases) {
    if (lower.includes(phrase)) {
      const mapping = ALIASES[phrase];
      if (mapping.type && !signals.typeFilters.includes(mapping.type)) {
        signals.typeFilters.push(mapping.type);
      }
      if (mapping.size) signals.sizeFilters.push(mapping.size);
      if (mapping.habitat) signals.habitatFilters.push(mapping.habitat);
      if (mapping.ability && !matchedKeywords.has(mapping.ability)) {
        signals.abilityKeywords.push(mapping.ability);
        matchedKeywords.add(mapping.ability);
      }
      if (mapping.damageType && !signals.damageTypeFilters.includes(mapping.damageType)) {
        signals.damageTypeFilters.push(mapping.damageType);
      }
      if (mapping.status) signals.statusFilters.push(mapping.status);
      if (mapping.movement) signals.movementFilters.push(mapping.movement);
    }
  }

  // Negations
  const negMatch = lower.match(/\b(not|no|never|isn't|aren't|wasn't|weren't)\s+(\w+)/g);
  if (negMatch) {
    signals.negations = negMatch.map(n => n.replace(/^(not|no|never|isn't|aren't|wasn't|weren't)\s+/, ''));
  }

  return signals;
}
