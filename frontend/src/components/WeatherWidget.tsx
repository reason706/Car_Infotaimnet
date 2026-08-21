import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/src/theme';
import { CurrentWeather } from '@/src/lib/weather';

type Props = { weather: CurrentWeather | null; fallbackTemperature: number; compact?: boolean };

export function WeatherWidget({ weather, fallbackTemperature, compact = false }: Props) {
  const [now, setNow] = React.useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const temperature = Math.round(weather?.temperature ?? fallbackTemperature);
  const forecast = weather?.forecast ?? [
    { day: 'Today', high: temperature, low: temperature - 5, weatherCode: 2 },
    { day: 'Fri', high: temperature + 1, low: temperature - 4, weatherCode: 61 },
    { day: 'Sat', high: temperature + 2, low: temperature - 3, weatherCode: 2 },
    { day: 'Sun', high: temperature + 3, low: temperature - 2, weatherCode: 0 },
  ];
  const hourly = weather?.hourly ?? [];

  return (
    <LinearGradient colors={['#3A3897', '#2C2A72', '#1A1A4E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.widget, compact && styles.widgetCompact]} testID={compact ? 'weather-widget-compact' : 'weather-widget'}>
      <View style={[styles.content, compact && styles.contentCompact]}>
        <Text style={styles.dateTime}>{now.toLocaleDateString(undefined, { weekday: 'long' })}, {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
        {compact && <View style={styles.sunRow}>
          <View style={styles.sunItem}><Text style={styles.sunEmoji}>☀️</Text><Text style={styles.sunText}>{weather?.sunrise ?? '--'}</Text></View>
          <View style={styles.dayLength}><Text style={styles.sunLabel}>{compact ? (weather?.locationName ?? 'Current location') : (weather?.dayLength ?? 'DAYLIGHT')}</Text><Text style={styles.sunSub}>{compact ? 'Location' : 'Day length'}</Text></View>
          <View style={styles.sunItem}><Text style={styles.sunEmoji}>🌙</Text><Text style={styles.sunText}>{weather?.sunset ?? '--'}</Text></View>
        </View>}
        <View style={styles.currentRow}>
          <View style={styles.temperatureGroup}>
            <Text style={styles.temperature}>{temperature}</Text>
            <View style={styles.temperatureUnit}>
              <Text style={styles.degree}>°</Text>
              <Text style={styles.celsius}>C</Text>
            </View>
          </View>
          <Text style={styles.currentCondition}>{weatherCondition(weather?.weatherCode ?? 2)}</Text>
          <Text style={styles.currentEmoji}>{weatherEmoji(weather?.weatherCode ?? 2)}</Text>
        </View>
        {!compact && <Text style={styles.location}>{weather?.locationName ?? 'Current location'}</Text>}

        {!compact && <View style={styles.sunRow}>
          <View style={styles.sunItem}><Text style={styles.sunEmoji}>☀️</Text><Text style={styles.sunText}>{weather?.sunrise ?? '--'}</Text></View>
          <View style={styles.dayLength}><Text style={styles.sunLabel}>{weather?.dayLength ?? 'DAYLIGHT'}</Text><Text style={styles.sunSub}>Day length</Text></View>
          <View style={styles.sunItem}><Text style={styles.sunEmoji}>🌙</Text><Text style={styles.sunText}>{weather?.sunset ?? '--'}</Text></View>
        </View>}

        <View style={styles.precipitation}>
          <Text style={styles.conditionsTitle}>Conditions (Temperature °C)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyRow}>
            {hourly.length > 0 ? hourly.map((item, index) => <HourlyCondition key={item.time} item={item} isNow={index === 0} />) : <Text style={styles.hourlyEmpty}>Hourly conditions unavailable</Text>}
          </ScrollView>
        </View>
        <View style={styles.details}><Text style={styles.detailText}>Humidity {weather?.humidity ?? '--'}%</Text><Text style={styles.detailText}>Wind {weather?.windSpeed ?? '--'} km/h</Text></View>

        {!compact && <View style={styles.forecast}>
          {forecast.map((item) => <Pressable key={item.day} style={styles.forecastDay} testID={`weather-${item.day.toLowerCase()}`}>
            <Text style={styles.forecastName}>{item.day}</Text>
            <Text style={styles.forecastEmoji}>{weatherEmoji(item.weatherCode)}</Text>
            <Text style={styles.forecastHigh}>{item.high}°</Text>
            <Text style={styles.forecastLow}>{item.low}°</Text>
          </Pressable>)}
        </View>}
      </View>
    </LinearGradient>
  );
}

function HourlyCondition({ item, isNow }: { item: { time: string; temperature: number; precipitationChance: number; weatherCode: number }; isNow: boolean }) {
  const time = isNow ? 'Now' : new Date(item.time).toLocaleTimeString([], { hour: 'numeric' });
  return (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{time}</Text>
      <Text style={styles.hourlyEmoji}>{weatherEmoji(item.weatherCode)}</Text>
      <Text style={styles.hourlyTemp}>{item.temperature}°</Text>
    </View>
  );
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67 || code >= 80 && code <= 82) return '🌧️';
  if (code <= 77) return '🌨️';
  return '⛈️';
}

function weatherCondition(code: number): string {
  if (code === 0) return 'Sunny';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Cloudy';
  if (code <= 67 || code >= 80 && code <= 82) return 'Rainy';
  if (code <= 77) return 'Snowy';
  return 'Stormy';
}

const styles = StyleSheet.create({
  widget: { height: 410, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', position: 'relative', shadowColor: '#090A0C', shadowOpacity: 0.28, shadowRadius: 16, elevation: 6 },
  widgetCompact: { height: 318 },
  content: { padding: 16, zIndex: 2 },
  contentCompact: { padding: 14 },
  dateTime: { fontFamily: theme.font.text, fontSize: 12, color: 'rgba(255,255,255,0.78)', letterSpacing: 0.5 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.24)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxWidth: '78%' },
  locationCardIcon: { fontFamily: theme.font.textBold, fontSize: 15, color: '#FFFFFF' },
  locationCardText: { flex: 1, fontFamily: theme.font.textBold, fontSize: 10, color: '#FFFFFF' },
  currentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  temperatureGroup: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  currentEmoji: { fontSize: 42, lineHeight: 50 },
  temperature: { fontFamily: theme.font.display, fontSize: 44, color: '#FFFFFF', lineHeight: 50, flexShrink: 1 },
  temperatureUnit: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 3, marginTop: 5 },
  degree: { fontFamily: theme.font.textBold, fontSize: 11, lineHeight: 13, color: '#D7D9F4' },
  celsius: { fontFamily: theme.font.textBold, fontSize: 14, lineHeight: 17, color: '#D7D9F4' },
  currentCondition: { fontFamily: theme.font.displayMedium, fontSize: 15, color: '#F0F2FF', textAlign: 'center', flexShrink: 1 },
  location: { fontFamily: theme.font.displayMedium, fontSize: 17, color: '#F0F2FF', marginTop: 0, letterSpacing: 0.3 },
  sunRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: 10, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.26)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sunItem: { alignItems: 'center', gap: 1 },
  sunEmoji: { fontSize: 20, lineHeight: 23 },
  sunText: { fontFamily: theme.font.text, fontSize: 9, color: '#FFFFFF' },
  dayLength: { alignItems: 'center', flex: 1 },
  sunLabel: { fontFamily: theme.font.textBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 0.5 },
  sunSub: { fontFamily: theme.font.text, fontSize: 8, color: '#FFFFFF', textAlign: 'center', marginTop: 2 },
  precipitation: { marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  conditionsTitle: { fontFamily: theme.font.textBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 0.4 },
  hourlyRow: { gap: 12, paddingTop: 9 },
  hourlyItem: { width: 42, alignItems: 'center', gap: 1 },
  hourlyTime: { fontFamily: theme.font.textBold, fontSize: 9, color: '#E4E5F8' },
  hourlyEmoji: { fontSize: 17, lineHeight: 21 },
  hourlyTemp: { fontFamily: theme.font.displayMedium, fontSize: 13, color: '#FFFFFF' },
  hourlyEmpty: { fontFamily: theme.font.text, fontSize: 9, color: '#D7D9F4', paddingTop: 8 },
  details: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 },
  detailText: { fontFamily: theme.font.text, fontSize: 10, color: '#FFFFFF' },
  forecast: { flexDirection: 'row', gap: 6, marginTop: 12 },
  forecastDay: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 1 },
  forecastName: { fontFamily: theme.font.textBold, fontSize: 9, color: '#E4E5F8' },
  forecastEmoji: { fontSize: 22, lineHeight: 27 },
  forecastHigh: { fontFamily: theme.font.displayMedium, fontSize: 14, color: '#FFFFFF' },
  forecastLow: { fontFamily: theme.font.text, fontSize: 10, color: '#C7C9E0' },
});