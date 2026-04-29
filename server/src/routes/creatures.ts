import { Router } from 'express';
import { getDb } from '../db/connection';

export const creaturesRouter = Router();

creaturesRouter.get('/creatures', (_req, res) => {
  const db = getDb();
  const creatures = db.prepare('SELECT * FROM creatures ORDER BY name').all();
  res.json({ creatures });
});

creaturesRouter.get('/creatures/:id', (req, res) => {
  const db = getDb();
  const creature = db.prepare('SELECT * FROM creatures WHERE id = ?').get(req.params.id);
  if (!creature) {
    res.status(404).json({ error: 'Creature not found' });
    return;
  }
  res.json({ creature });
});

creaturesRouter.post('/creatures', (req, res) => {
  const db = getDb();
  const { name, type } = req.body;
  if (!name || !type) {
    res.status(400).json({ error: 'name and type are required' });
    return;
  }
  const result = db.prepare('INSERT INTO creatures (name, type) VALUES (?, ?)').run(name, type);
  const creature = db.prepare('SELECT * FROM creatures WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ creature });
});

creaturesRouter.put('/creatures/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM creatures WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Creature not found' });
    return;
  }
  const fields = ['name','type','subtype','size','challenge','alignment','armor_class','hit_points','speed','senses','languages','damage_types','habitats','movement_modes','physical_descriptors','behavioral_descriptors','sensory_clues','spoor_clues','status_effects','traits','actions','description','lore_summary','source'];
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(req.body[f]);
    }
  }
  if (sets.length === 0) {
    res.json({ creature: existing });
    return;
  }
  sets.push("updated_at = datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE creatures SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  const creature = db.prepare('SELECT * FROM creatures WHERE id = ?').get(req.params.id);
  res.json({ creature });
});

creaturesRouter.delete('/creatures/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM creatures WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Creature not found' });
    return;
  }
  db.prepare('DELETE FROM creatures WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
