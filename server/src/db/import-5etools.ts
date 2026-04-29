import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { runSchema } from './schema';

// ---- 5etools raw interfaces ----

interface Creature5e {
  name: string;
  source: string;
  type: string | { type: string; tags?: string[]; swarmSize?: string };
  size: string[];
  cr?: string | { cr: string };
  alignment?: string[];
  environment?: string[];
  speed?: Record<string, number | boolean>;
  trait?: Array<{ name: string; entries: unknown[] }>;
  action?: Array<{ name: string; entries: unknown[] }>;
  bonus?: Array<{ name: string; entries: unknown[] }>;
  reaction?: Array<{ name: string; entries: unknown[] }>;
  legendary?: Array<{ name: string; entries: unknown[] }>;
  spellcasting?: unknown[];
  damageTags?: string[];
  damageTagsSpell?: string[];
  treasure?: string[];
  hasToken: boolean;
  hasFluff: boolean;
  hasFluffImages: boolean;
  languageTags?: string[];
  languages?: string[];
  miscTags?: string[];
  senseTags?: string[];
  conditionInflict?: string[];
}

interface FluffImage {
  type: string;
  href: { type: string; path: string };
  credit?: string;
  width?: number;
  height?: number;
}

interface FluffEntriesItem {
  type: string;
  name?: string;
  entry?: string;
  entries?: unknown[];
}

interface FluffEntryRaw {
  name: string;
  source: string;
  entries?: unknown[];
  images?: FluffImage[];
  _copy?: {
    name: string;
    source: string;
    _mod?: {
      entries?: { mode: string; items: unknown[] };
      images?: { mode: string; items: unknown[] };
    };
  };
}

interface ResolvedFluff {
  name: string;
  source: string;
  entries: unknown[];
  images: FluffImage[];
}

interface MappedCreature {
  name: string;
  type: string;
  subtype: string;
  size: string;
  challenge: number;
  alignment: string;
  armor_class: number;
  hit_points: number;
  speed: string;
  senses: string;
  languages: string;
  damage_types: string;
  habitats: string;
  movement_modes: string;
  physical_descriptors: string;
  behavioral_descriptors: string;
  sensory_clues: string;
  spoor_clues: string;
  status_effects: string;
  traits: string;
  actions: string;
  description: string;
  lore_summary: string;
  source: string;
  image_url: string;
}

// ---- Mapping constants ----

const SIZE_MAP: Record<string, string> = { T: 'tiny', S: 'small', M: 'medium', L: 'large', H: 'huge', G: 'gargantuan' };
const ALIGN_MAP: Record<string, string> = { C: 'chaotic', L: 'lawful', N: 'neutral', E: 'evil', G: 'good' };
const DAMAGE_TAG_MAP: Record<string, string> = {
  A: 'acid', B: 'bludgeoning', C: 'cold', D: 'bludgeoning', F: 'fire', H: 'lightning',
  I: 'cold', K: 'bludgeoning', L: 'lightning', M: 'thunder', N: 'necrotic', O: 'force',
  P: 'piercing', R: 'radiant', S: 'slashing', T: 'poison', U: 'piercing', V: 'psychic',
};

const CDN_BASE = 'https://5e.tools/img';

// ---- Stat block mapping functions (reused from original) ----

function flattenType(raw: Creature5e['type']): { type: string; subtype: string } {
  if (typeof raw === 'string') return { type: raw, subtype: '' };
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    let typeStr = '';
    if (typeof raw.type === 'string') {
      typeStr = raw.type;
    } else if (raw.type && typeof raw.type === 'object' && 'choose' in raw.type) {
      const choose = (raw.type as { choose: string[] }).choose;
      typeStr = Array.isArray(choose) ? choose[0] : '';
    } else {
      typeStr = String(raw.type || '');
    }
    return { type: typeStr, subtype: raw.tags ? raw.tags.join(', ') : '' };
  }
  return { type: String(raw), subtype: '' };
}

function flattenSize(sizes: string[]): string {
  return sizes.map(s => SIZE_MAP[s] || s.toLowerCase()).join(', ');
}

