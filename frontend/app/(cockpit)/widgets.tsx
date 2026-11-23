import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, SectionHeader, Text, colors, spacing } from '@/src/ui';
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
      <SectionHeader
        size="screen"
        eyebrow="COCKPIT LIBRARY"
        title="WIDGET COLLECTION"
        right={<Icon name="view-dashboard-outline" size="xxl" color="brand" />}
        style={styles.header}
      />
      <Text variant="section" color="onSurfaceSecondary" style={styles.sectionLabel}>FULL WEATHER</Text>
      <View style={styles.fullWidget}><WeatherWidget weather={weather} fallbackTemperature={metrics?.outside_temp ?? 17} /></View>
      <Text variant="section" color="onSurfaceSecondary" style={styles.sectionLabel}>COMPACT WEATHER</Text>
      <View style={styles.compactWidget}><WeatherWidget compact weather={weather} fallbackTemperature={metrics?.outside_temp ?? 17} /></View>
      <Text variant="section" color="onSurfaceSecondary" style={styles.sectionLabel}>CABIN CLIMATE</Text>
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
      <Text variant="section" color="onSurfaceSecondary" style={styles.sectionLabel}>NOW PLAYING</Text>
      <View style={styles.musicWidget}><MusicPlayerWidget /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, alignItems: 'flex-start' },
  header: { width: '100%', marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.md },
  fullWidget: { width: 360 },
  compactWidget: { width: 360 },
  musicWidget: { width: 640, maxWidth: '100%' },
});
