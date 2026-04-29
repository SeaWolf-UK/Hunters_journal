export interface Creature {
  id: number;
  name: string;
  type: string;
  subtype: string;
  size: string;
  challenge: number;
  alignment: string;
  armor_class: number;
  hit_points: number;
  speed: string;
  abilities: string;
  senses: string;
  languages: string;
  traits: string;
  actions: string;
  damage_types: string;
  status_effects: string;
  habitats: string;
  movement_modes: string;
  physical_descriptors: string;
  behavioral_descriptors: string;
  sensory_clues: string;
  spoor_clues: string;
  description: string;
  lore_summary: string;
  field_notes: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  creature: Creature;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: MatchReason[];
}

export interface MatchReason {
  field: string;
  matched: boolean;
  term?: string;
  query_value?: string;
  db_value?: string;
}

export interface QueryResponse {
  answer: string;
  matches: MatchResult[];
  intent: string;
}

export type SkullState = 'appearing' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'confused';