function flattenAlignment(aligns: string[] | undefined): string {
  if (!aligns || aligns.length === 0) return 'unaligned';
  const mapped = aligns.map(a => {
    if (a === 'any') return 'any';
    if (a === 'NX') return 'neutral (with tendencies)';
    if (a === 'NY') return 'neutral';
    let result = '';
    for (const ch of a) {
      if (ALIGN_MAP[ch]) result += ALIGN_MAP[ch] + ' ';
    }
    return result.trim() || a.toLowerCase();
  });
  return mapped.join(' or ').replace(/^any$/, 'any alignment');
}

function flattenEnvironment(envs: string[] | undefined): string {
  if (!envs || envs.length === 0) return 'unknown';
  return envs.map(e => e.replace(/^planar,?\s*/, '').trim()).filter(Boolean).join(', ');
}

function extractMovementModes(speed: Record<string, number | boolean> | undefined): string {
  if (!speed) return 'walking';
  const modes: string[] = [];
  for (const k of Object.keys(speed)) {
    if (k === 'walk') modes.push('walking');
    else if (k === 'fly') modes.push(speed.fly === true || (typeof speed.fly === 'number' && speed.fly > 0) ? 'flying' : '');
    else if (k === 'swim') modes.push('swimming');
    else if (k === 'burrow') modes.push('burrowing');
    else if (k === 'climb') modes.push('climbing');
  }
  if (modes.length === 0) modes.push('walking');
  return modes.filter(Boolean).join(', ');
}

function extractDamageTypes(tags?: string[], spellTags?: string[]): string {
  const all = [...(tags || []), ...(spellTags || [])];
  const names = [...new Set(all.map(t => DAMAGE_TAG_MAP[t] || t.toLowerCase()))];
  return names.join(', ');
}

function extractStatusEffects(actions?: Array<{ name: string }>, traits?: Array<{ name: string }>): string {
  const text = JSON.stringify([actions, traits]).toLowerCase();
  const conditions = ['charmed', 'frightened', 'paralyzed', 'petrified', 'poisoned', 'stunned', 'restrained', 'grappled', 'blinded', 'deafened', 'incapacitated', 'prone', 'unconscious', 'exhaustion'];
  return conditions.filter(c => text.includes(c)).join(', ');
}

function extractTraitNames(traits?: Array<{ name: string }>): string {
  if (!traits || traits.length === 0) return '[]';
  return JSON.stringify(traits.map(t => ({ name: t.name, text: '' })));
}

function extractActionNames(actions?: Array<{ name: string }>): string {
  if (!actions || actions.length === 0) return '[]';
  const names = actions
    .filter(a => !a.name.toLowerCase().includes('spellcasting') && a.name !== 'Spellcasting')
    .map(a => ({ name: a.name, text: '' }));
  return JSON.stringify(names);
}

function parseCr(cr: string | undefined): number {
  if (!cr) return 0;
  if (typeof cr === 'object') return 0;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  if (cr === '1/8') return 0.125;
  const n = parseFloat(cr);
  return isNaN(n) ? 0 : n;
}

function extractCr(raw: string | { cr: string } | undefined): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw;
  return raw.cr;
}

// ---- Fluff text extraction ----

function stripTags(text: string): string {
  // Pattern: {@TAG FIRST_ARG[|REST...]} — keep display text (FIRST_ARG), discard metadata
  return text.replace(/\{@(\w+)\s+([^|}]+)(?:\|[^}]*)?\}/g, (_match, _tag, firstArg) => {
    return firstArg.trim();
  });
}

function extractPlainText(entries: unknown[], depth = 0): string {
  const parts: string[] = [];
  const maxDepth = 10;

  for (const entry of entries) {
    if (depth > maxDepth) continue;

    if (typeof entry === 'string') {
      const cleaned = stripTags(entry).trim();
      if (cleaned) parts.push(cleaned);
      continue;
    }

    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;

    switch (e.type) {
      case 'section': {
        if (e.name && typeof e.name === 'string') {
          parts.push(stripTags(e.name).trim());
        }
        if (Array.isArray(e.entries)) {
          parts.push(extractPlainText(e.entries as unknown[], depth + 1));
        }
        break;
      }
      case 'entries': {
        if (e.name && typeof e.name === 'string' && depth === 0) {
          parts.push(stripTags(e.name).trim());
        }
        if (Array.isArray(e.entries)) {
          parts.push(extractPlainText(e.entries as unknown[], depth + 1));
        }
        break;
      }
      case 'list': {
        const items = e.items as FluffEntriesItem[] | undefined;
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.entry && typeof item.entry === 'string') {
              const label = item.name ? stripTags(item.name).trim() : '';
              const value = stripTags(item.entry).trim();
              if (label && value) parts.push(`${label} ${value}`);
              else if (value) parts.push(value);
            }
          }
        }
        break;
      }
      case 'item': {
        // handled inside list
        break;
      }
      case 'insetReadaloud':
      case 'inset':
      case 'quote':
        // Skip readaloud boxes and quotes — they're narrative flavor, not factual description
        break;
      case 'table':
        // Skip data tables
        break;
      default:
        // Unknown types — recurse if they have entries
        if (Array.isArray(e.entries)) {
          parts.push(extractPlainText(e.entries as unknown[], depth + 1));
        }
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

