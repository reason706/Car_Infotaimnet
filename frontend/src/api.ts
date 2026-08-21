const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function json<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, opts);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export type Track = { id: string; title: string; artist: string; album: string; duration: number; artwork: string; genre: string; streamUrl?: string };
export type Video = { id: string; title: string; channel: string; duration: number; thumbnail: string; category: string };
export type Contact = { id: string; name: string; phone: string; avatar?: string; favorite: boolean };
export type CallLog = { id: string; contact_id?: string; name: string; phone: string; direction: 'incoming' | 'outgoing' | 'missed'; duration: number; timestamp: string };
export type Destination = { id: string; name: string; address: string; distance_km: number; eta_minutes: number; category: string };
export type VehicleMetrics = {
  speed_kmh: number; rpm: number; fuel_percent: number; engine_temp: number; battery_v: number;
  range_km: number; odometer: number; trip_distance: number; trip_avg_speed: number; trip_fuel_used: number;
  outside_temp: number; tire_pressure: number[];
};
export type VoiceIntent = { transcript: string; intent: string; target?: string | null };

export const api = {
  tracks: () => json<Track[]>('/media/tracks'),
  videos: () => json<Video[]>('/media/videos'),
  contacts: () => json<Contact[]>('/contacts'),
  callLogs: () => json<CallLog[]>('/call-logs'),
  addCallLog: (data: { contact_id?: string; name: string; phone: string; direction: string; duration: number }) =>
    json<CallLog>('/call-logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  destinations: () => json<Destination[]>('/navigation/destinations'),
  searchDestinations: (query: string) =>
    json<Destination[]>('/navigation/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }),
  vehicleMetrics: () => json<VehicleMetrics>('/vehicle/metrics'),
  voiceCommandText: (text: string) => {
    const form = new FormData();
    form.append('text', text);
    return fetch(`${BASE}/api/voice/command`, { method: 'POST', body: form }).then(r => r.json()) as Promise<VoiceIntent>;
  },
  voiceCommandAudio: (uri: string) => {
    const form = new FormData();
    // @ts-ignore RN FormData file
    form.append('audio', { uri, name: 'command.m4a', type: 'audio/m4a' });
    return fetch(`${BASE}/api/voice/command`, { method: 'POST', body: form }).then(r => r.json()) as Promise<VoiceIntent>;
  },
};
