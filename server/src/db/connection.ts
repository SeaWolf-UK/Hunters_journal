import Database from 'better-sqlite3';
import { runSchema } from './schema';
import path from 'path';

let db: Database.Database;

export function initDb(): Database.Database {
  db = new Database(path.join(__dirname, '..', '..', 'journal.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runSchema(db);
  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}
