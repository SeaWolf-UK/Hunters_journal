import { MatchResult } from '../types';
import CreatureCard from './CreatureCard';
import './EvidencePanel.css';

interface EvidencePanelProps {
  matches: MatchResult[];
}

export default function EvidencePanel({ matches }: EvidencePanelProps) {
  if (matches.length === 0) return null;

  return (
    <div className="evidence-panel">
      <details className="evidence-panel__details">
        <summary className="evidence-panel__summary">
          Why do I say this? ({matches.length} creature{matches.length > 1 ? 's' : ''} found)
        </summary>
        <div className="evidence-panel__list">
          {matches.map((match) => (
            <CreatureCard key={match.creature.id} match={match} />
          ))}
        </div>
      </details>
    </div>
  );
}
