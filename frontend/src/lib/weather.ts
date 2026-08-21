export type CurrentWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  locationName: string;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  dayLength: string;
  precipitationChance: number;
  hourly: { time: string; temperature: number; precipitationChance: number; weatherCode: number }[];
  forecast: { day: string; high: number; low: number; weatherCode: number }[];
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
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    forecast_days: '4',
    timezone: 'auto',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    if (!current || !daily || !hourly) return null;
    const locationName = await fetchLocationName(lng, lat);
    const dayNames = daily.time.map((value: string, index: number) => ({
      day: index === 0 ? 'Today' : new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
      weatherCode: daily.weather_code[index],
    }));
    const currentHourIndex = Math.max(0, hourly.time.findIndex((value: string) => new Date(value).getTime() >= Date.now() - 30 * 60 * 1000));
    const hourlyConditions = hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((value: string, index: number) => {
      const sourceIndex = currentHourIndex + index;
      return {
        time: value,
        temperature: Math.round(hourly.temperature_2m[sourceIndex]),
        precipitationChance: hourly.precipitation_probability[sourceIndex] ?? 0,
        weatherCode: hourly.weather_code[sourceIndex],
      };
    });
    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      description: descriptions[current.weather_code] ?? 'Current conditions',
      locationName,
      weatherCode: current.weather_code,
      sunrise: formatTime(daily.sunrise[0]),
      sunset: formatTime(daily.sunset[0]),
      dayLength: formatDayLength(daily.sunrise[0], daily.sunset[0]),
      precipitationChance: daily.precipitation_probability_max[0] ?? 0,
      hourly: hourlyConditions,
      forecast: dayNames,
    };
  } catch {
    return null;
  }
}

async function fetchLocationName(lng: number, lat: number): Promise<string> {
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await response.json();
    const city = data.city;
    const suburb = data.locality;
    const state = data.principalSubdivision;
    const locationParts = [suburb, city, state].filter((value, index, values) => value && values.indexOf(value) === index);
    return locationParts.length > 0 ? locationParts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export function weatherIcon(code: number): string {
  if (code === 0) return 'weather-sunny';
  if (code <= 3) return 'weather-partly-cloudy';
  if (code <= 48) return 'weather-fog';
  if (code <= 67 || code >= 80 && code <= 82) return 'weather-rainy';
  if (code <= 77) return 'weather-snowy';
  return 'weather-lightning-rainy';
}

function formatTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDayLength(sunrise: string, sunset: string): string {
  const minutes = Math.max(0, Math.round((new Date(sunset).getTime() - new Date(sunrise).getTime()) / 60000));
  return `${Math.floor(minutes / 60)} h ${minutes % 60} m`;
}