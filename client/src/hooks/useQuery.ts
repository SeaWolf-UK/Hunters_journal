import { useState, useCallback, useRef } from 'react';
import { QueryResponse, SkullState } from '../types';
import { sendQuery } from '../api/client';

const CACHE_KEY = 'hj_query_cache';

function loadCache(): Record<string, QueryResponse> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, QueryResponse>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

export function useQuery(onStateChange: (state: SkullState) => void) {
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef(loadCache());

  const query = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const normalized = text.trim().toLowerCase();

    // Check cache
    if (cacheRef.current[normalized]) {
      setResponse(cacheRef.current[normalized]);
      onStateChange('speaking');
      return;
    }

    setLoading(true);
    setError(null);
    onStateChange('thinking');

    try {
      const result = await sendQuery(text);
      setResponse(result);

      // Cache it
      cacheRef.current[normalized] = result;
      saveCache(cacheRef.current);

      onStateChange(result.matches.length > 0 ? 'speaking' : 'confused');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
      onStateChange('confused');
    } finally {
      setLoading(false);
    }
  }, [onStateChange]);

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
    onStateChange('idle');
  }, [onStateChange]);

  return { response, loading, error, query, clear };
}
