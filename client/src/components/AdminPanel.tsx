import { useState } from 'react';
import { Creature } from '../types';
import { listCreatures, createCreature, updateCreature, deleteCreature } from '../api/client';
import './AdminPanel.css';

const EMPTY_FORM: Partial<Creature> = {
  name: '',
  type: '',
  subtype: '',
  size: '',
  challenge: 0,
  alignment: '',
  armor_class: 0,
  hit_points: 0,
  speed: '',
  languages: '',
  senses: '',
  damage_types: '',
  habitats: '',
  movement_modes: '',
  status_effects: '',
  physical_descriptors: '',
  behavioral_descriptors: '',
  sensory_clues: '',
  spoor_clues: '',
  traits: '[]',
  actions: '[]',
  description: '',
  lore_summary: '',
  source: 'Homebrew',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name', type: 'Type', subtype: 'Subtype', size: 'Size',
  challenge: 'CR', alignment: 'Alignment', armor_class: 'AC',
  hit_points: 'HP', speed: 'Speed', languages: 'Languages',
  senses: 'Senses', damage_types: 'Damage Types', habitats: 'Habitats',
  movement_modes: 'Movement', status_effects: 'Status Effects',
  physical_descriptors: 'Physical Traits', behavioral_descriptors: 'Behavior',
  sensory_clues: 'Sensory Clues', spoor_clues: 'Spoor Clues',
  traits: 'Traits (JSON)', actions: 'Actions (JSON)',
  description: 'Description', lore_summary: 'Lore Summary', source: 'Source',
};

const TEXT_FIELDS = [
  'name', 'type', 'subtype', 'size', 'alignment', 'speed',
  'languages', 'senses', 'damage_types', 'habitats', 'movement_modes',
  'status_effects', 'physical_descriptors', 'behavioral_descriptors',
  'sensory_clues', 'spoor_clues', 'traits', 'actions',
  'description', 'lore_summary', 'source',
];

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Creature | null>(null);
  const [form, setForm] = useState<Partial<Creature>>(EMPTY_FORM);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCreatures = async () => {
    try {
      const data = await listCreatures();
      setCreatures(data.creatures);
      setLoaded(true);
    } catch { /* */ }
  };

  const handleSelect = (c: Creature) => {
    setSelected(c);
    setForm(c);
    setIsNew(false);
  };

  const handleNew = () => {
    setSelected(null);
    setForm({ ...EMPTY_FORM });
    setIsNew(true);
  };

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await createCreature(form);
      } else if (selected) {
        await updateCreature(selected.id, form);
      }
      await loadCreatures();
      setIsNew(false);
      setSelected(null);
      setForm(EMPTY_FORM);
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Delete ${selected.name}?`)) return;
    try {
      await deleteCreature(selected.id);
      setSelected(null);
      setForm(EMPTY_FORM);
      await loadCreatures();
    } catch { /* */ }
  };

  if (!loaded) {
    loadCreatures();
    return (
      <div className="admin-panel admin-panel--open">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel admin-panel--open">
      <div className="admin-panel__header">
        <h2>Creature Management</h2>
        <button className="admin-panel__close" onClick={onClose}>&times;</button>
      </div>

      <div className="admin-panel__body">
        <div className="admin-panel__list">
          <button className="admin-panel__new-btn" onClick={handleNew}>
            + New Creature
          </button>
          <div className="admin-panel__creatures">
            {creatures.map(c => (
              <div
                key={c.id}
                className={`admin-panel__item ${selected?.id === c.id ? 'admin-panel__item--active' : ''}`}
                onClick={() => handleSelect(c)}
              >
                <span className="admin-panel__item-name">{c.name}</span>
                <span className="admin-panel__item-type">{c.type} CR {c.challenge}</span>
              </div>
            ))}
          </div>
        </div>

        {(selected || isNew) && (
          <div className="admin-panel__form">
            <h3>{isNew ? 'New Creature' : `Edit: ${selected?.name}`}</h3>
            <div className="admin-panel__fields">
              {TEXT_FIELDS.map(field => (
                <label key={field} className="admin-panel__field">
                  <span>{FIELD_LABELS[field] || field}</span>
                  <input
                    type="text"
                    value={(form as Record<string, unknown>)[field] as string || ''}
                    onChange={e => handleChange(field, e.target.value)}
                  />
                </label>
              ))}
              <label className="admin-panel__field">
                <span>CR</span>
                <input
                  type="number"
                  step="0.125"
                  min="0"
                  value={form.challenge || 0}
                  onChange={e => handleChange('challenge', parseFloat(e.target.value) || 0)}
                />
              </label>
              <label className="admin-panel__field">
                <span>Armor Class</span>
                <input
                  type="number"
                  value={form.armor_class || 0}
                  onChange={e => handleChange('armor_class', parseInt(e.target.value) || 0)}
                />
              </label>
              <label className="admin-panel__field">
                <span>Hit Points</span>
                <input
                  type="number"
                  value={form.hit_points || 0}
                  onChange={e => handleChange('hit_points', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
            <div className="admin-panel__actions">
              <button onClick={handleSave} disabled={saving || !form.name}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              {!isNew && (
                <button className="admin-panel__delete" onClick={handleDelete}>
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
