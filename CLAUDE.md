# Hunters Journal

Voice-first D&D web app. Players speak to an animated skull character to identify creatures from partial clues.

## Identity
- Primary user: player in a D&D campaign
- Primary interface: animated skull (not a search form)
- Primary input: speech (typed is fallback only)
- The skull is an RPG character (ancient, sarcastic, trapped undead sage), not a generic assistant
- Creature data is local, not in a hosted API

## Stack
- Frontend: React 18 + TypeScript + Vite (`client/`)
- Backend: Express + TypeScript (`server/`)
- Database: SQLite via better-sqlite3 with FTS5
- Voice in: Web Speech API
- Voice out: ElevenLabs TTS (server-side proxy)

## Running
```bash
# Ensure node in PATH
export PATH="$HOME/.local/nodejs/bin:$PATH"

# Copy .env and set ELEVENLABS_API_KEY for voice output
cp .env.example .env

# Start dev (both servers)
npm run dev
```

## Creature Data
- Source: 5etools v2.28.0 2024 rules bestiary (XMM, XPHB, XDMG, XGE)
- 522 creatures stored in SQLite with FTS5 full-text search
- Descriptions are rich fluff/lore text from official sourcebooks (not auto-generated)
- Combat stat blocks are intentionally excluded (AC, HP, abilities are zeroed/empty)
- Creature images served from 5e.tools CDN: `https://5e.tools/img/bestiary/{SOURCE}/{Name}.webp`
- To re-import: ensure 5etools source data at `/tmp/5etools-src/`, then run:
  ```bash
  npx tsx server/src/db/import-5etools.ts
  ```
- The `journal.db` file ships pre-seeded with creature data

## Rules
- Never expose ELEVENLABS_API_KEY to frontend
- Typed input must remain available as fallback
- The skull is the interface — do not regress to a conventional search dashboard
- Keep speech input, parsing, ranking, skull UI, storage, and TTS in separate modules
- Prefer 2D CSS animation over 3D
- Add unit tests for parser and ranking logic