function deriveLoreSummary(description: string): string {
  if (!description.trim()) return '';

  // If description starts with what looks like a tagline (italic subtitle), use it
  const lines = description.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 20 && trimmed.length < 200) {
      return trimmed;
    }
  }

  // Fallback: first sentence up to ~200 chars
  const firstSentence = description.match(/^([^.!?]+[.!?])/);
  if (firstSentence) {
    return firstSentence[1].trim();
  }

  return description.slice(0, 200).trim();
}

// ---- Fluff loading and _copy resolution ----

function loadFluff(dataDir: string, source: string): Map<string, ResolvedFluff> {
  const fluffPath = path.join(dataDir, `fluff-bestiary-${source.toLowerCase()}.json`);
  if (!fs.existsSync(fluffPath)) {
    console.log(`  No fluff file for ${source}`);
    return new Map();
  }

  const raw = JSON.parse(fs.readFileSync(fluffPath, 'utf8'));
  const fluffEntries: FluffEntryRaw[] = raw.monsterFluff || [];
  console.log(`  Fluff entries: ${fluffEntries.length}`);

  // Index by name (exact match — _copy resolution uses exact name match)
  const index = new Map<string, FluffEntryRaw>();
  for (const fe of fluffEntries) {
    index.set(fe.name, fe);
  }

  // Resolve all entries
  const resolved = new Map<string, ResolvedFluff>();
  for (const fe of fluffEntries) {
    const result = resolveFluff(fe, index, new Set());
    resolved.set(fe.name, result);
  }

  return resolved;
}

