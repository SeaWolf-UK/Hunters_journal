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

## Rules
- Never expose ELEVENLABS_API_KEY to frontend
- Typed input must remain available as fallback
- The skull is the interface — do not regress to a conventional search dashboard
- Keep speech input, parsing, ranking, skull UI, storage, and TTS in separate modules
- Prefer 2D CSS animation over 3D
- Add unit tests for parser and ranking logic
