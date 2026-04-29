import Database from 'better-sqlite3';

export function runSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS creatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT '',
      subtype TEXT DEFAULT '',
      size TEXT DEFAULT '',
      challenge REAL DEFAULT 0,
      alignment TEXT DEFAULT '',
      armor_class INTEGER DEFAULT 0,
      hit_points INTEGER DEFAULT 0,
      speed TEXT DEFAULT '',
      abilities TEXT DEFAULT '{}',
      senses TEXT DEFAULT '',
      languages TEXT DEFAULT '',
      traits TEXT DEFAULT '[]',
      actions TEXT DEFAULT '[]',
      damage_types TEXT DEFAULT '',
      status_effects TEXT DEFAULT '',
      habitats TEXT DEFAULT '',
      movement_modes TEXT DEFAULT '',
      physical_descriptors TEXT DEFAULT '',
      behavioral_descriptors TEXT DEFAULT '',
      sensory_clues TEXT DEFAULT '',
      spoor_clues TEXT DEFAULT '',
      description TEXT DEFAULT '',
      lore_summary TEXT DEFAULT '',
      field_notes TEXT DEFAULT '',
      source TEXT DEFAULT 'Homebrew',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS creatures_fts USING fts5(
      name, type, subtype, description, lore_summary, traits, actions,
      habitats, physical_descriptors, behavioral_descriptors,
      sensory_clues, spoor_clues, status_effects, damage_types,
      content='creatures', content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS creatures_ai AFTER INSERT ON creatures BEGIN
      INSERT INTO creatures_fts(rowid, name, type, subtype, description, lore_summary, traits, actions, habitats, physical_descriptors, behavioral_descriptors, sensory_clues, spoor_clues, status_effects, damage_types)
      VALUES (new.id, new.name, new.type, new.subtype, new.description, new.lore_summary, new.traits, new.actions, new.habitats, new.physical_descriptors, new.behavioral_descriptors, new.sensory_clues, new.spoor_clues, new.status_effects, new.damage_types);
    END;

    CREATE TRIGGER IF NOT EXISTS creatures_ad AFTER DELETE ON creatures BEGIN
      INSERT INTO creatures_fts(creatures_fts, rowid, name, type, subtype, description, lore_summary, traits, actions, habitats, physical_descriptors, behavioral_descriptors, sensory_clues, spoor_clues, status_effects, damage_types)
      VALUES ('delete', old.id, old.name, old.type, old.subtype, old.description, old.lore_summary, old.traits, old.actions, old.habitats, old.physical_descriptors, old.behavioral_descriptors, old.sensory_clues, old.spoor_clues, old.status_effects, old.damage_types);
    END;

    CREATE TRIGGER IF NOT EXISTS creatures_au AFTER UPDATE ON creatures BEGIN
      INSERT INTO creatures_fts(creatures_fts, rowid, name, type, subtype, description, lore_summary, traits, actions, habitats, physical_descriptors, behavioral_descriptors, sensory_clues, spoor_clues, status_effects, damage_types)
      VALUES ('delete', old.id, old.name, old.type, old.subtype, old.description, old.lore_summary, old.traits, old.actions, old.habitats, old.physical_descriptors, old.behavioral_descriptors, old.sensory_clues, old.spoor_clues, old.status_effects, old.damage_types);
      INSERT INTO creatures_fts(rowid, name, type, subtype, description, lore_summary, traits, actions, habitats, physical_descriptors, behavioral_descriptors, sensory_clues, spoor_clues, status_effects, damage_types)
      VALUES (new.id, new.name, new.type, new.subtype, new.description, new.lore_summary, new.traits, new.actions, new.habitats, new.physical_descriptors, new.behavioral_descriptors, new.sensory_clues, new.spoor_clues, new.status_effects, new.damage_types);
    END;

    CREATE TABLE IF NOT EXISTS query_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_text TEXT NOT NULL,
      parsed_json TEXT,
      result_ids TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