function resolveFluff(
  entry: FluffEntryRaw,
  index: Map<string, FluffEntryRaw>,
  visited: Set<string>
): ResolvedFluff {
  if (!entry._copy) {
    return {
      name: entry.name,
      source: entry.source,
      entries: entry.entries || [],
      images: entry.images || [],
    };
  }

  // Guard against circular references
  const copyKey = `${entry._copy.name}|${entry._copy.source}`;
  if (visited.has(copyKey)) {
    console.warn(`  Circular _copy: ${entry.name}`);
    return { name: entry.name, source: entry.source, entries: entry.entries || [], images: entry.images || [] };
  }
  visited.add(copyKey);

  const parent = index.get(entry._copy.name);
  if (!parent) {
    console.warn(`  Orphaned _copy: ${entry.name} → ${entry._copy.name}`);
    return { name: entry.name, source: entry.source, entries: entry.entries || [], images: entry.images || [] };
  }

  const resolvedParent = resolveFluff(parent, index, visited);

  // Apply modifications
  let entries = deepClone(resolvedParent.entries);
  let images = deepClone(resolvedParent.images) as FluffImage[];

  if (entry._copy._mod) {
    if (entry._copy._mod.entries) {
      const mod = entry._copy._mod.entries;
      if (mod.mode === 'prependArr' && Array.isArray(mod.items)) {
        entries = [...mod.items, ...entries];
      } else if (mod.mode === 'appendArr' && Array.isArray(mod.items)) {
        entries = [...entries, ...mod.items];
      } else if (mod.mode === 'replaceArr' && Array.isArray(mod.items)) {
        entries = mod.items;
      }
    }
    if (entry._copy._mod.images) {
      const mod = entry._copy._mod.images;
      if (mod.mode === 'prependArr' && Array.isArray(mod.items)) {
        images = [...(mod.items as FluffImage[]), ...images];
      } else if (mod.mode === 'appendArr' && Array.isArray(mod.items)) {
        images = [...images, ...(mod.items as FluffImage[])];
      } else if (mod.mode === 'replaceArr' && Array.isArray(mod.items)) {
        images = mod.items as FluffImage[];
      }
    }
  }

  return { name: entry.name, source: entry.source, entries, images };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ---- Image URL construction ----

function buildCdnImageUrl(images: FluffImage[] | undefined, source: string, name: string): string {
  if (images && images.length > 0) {
    const imgPath = images[0].href.path;
    return `${CDN_BASE}/${imgPath}`;
  }
  return '';
}

// ---- Fallback text for creatures without fluff ----

function generateFallbackDescription(c: Creature5e): string {
  const { type, subtype } = flattenType(c.type);
  const sizeWords = flattenSize(c.size);
  const alignment = flattenAlignment(c.alignment);
  const habitats = flattenEnvironment(c.environment);
  const typeStr = [subtype, type].filter(Boolean).join(' ');
  const env = habitats !== 'unknown' ? `Typically found in ${habitats}.` : '';
  const traitNames = (c.trait || []).map(t => t.name).join(', ');
  const actionNames = (c.action || []).filter(a => a.name !== 'Spellcasting').map(a => a.name).join(', ');
  return [
    `A ${sizeWords} ${typeStr}.`,
    env,
    alignment !== 'unaligned' ? `Alignment: ${alignment}.` : '',
    traitNames ? `Traits: ${traitNames}.` : '',
    actionNames ? `Actions: ${actionNames}.` : '',
  ].filter(Boolean).join(' ');
}

function generateFallbackLoreSummary(c: Creature5e): string {
  const { type, subtype } = flattenType(c.type);
  const sizeWords = flattenSize(c.size);
  const cr = extractCr(typeof c.cr === 'object' ? c.cr : c.cr);
  const crStr = cr ? ` (CR ${cr})` : '';
  return `A ${sizeWords} ${type}${subtype ? ' (' + subtype + ')' : ''}${crStr}. Source: ${c.source}.`;
}

// ---- Main mapping ----

function mapCreature(
  c: Creature5e,
  fluffMap: Map<string, ResolvedFluff>
): MappedCreature {
  const { type, subtype } = flattenType(c.type);
  const sizeWords = flattenSize(c.size);
  const alignment = flattenAlignment(c.alignment);
  const habitats = flattenEnvironment(c.environment);
  const movementModes = extractMovementModes(c.speed);
  const damageTypes = extractDamageTypes(c.damageTags, c.damageTagsSpell);
  const statusEffects = extractStatusEffects(c.action, c.trait);
  const challenge = parseCr(extractCr(typeof c.cr === 'object' ? c.cr : c.cr));
  const traits = extractTraitNames(c.trait);
  const actions = extractActionNames(c.action);

  // Fluff-based description and image
  const fluff = fluffMap.get(c.name);
  let description = '';
  let loreSummary = '';
  let imageUrl = '';

  if (fluff && fluff.entries.length > 0) {
    description = extractPlainText(fluff.entries);
    loreSummary = deriveLoreSummary(description);
    imageUrl = buildCdnImageUrl(fluff.images, c.source, c.name);
  } else {
    // Fallback: generate from stat block metadata
    description = generateFallbackDescription(c);
    loreSummary = generateFallbackLoreSummary(c);
    // Try CDN image by convention
    imageUrl = '';
  }

  return {
    name: c.name,
    type,
    subtype,
    size: sizeWords,
    challenge,
    alignment,
    armor_class: 0,
    hit_points: 0,
    speed: '',
    senses: '',
    languages: '',
    damage_types: damageTypes,
    habitats,
    movement_modes: movementModes,
    physical_descriptors: '',
    behavioral_descriptors: '',
    sensory_clues: '',
    spoor_clues: '',
    status_effects: statusEffects,
    traits,
    actions,
    description,
    lore_summary: loreSummary,
    source: c.source,
    image_url: imageUrl,
  };
}

// ---- Stat block loading with optional _copy resolution from MM ----

function loadStatBlocks(dataDir: string): Map<string, Creature5e> {
  const files = ['bestiary-xmm.json', 'bestiary-xphb.json', 'bestiary-xdmg.json', 'bestiary-xge.json'];
  const all = new Map<string, Creature5e>();
  // Track load order for priority (first file wins on duplicate name)

  for (const file of files) {
    const fpath = path.join(dataDir, file);
    if (!fs.existsSync(fpath)) {
      console.warn(`Skipping missing file: ${file}`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    const monsters: Creature5e[] = raw.monster || [];
    console.log(`  ${file}: ${monsters.length} creatures`);

    for (const m of monsters) {
      const key = m.name;
      if (!all.has(key)) {
        all.set(key, m);
      }
    }
  }
  return all;
}

function loadMmStatBlocks(dataDir: string): Map<string, Creature5e> {
  const fpath = path.join(dataDir, 'bestiary-mm.json');
  if (!fs.existsSync(fpath)) return new Map();
  const raw = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  const monsters: Creature5e[] = raw.monster || [];
  const map = new Map<string, Creature5e>();
  for (const m of monsters) {
    map.set(m.name, m);
  }
  console.log(`  MM fallback: ${monsters.length} creatures loaded`);
  return map;
}

function resolveStatBlock(
  c: Creature5e,
  allBlocks: Map<string, Creature5e>,
  mmBlocks: Map<string, Creature5e>
): Creature5e {
  // Most 2024 creatures don't use _copy in stat blocks. But XGE Hound of Ill Omen does.
  const copyRef = (c as unknown as { _copy?: { name: string; source: string } })._copy;
  if (!copyRef) return c;

  // Try to find the parent in our loaded blocks first, then MM
  const parent = allBlocks.get(copyRef.name) || mmBlocks.get(copyRef.name);
  if (!parent) {
    console.warn(`  Stat block _copy target not found: ${copyRef.name} (for ${c.name})`);
    return c;
  }

  // Merge: use parent's structural fields but keep child's identity
  // Recursively resolve in case parent also has _copy
  const resolvedParent = resolveStatBlock(parent, allBlocks, mmBlocks);
  return {
    ...resolvedParent,
    name: c.name,
    source: c.source,
    trait: c.trait || resolvedParent.trait,
    action: c.action || resolvedParent.action,
    hasFluff: c.hasFluff ?? resolvedParent.hasFluff,
    hasFluffImages: c.hasFluffImages ?? resolvedParent.hasFluffImages,
  };
}

// ---- Database seeding ----

function seedDatabase(creatures: MappedCreature[], dbPath: string): void {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runSchema(db);

  // Clear existing creatures
  const before = db.prepare('SELECT COUNT(*) as count FROM creatures').get() as { count: number };
  console.log(`\nDatabase has ${before.count} creatures. Clearing...`);
  db.prepare('DELETE FROM creatures').run();

  const insert = db.prepare(`
    INSERT INTO creatures (
      name, type, subtype, size, challenge, alignment,
      armor_class, hit_points, speed, senses, languages,
      damage_types, habitats, movement_modes,
      physical_descriptors, behavioral_descriptors,
      sensory_clues, spoor_clues, status_effects,
      traits, actions, description, lore_summary, source, image_url
    ) VALUES (
      @name, @type, @subtype, @size, @challenge, @alignment,
      @armor_class, @hit_points, @speed, @senses, @languages,
      @damage_types, @habitats, @movement_modes,
      @physical_descriptors, @behavioral_descriptors,
      @sensory_clues, @spoor_clues, @status_effects,
      @traits, @actions, @description, @lore_summary, @source, @image_url
    )
  `);

  let inserted = 0;
  let skipped = 0;

  // Sanitize all fields to ensure they're bindable (string | number | null)
  function sanitize(v: unknown): string | number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' || typeof v === 'number') return v;
    return JSON.stringify(v);
  }

  const tx = db.transaction(() => {
    for (const c of creatures) {
      try {
        insert.run({
          name: sanitize(c.name),
          type: sanitize(c.type),
          subtype: sanitize(c.subtype),
          size: sanitize(c.size),
          challenge: sanitize(c.challenge),
          alignment: sanitize(c.alignment),
          armor_class: sanitize(c.armor_class),
          hit_points: sanitize(c.hit_points),
          speed: sanitize(c.speed),
          senses: sanitize(c.senses),
          languages: sanitize(c.languages),
          damage_types: sanitize(c.damage_types),
          habitats: sanitize(c.habitats),
          movement_modes: sanitize(c.movement_modes),
          physical_descriptors: sanitize(c.physical_descriptors),
          behavioral_descriptors: sanitize(c.behavioral_descriptors),
          sensory_clues: sanitize(c.sensory_clues),
          spoor_clues: sanitize(c.spoor_clues),
          status_effects: sanitize(c.status_effects),
          traits: sanitize(c.traits),
          actions: sanitize(c.actions),
          description: sanitize(c.description),
          lore_summary: sanitize(c.lore_summary),
          source: sanitize(c.source),
          image_url: sanitize(c.image_url),
        });
        inserted++;
      } catch (err) {
        console.error(`  Failed: ${c.name} — ${err instanceof Error ? err.message : err}`);
        skipped++;
      }
    }
  });

  tx();

  // Rebuild FTS5 index
  db.prepare("INSERT INTO creatures_fts(creatures_fts) VALUES('rebuild')").run();
  db.pragma('optimize');

  const after = db.prepare('SELECT COUNT(*) as count FROM creatures').get() as { count: number };
  console.log(`\nInserted: ${inserted}, Skipped: ${skipped}, Total in DB: ${after.count}`);

  db.close();
}

// ---- Stats reporting ----

function printStats(creatures: MappedCreature[]): void {
  const types = creatures.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {} as Record<string, number>);
  console.log('\nCreature types:');
  Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const sources = creatures.reduce((acc, c) => { acc[c.source] = (acc[c.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  console.log('\nBy source:');
  Object.entries(sources).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const withImages = creatures.filter(c => c.image_url !== '').length;
  const withFluff = creatures.filter(c => c.description.length > 200).length;
  console.log(`\nWith CDN images: ${withImages}/${creatures.length}`);
  console.log(`With rich fluff text: ${withFluff}/${creatures.length}`);
}

// ---- Main ----

function main() {
  const dataDir = '/tmp/5etools-src/data/bestiary';
  const dbPath = path.join(__dirname, '..', '..', 'journal.db');

  if (!fs.existsSync(dataDir)) {
    console.error(`5etools data not found at ${dataDir}`);
    console.error('Download from: https://github.com/5etools-mirror-3/5etools-src/releases/tag/v2.28.0');
    console.error('Extract to /tmp/5etools-src/');
    process.exit(1);
  }

  console.log('=== Loading 5etools 2024 bestiary data ===\n');

  // 1. Load stat block data
  console.log('Loading stat blocks:');
  const allBlocks = loadStatBlocks(dataDir);
  const mmBlocks = loadMmStatBlocks(dataDir);
  console.log(`Total unique stat blocks: ${allBlocks.size}`);

  // 2. Load fluff data
  console.log('\nLoading fluff:');
  const xmmFluff = loadFluff(dataDir, 'xmm');
  const xphbFluff = loadFluff(dataDir, 'xphb');
  // No fluff files for xdmg, xge

  // Merge all fluff into one lookup
  const allFluff = new Map<string, ResolvedFluff>();
  for (const [k, v] of xmmFluff) allFluff.set(k, v);
  for (const [k, v] of xphbFluff) allFluff.set(k, v);
  console.log(`Total fluff entries: ${allFluff.size}`);

  // 3. Map all creatures
  console.log('\nMapping creatures...');
  const mapped: MappedCreature[] = [];
  const skippedParents: string[] = [];

  for (const [name, statBlock] of allBlocks) {
    // Skip fluff-only parent entries (marked with (*) in fluff — they have no stat block)
    // These are only in fluff, not here. But also skip stat blocks that are clearly placeholder NPCs
    // if needed. For now, include everything with a stat block.

    try {
      const resolved = resolveStatBlock(statBlock, allBlocks, mmBlocks);
      const creature = mapCreature(resolved, allFluff);
      mapped.push(creature);
    } catch (err) {
      console.error(`Failed to map "${name}":`, err);
    }
  }

  // 4. Log fluff entries that have no matching stat block (informational)
  for (const [name] of allFluff) {
    if (!allBlocks.has(name)) {
      skippedParents.push(name);
    }
  }
  if (skippedParents.length > 0) {
    console.log(`\nSkipped ${skippedParents.length} fluff-only parent entries (no matching stat block):`);
    for (const n of skippedParents.slice(0, 15)) console.log(`  - ${n}`);
    if (skippedParents.length > 15) console.log(`  ... and ${skippedParents.length - 15} more`);
  }

  // 5. Sort by name
  mapped.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`\nTotal mapped creatures: ${mapped.length}`);

  // 6. Print stats
  printStats(mapped);

  // 7. Seed database
  console.log('\n=== Seeding database ===');
  seedDatabase(mapped, dbPath);

  console.log('\nDone. The skull knows more now.');
}

main();
