# Hunters Journal

A voice-first D&D web app. Players speak to an ancient, sarcastic, trapped undead sage — a skull — to identify creatures from partial clues.

The skull has been dead for centuries and deeply resents being woken by mediocre adventurers with vague questions. He is theatrical, verbose, and speaks like a Shakespearean actor forced to perform the same play for four hundred years. But he knows all 522 creatures in the 5etools bestiary.

## What It Does

- **Speak** to the skull (or type if you prefer)
- **Describe** a creature with partial clues — *"what breathes fire,"* *"swamp predator with acid breath,"* *"flying reptile with lightning"*
- The skull **identifies** the creature, gives you rich lore from 5etools, and insults you gently
- For vague queries, he **lists ALL matching creatures** grouped by type and demands more specifics
- He **asks follow-up questions** to narrow down ambiguous queries
- Optional: the skull can **speak aloud** via ElevenLabs TTS

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express + TypeScript
- **Database**: SQLite (pre-seeded with 522 creatures from 5etools v2.28.0)
- **AI**: Ollama (local LLM for intelligent creature identification)
- **Voice in**: Web Speech API
- **Voice out**: ElevenLabs TTS (optional, server-side proxy)

## Quick Start

### Windows

1. Download the [latest release](https://github.com/SeaWolf-UK/Hunters_journal/releases)
2. Extract the ZIP
3. Double-click **`launch.bat`**
   - If Node.js is missing, it opens the download page for you
   - If Ollama is missing, it opens the download page for you
   - It installs dependencies automatically
   - It downloads the AI model automatically (first run only, ~5-10 minutes)
   - It opens your browser automatically when ready

### Linux

1. Clone or download the repo
2. Install Node.js (if not present): `export PATH="$HOME/.local/nodejs/bin:$PATH"`
3. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
4. Pull the model: `ollama pull deepseek-v4-pro:cloud`
5. Run `npm install`
6. Copy `.env.example` to `.env`
7. Double-click the **Hunters Journal** desktop icon (or run `./launch.sh`)

### macOS

1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Install Ollama: `brew install ollama` or download from [ollama.com](https://ollama.com)
3. Pull the model: `ollama pull deepseek-v4-pro:cloud`
4. Run `npm install`
5. Copy `.env.example` to `.env`
6. Run `npm run dev` and open `http://localhost:5173`

## How to Use

### Ask the Skull
- Click the microphone button (or hold spacebar) and speak
- Or click the keyboard icon to type
- Describe the creature with any clues you have:
  - **Specific**: *"Tell me about a dragon turtle"*
  - **Vague**: *"What breathes fire"*
  - **Clue-based**: *"Swamp predator with acid breath"*
  - **Behavioral**: *"Creature that turns you to stone with its gaze"*

### The Skull's Personality
- **Theatrical**: He opens with stage directions — *"The eye sockets flare with faint violet light"*
- **Verbose**: He gives rich, detailed descriptions from the 5etools lore
- **Sarcastic**: He complains when your clues are vague
- **Conversational**: He asks follow-up questions to narrow down ambiguous queries
- **Deeply tired**: *"Centuries. I have rested for centuries. And YOU rattle my bones with half-remembered tavern gossip."*

### For Vague Queries
If you ask something broad like *"What breathes fire?"* the skull will:
1. Complain theatrically about your imprecision
2. List **all** matching creatures grouped by type (Dragon, Elemental, Monstrosity, etc.)
3. Demand more specifics: *"Was it flying? Swimming? Did it have horns, tentacles, or a crown of bone?"*

### Evidence Panel
Below the skull's reply, click *"Why do I say this?"* to see:
- Which creatures matched your query
- Why they matched (name, type, description, traits)
- How confident the skull is

## Configuration

Copy `.env.example` to `.env` and set:

```env
# Optional: ElevenLabs TTS (voice output)
# Get a key at https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=TxGEqnHWrfWFTfGW9XeX

# Ollama config (AI-powered identification)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=deepseek-v4-pro:cloud

# Server port
PORT=3001
```

**The app works fully without ElevenLabs.** The skull will reply in text. Adding an ElevenLabs key makes him speak aloud.

## Architecture

```
User Query
  → Parser (extracts keywords, aliases, creature names)
  → SQLite FTS5 (retrieves top 10 candidate creatures)
  → Ollama LLM (re-ranks + generates theatrical skull response)
  → Skull UI
```

If Ollama is unavailable, the app falls back to a rule-based ranker + responder so it never breaks completely.

## Troubleshooting

### "Port 3001/5173 already in use"
The `launch.bat` (Windows) and `launch.sh` (Linux) automatically kill stale servers. If running manually:
- Windows: `taskkill /f /im node.exe`
- Linux: `pkill -f "tsx watch"`

### "Ollama not responding"
Make sure Ollama is running:
- Windows: it should start automatically via `launch.bat`
- Linux/macOS: run `ollama serve` in a terminal

### "npm install fails"
You need Node.js v18+. Check with `node --version`.

### The skull gives old/dry responses
This was fixed in v0.23.2 by removing client-side `localStorage` caching. Every query now hits the server fresh.

## Creature Data

- Source: 5etools v2.28.0 (2024 rules: XMM, XPHB, XDMG, XGE)
- 522 creatures with full lore, descriptions, traits, habitats
- Combat stats (AC, HP, abilities) are intentionally zeroed — this is a lore tool, not a combat simulator
- Images served from 5e.tools CDN

## License

Creature data © Wizards of the Coast. Used under fair use for personal D&D play.
Code is open source.
