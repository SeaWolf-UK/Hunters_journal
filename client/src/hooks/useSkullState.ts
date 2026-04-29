import { useState, useCallback, useEffect, useRef } from 'react';
import { SkullState } from '../types';

export function useSkullState() {
  const [state, setState] = useState<SkullState>('appearing');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const transition = useCallback((next: SkullState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(next);

    if (next === 'confused') {
      timerRef.current = setTimeout(() => setState('idle'), 4000);
    }
    // speaking auto-resolves via callback from Skull component
  }, []);

  // Re-trigger appear on tab wake
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        setState('appearing');
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { state, transition };
}
