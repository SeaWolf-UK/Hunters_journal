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

interface RankedMatch {
  creature_id: number;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: MatchReason[];
}

export function rankResults(matches: SearchMatch[]): RankedMatch[] {
  const ranked = matches.map(m => {
    let score = 0;

    for (const reason of m.match_reasons) {
      switch (reason.field) {
        case 'name':
          score += 100;
          break;
        case 'type':
          score += 40;
          break;
        case 'size':
          score += 25;
          break;
        case 'habitats':
          score += 25;
          break;
        case 'damage_types':
          score += 35;
          break;
        case 'status_effects':
          score += 30;
          break;
        case 'movement_modes':
          score += 20;
          break;
        case 'traits':
          score += 30;
          break;
        case 'fts':
          // FTS5 rank from bm25 — normalize into positive contribution
          if (reason.fts_rank && reason.fts_rank > -4) {
            score += 20 + Math.abs(reason.fts_rank) * 5;
          } else {
            score += 15;
          }
          break;
      }
    }

    return {
      creature_id: m.creature_id,
      score,
      confidence: score >= 100 ? 'high' as const : score >= 50 ? 'medium' as const : 'low' as const,
      reasons: m.match_reasons,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  const MIN_SCORE = 40;
  return ranked.filter(r => r.score >= MIN_SCORE).slice(0, 5);
}
