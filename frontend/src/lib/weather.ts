export type CurrentWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
};

const descriptions: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers', 95: 'Thunderstorm', 96: 'Storm', 99: 'Storm',
};

export async function fetchCurrentWeather(lng: number, lat: number): Promise<CurrentWeather | null> {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lng),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    timezone: 'auto',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    const current = data.current;
    if (!current) return null;
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      description: descriptions[current.weather_code] ?? 'Current conditions',
    };
  } catch {
    return null;
  }
}