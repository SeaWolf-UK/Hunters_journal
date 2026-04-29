import Database from 'better-sqlite3';

interface SearchMatch {
  creature_id: number;
  match_reasons: MatchReason[];
}

interface MatchReason {
  field: string;
  matched: boolean;
  term?: string;
  query_value?: string;
  db_value?: string;
  fts_rank?: number;
}

interface ParsedSignals {
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

export function searchCreatures(db: Database.Database, signals: ParsedSignals, rawText: string): SearchMatch[] {
  const matches: Map<number, MatchReason[]> = new Map();

  function addReason(id: number, reason: MatchReason) {
    if (!matches.has(id)) matches.set(id, []);
    const existing = matches.get(id)!;
    if (!existing.some(r => r.field === reason.field && r.term === reason.term)) {
      existing.push(reason);
    }
  }

  // 1a. Creature name matches from parser signals (partial LIKE matching)
  for (const ref of signals.creatureRefs) {
    const rows = db.prepare(`SELECT id, name FROM creatures WHERE LOWER(name) LIKE ?`).all(`%${ref}%`) as { id: number; name: string }[];
    for (const row of rows) {
      addReason(row.id, { field: 'name', matched: true, term: 'partial', query_value: ref, db_value: row.name });
    }
  }

  // 1b. Try the raw query text and extracted n-grams as partial name matches
  const cleanQuery = rawText.toLowerCase().trim();
  if (cleanQuery.length > 2) {
    const nameRows = db.prepare('SELECT id, name FROM creatures WHERE LOWER(name) LIKE ?').all(`%${cleanQuery}%`) as { id: number; name: string }[];
    for (const row of nameRows) {
      addReason(row.id, { field: 'name', matched: true, term: 'query-match', query_value: cleanQuery, db_value: row.name });
    }

    // Also try 2-4 word n-grams from the query to catch multi-word creature names
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const phrases = new Set<string>();
    for (let i = 0; i < words.length; i++) {
      for (let len = 2; len <= 4 && i + len <= words.length; len++) {
        phrases.add(words.slice(i, i + len).join(' '));
      }
    }
    for (const phrase of phrases) {
      const phraseRows = db.prepare('SELECT id, name FROM creatures WHERE LOWER(name) LIKE ?').all(`%${phrase}%`) as { id: number; name: string }[];
      for (const row of phraseRows) {
        addReason(row.id, { field: 'name', matched: true, term: 'ngram-match', query_value: phrase, db_value: row.name });
      }
    }
  }

  // 2. FTS5 full-text search on raw query text
  const searchTerms = buildFtsQuery(rawText);
  if (searchTerms.length > 0) {
    const ftsRows = db.prepare(`
      SELECT rowid, rank FROM creatures_fts
      WHERE creatures_fts MATCH ?
      ORDER BY rank
      LIMIT 15
    `).all(searchTerms) as { rowid: number; rank: number }[];

    for (const row of ftsRows) {
      addReason(row.rowid, { field: 'fts', matched: true, term: 'fulltext', fts_rank: row.rank });
    }
  }

  // 3. Type filters
  if (signals.typeFilters.length > 0) {
    for (const type of signals.typeFilters) {
      const rows = db.prepare(`SELECT id, type FROM creatures WHERE LOWER(type) = ?`).all(type) as { id: number; type: string }[];
      for (const row of rows) {
        addReason(row.id, { field: 'type', matched: true, query_value: type, db_value: row.type });
      }
    }
  }

  // 4. Size filters
  if (signals.sizeFilters.length > 0) {
    for (const size of signals.sizeFilters) {
      const rows = db.prepare(`SELECT id, size FROM creatures WHERE LOWER(size) = ?`).all(size) as { id: number; size: string }[];
      for (const row of rows) {
        addReason(row.id, { field: 'size', matched: true, query_value: size, db_value: row.size });
      }
    }
  }

  // 5. Damage type filters
  if (signals.damageTypeFilters.length > 0) {
    for (const dt of signals.damageTypeFilters) {
      const rows = db.prepare(`SELECT id, damage_types FROM creatures WHERE damage_types LIKE ?`).all(`%${dt}%`) as { id: number; damage_types: string }[];
      for (const row of rows) {
        addReason(row.id, { field: 'damage_types', matched: true, query_value: dt, db_value: row.damage_types });
      }
    }
  }

  // 6. Status effects
  if (signals.statusFilters.length > 0) {
    for (const status of signals.statusFilters) {
      const rows = db.prepare(`SELECT id, status_effects FROM creatures WHERE status_effects LIKE ?`).all(`%${status}%`) as { id: number; status_effects: string }[];
      for (const row of rows) {
        addReason(row.id, { field: 'status_effects', matched: true, query_value: status, db_value: row.status_effects });
      }
    }
  }

  // 7. Habitat filters (broad LIKE matching)
  if (signals.habitatFilters.length > 0) {
    for (const hab of signals.habitatFilters) {
      const habWords = hab.split(/[,\s]+/).filter(w => w.length > 2);
      for (const word of habWords) {
        const rows = db.prepare(`SELECT id, habitats FROM creatures WHERE habitats LIKE ?`).all(`%${word}%`) as { id: number; habitats: string }[];
        for (const row of rows) {
          addReason(row.id, { field: 'habitats', matched: true, term: word, db_value: row.habitats });
        }
      }
    }
  }

  // 8. Movement mode filters
  if (signals.movementFilters.length > 0) {
    for (const move of signals.movementFilters) {
      const rows = db.prepare(`SELECT id, movement_modes FROM creatures WHERE movement_modes LIKE ?`).all(`%${move}%`) as { id: number; movement_modes: string }[];
      for (const row of rows) {
        addReason(row.id, { field: 'movement_modes', matched: true, query_value: move, db_value: row.movement_modes });
      }
    }
  }

  // 9. Ability keywords in traits/actions JSON
  if (signals.abilityKeywords.length > 0) {
    for (const kw of signals.abilityKeywords) {
      if (!kw) continue;
      const rows = db.prepare(`SELECT id, traits, actions FROM creatures WHERE traits LIKE ? OR actions LIKE ? OR traits LIKE ? OR actions LIKE ?`).all(`%${kw}%`, `%${kw}%`, `%${kw.toLowerCase()}%`, `%${kw.toLowerCase()}%`) as { id: number; traits: string; actions: string }[];
      for (const row of rows) {
        addReason(row.id, { field: 'traits', matched: true, term: kw, db_value: row.traits });
      }
    }
  }

  // 10. Negation handling: remove creatures matching negated terms
  for (const neg of signals.negations) {
    const negRows = db.prepare(`SELECT id FROM creatures WHERE type LIKE ? OR name LIKE ? OR habitats LIKE ?`).all(`%${neg}%`, `%${neg}%`, `%${neg}%`) as { id: number }[];
    for (const row of negRows) {
      matches.delete(row.id);
    }
  }

  return Array.from(matches.entries()).map(([creature_id, reasons]) => ({
    creature_id,
    match_reasons: reasons,
  }));
}

// Stop words — words so common in creature descriptions they produce noise
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'from', 'with', 'this', 'that', 'have', 'has',
  'had', 'are', 'was', 'were', 'been', 'its', 'their', 'them', 'they',
  'which', 'when', 'where', 'what', 'who', 'how', 'all', 'not', 'but',
  'can', 'each', 'more', 'most', 'other', 'some', 'only', 'just',
  'creature', 'creatures', 'attack', 'damage', 'make', 'action',
  'actions', 'target', 'within', 'feet', 'reach', 'range', 'save',
  'saving', 'also', 'than', 'too', 'very', 'will', 'about', 'tell',
  'face', 'you', 'your', 'know', 'there',
]);

function buildFtsQuery(rawText: string): string {
  return rawText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()))
    .join(' ');
}
