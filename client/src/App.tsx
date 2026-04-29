import { useState, useEffect } from 'react';
import Skull from './components/Skull';
import InputBar from './components/InputBar';
import ResponsePanel from './components/ResponsePanel';
import EvidencePanel from './components/EvidencePanel';
import AdminPanel from './components/AdminPanel';
import AmbientBackground from './components/AmbientBackground';
import { useSkullState } from './hooks/useSkullState';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useQuery } from './hooks/useQuery';

const QUICK_SUGGESTIONS = [
  'What breathes fire?',
  'Swamp predator with acid',
  'Undead that drains life',
  'Flying reptile with lightning',
];

export default function App() {
  const { state, transition } = useSkullState();
  const { response, loading, error, query, clear } = useQuery(transition);
  const speech = useSpeechRecognition();
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasTtsKey, setHasTtsKey] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setHasTtsKey(d.ttsConfigured))
      .catch(() => {});
  }, []);

  const handleQuery = (text: string) => {
    query(text);
  };

  const handleMicStart = () => {
    speech.startListening();
    transition('listening');
  };

  const handleMicStop = () => {
    speech.stopListening();
    // Speech recognition will finalize and trigger query via InputBar
  };

  return (
    <div className="app">
      <AmbientBackground />

      {/* Admin toggle */}
      <button
        className="app__admin-toggle"
        onClick={() => setShowAdmin(prev => !prev)}
        title="Manage creatures"
      >
        <GearIcon />
      </button>

      {/* Skull */}
      <div className="app__skull-area">
        <Skull
          state={state}
          onAppearDone={() => transition('idle')}
          onTalkDone={() => transition('idle')}
        />
      </div>

      {/* Response */}
      {response && (
        <div className="app__response-area">
          <ResponsePanel
            answer={response.answer}
            onStateChange={transition}
            hasTtsKey={hasTtsKey}
          />
          <EvidencePanel matches={response.matches} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="app__error">
          <p>The skull falters. {error}</p>
          <button onClick={clear}>Try again</button>
        </div>
      )}

      {/* Quick suggestions when idle */}
      {!response && !loading && state !== 'appearing' && (
        <div className="app__suggestions">
          <p className="app__suggestions-hint">Try asking:</p>
          <div className="app__suggestions-chips">
            {QUICK_SUGGESTIONS.map(s => (
              <button key={s} className="chip" onClick={() => query(s)} disabled={loading}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <InputBar
        onQuery={handleQuery}
        isListening={speech.isListening}
        onStartListening={handleMicStart}
        onStopListening={handleMicStop}
        transcript={speech.transcript}
        interimTranscript={speech.interimTranscript}
        speechSupported={speech.supported}
        disabled={loading || state === 'appearing'}
      />

      {/* Admin panel */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
