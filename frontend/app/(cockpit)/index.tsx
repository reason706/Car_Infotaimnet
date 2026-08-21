import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { LeftVehicleStatusPanel } from '@/src/components/LeftVehicleStatusPanel';
import { RightNavigationMapPanel } from '@/src/components/RightNavigationMapPanel';
import { api, VehicleMetrics } from '@/src/api';
import { useUserLocation } from '@/src/hooks/use-user-location';
import { CurrentWeather, fetchCurrentWeather } from '@/src/lib/weather';
import { WeatherWidget } from '@/src/components/WeatherWidget';
import { ClimateWidget } from '@/src/components/ClimateWidget';

export default function CockpitHome() {
  const [metrics, setMetrics] = useState<VehicleMetrics | null>(null);
  const [cabinTemp, setCabinTemp] = useState(21);
  const [climateOn, setClimateOn] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [gear, setGear] = useState<'P' | 'R' | 'N' | 'D'>('P');
  const location = useUserLocation();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () => api.vehicleMetrics().then((value) => { if (!cancelled) setMetrics(value); }).catch(() => {});
    tick();
    const interval = setInterval(tick, 1500);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!location.coords) return;
    fetchCurrentWeather(location.coords.lng, location.coords.lat).then(setWeather);
  }, [location.coords]);

  return (
    <View style={styles.root} testID="cockpit-home">
      {!mapExpanded && <>
        <View style={styles.left}>
          <LeftVehicleStatusPanel gear={gear} onGearChange={setGear} />
        </View>
        <View style={styles.gap} />
      </>}
      <View style={[styles.mapColumn, mapExpanded && styles.mapColumnExpanded]}>
        <RightNavigationMapPanel />
        <Pressable
          style={styles.mapExpandButton}
          onPress={() => setMapExpanded((value) => !value)}
          testID="btn-map-expand"
          accessibilityLabel={mapExpanded ? 'Minimize map' : 'Maximize map'}
        >
          <MaterialCommunityIcons name={mapExpanded ? 'fullscreen-exit' : 'fullscreen'} size={22} color={theme.colors.onSurfaceLight} />
        </Pressable>
        {mapExpanded && <ExpandedDriveOverlay speed={metrics?.speed_kmh ?? 0} gear={gear} />}
      </View>
      {!mapExpanded && <>
        <View style={styles.gap} />
        <View style={styles.widgetRail}>
          <WeatherWidget compact weather={weather} fallbackTemperature={metrics?.outside_temp ?? 17} />
          <ClimateWidget compact temperature={cabinTemp} active={climateOn} onToggle={() => setClimateOn((value) => !value)} onDown={() => setCabinTemp((value) => Math.max(16, value - 1))} onUp={() => setCabinTemp((value) => Math.min(30, value + 1))} onTemperatureChange={setCabinTemp} />
          <StatusWidget metrics={metrics} />
        </View>
      </>}
    </View>
  );
}

function ExpandedDriveOverlay({ speed, gear }: { speed: number; gear: string }) {
  return (
    <View style={styles.expandedDriveOverlay} pointerEvents="none" testID="expanded-drive-overlay">
      <Text style={styles.expandedLabel}>DRIVE</Text>
      <View style={styles.expandedSpeedRow}>
        <Text style={styles.expandedSpeed}>{Math.round(speed)}</Text>
        <Text style={styles.expandedUnit}>km/h</Text>
      </View>
      <View style={styles.expandedDivider} />
      <Text style={styles.expandedLabel}>GEAR</Text>
      <Text style={styles.expandedGear}>{gear}</Text>
    </View>
  );
}

function StatusWidget({ metrics }: { metrics: VehicleMetrics | null }) {
  return (
    <View style={styles.widget} testID="drive-status-widget">
      <View style={styles.widgetIcon}><MaterialCommunityIcons name="car-connected" size={24} color={theme.colors.success} /></View>
      <View style={styles.widgetCopy}>
        <Text style={styles.widgetLabel}>DRIVE STATUS</Text>
        <Text style={styles.statusValue}>{metrics ? `${Math.round(metrics.speed_kmh)} km/h` : 'Ready'}</Text>
        <Text style={styles.widgetHint}>{metrics ? `Battery ${metrics.battery_v.toFixed(1)} V` : 'OBD connected'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
  },
  left: {
    width: '26%',
    minWidth: 300,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  gap: { width: theme.spacing.sm },
  mapColumn: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  mapColumnExpanded: { borderRadius: 0 },
  mapExpandButton: { position: 'absolute', top: theme.spacing.md, right: theme.spacing.md, width: 46, height: 46, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFE6', zIndex: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 4 },
  expandedDriveOverlay: { position: 'absolute', left: theme.spacing.xl, top: '22%', width: 142, padding: theme.spacing.lg, borderRadius: theme.radius.lg, backgroundColor: 'rgba(12, 16, 22, 0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', zIndex: 35 },
  expandedLabel: { fontFamily: theme.font.textBold, fontSize: 10, color: '#AEB8C7', letterSpacing: 2 },
  expandedSpeedRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
  expandedSpeed: { fontFamily: theme.font.display, fontSize: 48, color: '#FFFFFF', lineHeight: 52 },
  expandedUnit: { fontFamily: theme.font.textBold, fontSize: 10, color: '#AEB8C7' },
  expandedDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: theme.spacing.md },
  expandedGear: { fontFamily: theme.font.display, fontSize: 54, color: theme.colors.brand, lineHeight: 58, marginTop: 2 },
  widgetRail: { width: 280, gap: theme.spacing.sm },
  widget: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  widgetIcon: { width: 42, height: 42, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceTertiary },
  widgetIconActive: { backgroundColor: '#EAF1FF' },
  widgetCopy: { flex: 1, minWidth: 0 },
  widgetLabel: { fontFamily: theme.font.textBold, fontSize: 9, color: theme.colors.onSurfaceSecondary, letterSpacing: 1.2 },
  widgetValue: { fontFamily: theme.font.display, fontSize: 29, color: theme.colors.onSurface, lineHeight: 32 },
  widgetUnit: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary },
  widgetHint: { fontFamily: theme.font.text, fontSize: 10, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  statusValue: { fontFamily: theme.font.displayMedium, fontSize: 21, color: theme.colors.onSurface, marginTop: 4 },
});
