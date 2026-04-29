import { useState, useEffect, useRef, useCallback } from 'react';
import { getTtsAudio } from '../api/client';
import { SkullState } from '../types';
import './ResponsePanel.css';

interface ResponsePanelProps {
  answer: string;
  onStateChange: (state: SkullState) => void;
  hasTtsKey: boolean;
}

export default function ResponsePanel({ answer, onStateChange, hasTtsKey }: ResponsePanelProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const jawIntervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);
    setTtsError(false);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      indexRef.current++;
      setDisplayedText(answer.slice(0, indexRef.current));

      if (indexRef.current >= answer.length) {
        clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, 20);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [answer]);

  const skipTyping = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText(answer);
    setIsTyping(false);
  }, [answer]);

  const playTts = useCallback(async () => {
    if (!hasTtsKey || ttsError) return;

    try {
      const blob = await getTtsAudio(answer);
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        onStateChange('speaking');

        // Jaw sync: toggle jaw class via CSS animation speed change
        // Skull.tsx already handles speaking state animation
      };

      audio.onended = () => {
        setIsPlaying(false);
        onStateChange('idle');
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setTtsError(true);
        setIsPlaying(false);
        onStateChange('idle');
      };

      await audio.play();
    } catch {
      setTtsError(true);
    }
  }, [answer, hasTtsKey, ttsError, onStateChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return (
    <div className="response-panel" onClick={skipTyping}>
      <div className="response-panel__text">
        <span className="response-panel__label">The Skull says:</span>
        <p>{displayedText}<span className={`cursor ${isTyping ? 'cursor--blink' : ''}`}>|</span></p>
      </div>
      {hasTtsKey && !ttsError && (
        <button
          className={`response-panel__play ${isPlaying ? 'response-panel__play--playing' : ''}`}
          onClick={(e) => { e.stopPropagation(); playTts(); }}
          title={isPlaying ? 'Speaking...' : 'Play voice'}
          disabled={isTyping}
        >
          {isPlaying ? <SpeakerActiveIcon /> : <SpeakerIcon />}
        </button>
      )}
      {ttsError && (
        <span className="response-panel__tts-error">Voice unavailable</span>
      )}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}

function SpeakerActiveIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" fill="var(--accent-glow)" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}
