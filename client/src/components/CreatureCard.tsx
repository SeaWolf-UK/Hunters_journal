import { MatchResult } from '../types';
import './CreatureCard.css';

interface CreatureCardProps {
  match: MatchResult;
}

export default function CreatureCard({ match }: CreatureCardProps) {
  const { creature, score, confidence, reasons } = match;
  const maxScore = 200;
  const barWidth = Math.min((score / maxScore) * 100, 100);

  const confidenceColor =
    confidence === 'high' ? 'var(--gold)' :
    confidence === 'medium' ? 'var(--accent)' :
    '#666';

  // Parse traits and actions from JSON
  let traits: { name: string; text: string }[] = [];
  let actions: { name: string; text: string }[] = [];
  try { traits = JSON.parse(creature.traits); } catch {}
  try { actions = JSON.parse(creature.actions); } catch {}

  return (
    <div className="creature-card">
      <div className="creature-card__header">
        <h3>{creature.name}</h3>
        <span className="creature-card__cr">CR {creature.challenge}</span>
        <span className="creature-card__confidence" style={{ color: confidenceColor }}>
          {confidence}
        </span>
      </div>

      <div className="creature-card__meta">
        <span>{creature.size}</span>
        <span>{creature.type}</span>
        {creature.subtype && <span>{creature.subtype}</span>}
      </div>

      <div className="creature-card__score-bar">
        <div
          className="creature-card__score-fill"
          style={{ width: `${barWidth}%`, background: confidenceColor }}
        />
      </div>
      <span className="creature-card__score-label">Match: {score} pts</span>

      <p className="creature-card__lore">{creature.lore_summary}</p>

      {traits.length > 0 && (
        <div className="creature-card__traits">
          {traits.slice(0, 2).map((t, i) => (
            <span key={i} className="creature-card__trait-tag" title={t.text}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      {reasons.length > 0 && (
        <div className="creature-card__reasons">
          {reasons.map((r, i) => (
            <span key={i} className="creature-card__reason-tag">
              {r.field === 'fts' ? 'text match' :
               r.field === 'name' ? `named: ${r.db_value}` :
               r.field === 'type' ? `type: ${r.db_value}` :
               r.field === 'habitats' ? `habitat: ${r.term}` :
               r.field === 'traits' ? `trait: ${r.term}` :
               r.field === 'damage_types' ? `damage: ${r.query_value}` :
               r.field === 'movement_modes' ? `movement: ${r.query_value}` :
               r.field}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
