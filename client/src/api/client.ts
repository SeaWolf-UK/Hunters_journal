import { QueryResponse, Creature } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function sendQuery(text: string): Promise<QueryResponse> {
  return request<QueryResponse>('/query', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function getTtsAudio(text: string): Promise<Blob> {
  const res = await fetch(`${BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('TTS failed');
  return res.blob();
}

export async function listCreatures(): Promise<{ creatures: Creature[] }> {
  return request('/creatures');
}

export async function getCreature(id: number): Promise<{ creature: Creature }> {
  return request(`/creatures/${id}`);
}

export async function createCreature(data: Partial<Creature>): Promise<{ creature: Creature }> {
  return request('/creatures', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCreature(id: number, data: Partial<Creature>): Promise<{ creature: Creature }> {
  return request(`/creatures/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCreature(id: number): Promise<{ ok: boolean }> {
  return request(`/creatures/${id}`, { method: 'DELETE' });
}
