import { useRef, useEffect, useState, useCallback } from 'react';
import { SkullState } from '../types';

interface SkullProps {
  state: SkullState;
  onAppearDone: () => void;
  onTalkDone: () => void;
}

export default function Skull({ state, onAppearDone, onTalkDone }: SkullProps) {
  const appearRef = useRef<HTMLVideoElement>(null);
  const talkRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [skullHeight, setSkullHeight] = useState(220);

  // Dynamically compute skull height from window size
  const updateSize = useCallback(() => {
    const h = window.innerHeight;
    const w = window.innerWidth;
    // Use the smaller of: 22% of height, or 28% of width (for aspect), with sane bounds
    const fromHeight = h * 0.22;
    const fromWidth = w * 0.28;
    const size = Math.min(fromHeight, fromWidth);
    setSkullHeight(Math.round(Math.max(120, Math.min(220, size))));
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  // Handle appear video
  useEffect(() => {
    const video = appearRef.current;
    if (!video) return;
    if (state === 'appearing') {
      video.currentTime = 0;
      video.play().catch(() => {});
      video.style.display = 'block';
    } else {
      video.pause();
      video.style.display = 'none';
    }
  }, [state]);

  // Handle talk video
  useEffect(() => {
    const video = talkRef.current;
    if (!video) return;
    if (state === 'speaking') {
      video.currentTime = 0;
      video.style.display = 'block';
      video.play().catch(() => {});
    } else {
      video.pause();
      video.style.display = 'none';
    }
  }, [state]);

  const showStatic = state !== 'appearing' && state !== 'speaking';

  return (
    <div className="skull" ref={containerRef}>
      <div className="skull__media" style={{ height: skullHeight }}>
        <video
          ref={appearRef}
          className="skull__video"
          src="/assets/Skull_appear.mp4"
          muted
          playsInline
          preload="auto"
          width={skullHeight}
          height={skullHeight}
          style={{ display: state === 'appearing' ? 'block' : 'none' }}
          onEnded={onAppearDone}
        />
        <video
          ref={talkRef}
          className="skull__video"
          src="/assets/Skull_talk.mp4"
          muted
          playsInline
          preload="auto"
          loop
          width={skullHeight}
          height={skullHeight}
          style={{ display: state === 'speaking' ? 'block' : 'none' }}
        />
        <img
          className={`skull__image ${state === 'listening' ? 'skull__image--listening' : ''} ${state === 'thinking' ? 'skull__image--thinking' : ''} ${state === 'confused' ? 'skull__image--confused' : ''}`}
          src="/assets/Skull_static.png"
          alt=""
          width={skullHeight}
          height={skullHeight}
          style={{ display: showStatic ? 'block' : 'none' }}
        />
      </div>

      {state === 'listening' && (
        <div className="skull__waveform">
          <div className="skull__waveform-ring ring-1" />
          <div className="skull__waveform-ring ring-2" />
          <div className="skull__waveform-ring ring-3" />
        </div>
      )}
      {state === 'confused' && (
        <div className="skull__question-marks">
          <span className="skull__qm qm-1">?</span>
          <span className="skull__qm qm-2">?</span>
        </div>
      )}
    </div>
  );
}
