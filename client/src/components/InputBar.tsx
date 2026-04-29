import { useState, useEffect, useCallback, useRef } from 'react';
import './InputBar.css';

interface InputBarProps {
  onQuery: (text: string) => void;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  transcript: string;
  interimTranscript: string;
  speechSupported: boolean;
  disabled: boolean;
}

export default function InputBar({
  onQuery,
  isListening,
  onStartListening,
  onStopListening,
  transcript,
  interimTranscript,
  speechSupported,
  disabled,
}: InputBarProps) {
  const [textInput, setTextInput] = useState('');
  const [useTextFallback, setUseTextFallback] = useState(false);
  const spaceHeldRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Submit text when recognized or typed
  const submitText = useCallback((text: string) => {
    if (text.trim() && !disabled) {
      onQuery(text.trim());
    }
  }, [onQuery, disabled]);

  // When transcript finalizes after stopping listening
  useEffect(() => {
    if (!isListening && transcript) {
      submitText(transcript);
    }
  }, [isListening, transcript, submitText]);

  // Spacebar push-to-talk
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !spaceHeldRef.current && !disabled && speechSupported && !useTextFallback) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        spaceHeldRef.current = true;
        onStartListening();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && spaceHeldRef.current) {
        spaceHeldRef.current = false;
        onStopListening();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onStartListening, onStopListening, disabled, speechSupported, useTextFallback]);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      submitText(textInput);
      setTextInput('');
    }
  };

  const toggleTextFallback = () => {
    setUseTextFallback(prev => {
      if (!prev) inputRef.current?.focus();
      return !prev;
    });
  };

  return (
    <div className="input-bar">
      {useTextFallback ? (
        <div className="input-bar__text">
          <input
            ref={inputRef}
            type="text"
            className="input-bar__input"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
            placeholder="Ask the skull..."
            disabled={disabled}
            autoFocus
          />
          <button className="input-bar__btn" onClick={handleTextSubmit} disabled={disabled || !textInput.trim()}>
            Ask
          </button>
          {speechSupported && (
            <button className="input-bar__toggle" onClick={toggleTextFallback} title="Use voice">
              <MicIcon />
            </button>
          )}
        </div>
      ) : (
        <div className="input-bar__voice">
          {speechSupported ? (
            <>
              <button
                className={`input-bar__mic ${isListening ? 'input-bar__mic--active' : ''}`}
                onClick={isListening ? onStopListening : onStartListening}
                disabled={disabled}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                <MicIcon active={isListening} />
              </button>
              <p className="input-bar__hint">
                {isListening ? 'Listening...' : 'Click mic or hold spacebar to speak'}
              </p>
              {isListening && interimTranscript && (
                <p className="input-bar__interim">{interimTranscript}</p>
              )}
              <button className="input-bar__toggle" onClick={toggleTextFallback} title="Type instead">
                <KeyboardIcon />
              </button>
            </>
          ) : (
            <div className="input-bar__fallback-msg">
              <p>Speech recognition not available in this browser.</p>
              <button className="input-bar__btn" onClick={toggleTextFallback}>
                Type your question instead
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MicIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#ff4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill={active ? '#ff444433' : 'none'} />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 12h.01M6 16h12" />
    </svg>
  );
}
