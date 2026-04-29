# Session Recovery Document

**Created:** 2026-04-29 | **Status:** COMPLETE

## What Was Done

1. **5etools 2024 Bestiary Integration** — 522 creatures imported from XMM/XPHB/XDMG/XGE
2. **Search Quality Fix** — Stop word filtering, score floor, partial name matching, habitat alias cleanup

## Verification Results

| Query | Result | Score |
|-------|--------|-------|
| "small creature that wears a red hat" | 0 matches (correct) | - |
| "swamp predator with acid" | Adult Black Dragon | 60 |
| "red dragon" | Adult Red Dragon | 255 |
| "what breathes fire" | Adult Brass/Gold/Red Dragons | 65 |
| "undead that drains life" | Wight | 55 |
| "carrion crawler" | Carrion Crawler | 115 |

## Files Changed

- `server/src/db/import-5etools.ts` — rewrote to use fluff + CDN images
- `server/src/db/seed.ts` — deleted
- `server/src/db/generated-creatures.ts` — deleted
- `server/src/index.ts` — removed seedCreatures call
- `server/src/services/searcher.ts` — stop words, cleaned FTS5 input, partial name matching
- `server/src/services/ranker.ts` — MIN_SCORE=40 threshold
- `server/src/services/searcher.ts` — step 1b: raw query text as partial name match (fixes "carrion crawler" and any creature name not in hardcoded CREATURE_NAMES)
- `server/src/services/responder.ts` — low-confidence hedging
- `server/src/services/parser.ts` — habitat aliases updated for 5etools data
- `client/src/types/index.ts` — added image_url
- `client/src/components/CreatureCard.tsx` — CDN image with loading/error states
- `client/src/components/CreatureCard.css` — image + shimmer animation
- `CLAUDE.md` — creature data section

## To Resume

- App: `export PATH="$HOME/.local/nodejs/bin:$PATH" && npm run dev`
- Re-import: `rm server/journal.db && npx tsx server/src/db/import-5etools.ts`
