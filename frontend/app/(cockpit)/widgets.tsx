import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { api, VehicleMetrics } from '@/src/api';
import { useUserLocation } from '@/src/hooks/use-user-location';
import { CurrentWeather, fetchCurrentWeather } from '@/src/lib/weather';
import { WeatherWidget } from '@/src/components/WeatherWidget';
import { ClimateWidget } from '@/src/components/ClimateWidget';
import { MusicPlayerWidget } from '@/src/components/MusicPlayerWidget';

export default function WidgetCollectionScreen() {
  const [metrics, setMetrics] = useState<VehicleMetrics | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [cabinTemperature, setCabinTemperature] = useState(21);
  const [climateActive, setClimateActive] = useState(true);
  const location = useUserLocation();

  useEffect(() => {
    api.vehicleMetrics().then(setMetrics).catch(() => {});
  }, []);

  useEffect(() => {
    if (!location.coords) return;
    fetchCurrentWeather(location.coords.lng, location.coords.lat).then(setWeather);
  }, [location.coords]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} testID="widget-collection-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>COCKPIT LIBRARY</Text>
          <Text style={styles.title}>WIDGET COLLECTION</Text>
        </View>
        <MaterialCommunityIcons name="view-dashboard-outline" size={32} color={theme.colors.brand} />
      </View>
      <Text style={styles.sectionLabel}>FULL WEATHER</Text>
      <View style={styles.fullWidget}><WeatherWidget weather={weather} fallbackTemperature={metrics?.outside_temp ?? 17} /></View>
      <Text style={styles.sectionLabel}>COMPACT WEATHER</Text>
      <View style={styles.compactWidget}><WeatherWidget compact weather={weather} fallbackTemperature={metrics?.outside_temp ?? 17} /></View>
      <Text style={styles.sectionLabel}>CABIN CLIMATE</Text>
      <View style={styles.compactWidget}>
        <ClimateWidget
          temperature={cabinTemperature}
          active={climateActive}
          onToggle={() => setClimateActive((value) => !value)}
          onDown={() => setCabinTemperature((value) => Math.max(16, value - 1))}
          onUp={() => setCabinTemperature((value) => Math.min(30, value + 1))}
          onTemperatureChange={setCabinTemperature}
        />
      </View>
      <Text style={styles.sectionLabel}>NOW PLAYING</Text>
      <View style={styles.musicWidget}><MusicPlayerWidget /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  content: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxxl, alignItems: 'flex-start' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
  eyebrow: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.accentCyan, letterSpacing: 2 },
  title: { fontFamily: theme.font.display, fontSize: 30, color: theme.colors.onSurface, letterSpacing: 2, marginTop: 3 },
  sectionLabel: { fontFamily: theme.font.textBold, fontSize: 11, color: theme.colors.onSurfaceSecondary, letterSpacing: 2, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  fullWidget: { width: 360 },
  compactWidget: { width: 360 },
  musicWidget: { width: 640, maxWidth: '100%' },
});