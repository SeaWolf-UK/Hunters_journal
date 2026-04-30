import { useState, useCallback } from 'react';
import { QueryResponse, SkullState } from '../types';
import { sendQuery } from '../api/client';

export function useQuery(onStateChange: (state: SkullState) => void) {
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    onStateChange('thinking');

    try {
      const result = await sendQuery(text);
      setResponse(result);
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
