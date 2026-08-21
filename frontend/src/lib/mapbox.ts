const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export type GeocodeFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
};

export async function geocodeSearch(query: string, proximity?: [number, number]): Promise<GeocodeFeature[]> {
  if (!TOKEN || !query.trim()) return [];
  const params = new URLSearchParams({
    access_token: TOKEN,
    autocomplete: 'true',
    limit: '6',
    language: 'en',
  });
  if (proximity) params.set('proximity', `${proximity[0]},${proximity[1]}`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f: any) => ({
      id: f.id,
      place_name: f.place_name,
      text: f.text,
      center: f.center,
    }));
  } catch {
    return [];
  }
}

export type Directions = {
  duration: number; // seconds
  distance: number; // meters
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  steps: Array<{ maneuver: { instruction: string }; distance: number; duration: number }>;
};

export async function fetchDirections(
  origin: [number, number],
  destination: [number, number],
): Promise<Directions | null> {
  if (!TOKEN) return null;
  const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const params = new URLSearchParams({
    access_token: TOKEN,
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    annotations: 'duration,distance',
  });
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.routes?.[0];
    if (!r) return null;
    return {
      duration: r.duration,
      distance: r.distance,
      geometry: r.geometry,
      steps: r.legs?.[0]?.steps || [],
    };
  } catch {
    return null;
  }
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDurationMin(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h}h ${rest}m`;
}

export function etaClock(seconds: number): string {
  const arr = new Date(Date.now() + seconds * 1000);
  let h = arr.getHours();
  const m = arr.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
