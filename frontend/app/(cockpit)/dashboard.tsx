import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { Gauge } from '@/src/components/Gauge';
import { api, VehicleMetrics } from '@/src/api';

export default function DashboardScreen() {
  const [m, setM] = useState<VehicleMetrics | null>(null);

  useEffect(() => {
    let cancel = false;
    const tick = () => api.vehicleMetrics().then((v) => { if (!cancel) setM(v); }).catch(() => {});
    tick();
    const iv = setInterval(tick, 800);
    return () => { cancel = true; clearInterval(iv); };
  }, []);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.root} testID="dashboard-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>VEHICLE DASHBOARD</Text>
          <Text style={styles.sub}>OBD-II Simulated · Live Metrics</Text>
        </View>
        <View style={styles.connBadge} testID="obd-status">
          <View style={styles.connDot} />
          <Text style={styles.connText}>OBD-II CONNECTED</Text>
        </View>
      </View>

      <View style={styles.gaugesRow}>
        <View style={styles.gaugeCard}>
          <Gauge
            testID="gauge-speed"
            value={m?.speed_kmh ?? 0}
            max={220}
            label="km/h"
            unit="SPEED"
            warnFrom={140}
            redFrom={180}
            size={240}
          />
        </View>
        <View style={styles.gaugeCard}>
          <Gauge
            testID="gauge-rpm"
            value={m?.rpm ?? 0}
            max={8000}
            label="× RPM"
            unit="ENGINE"
            warnFrom={5500}
            redFrom={7000}
            size={240}
            format={(v) => (v / 1000).toFixed(1)}
          />
        </View>
        <View style={styles.gaugeCard}>
          <Gauge
            testID="gauge-fuel"
            value={m?.fuel_percent ?? 0}
            max={100}
            label="fuel"
            unit="TANK"
            size={240}
            format={(v) => `${Math.round(v)}%`}
          />
        </View>
      </View>

      <View style={styles.tripRow}>
        <TripBlock icon="road-variant" label="ODOMETER" value={m ? m.odometer.toLocaleString() : '--'} unit="km" />
        <TripBlock icon="map-marker-distance" label="TRIP" value={m ? m.trip_distance.toFixed(1) : '--'} unit="km" />
        <TripBlock icon="speedometer-medium" label="AVG SPEED" value={m ? m.trip_avg_speed.toFixed(0) : '--'} unit="km/h" />
        <TripBlock icon="gas-station" label="FUEL USED" value={m ? m.trip_fuel_used.toFixed(2) : '--'} unit="L" />
        <TripBlock icon="thermometer" label="ENGINE" value={m ? m.engine_temp.toFixed(0) : '--'} unit="°C" />
        <TripBlock icon="battery" label="BATTERY" value={m ? m.battery_v.toFixed(1) : '--'} unit="V" />
      </View>

      <View style={styles.tireCard} testID="tire-card">
        <Text style={styles.tireHead}>TIRE PRESSURE</Text>
        <View style={styles.tireGrid}>
          {['FL', 'FR', 'RL', 'RR'].map((pos, i) => (
            <View key={pos} style={styles.tireBox}>
              <Text style={styles.tirePos}>{pos}</Text>
              <Text style={styles.tireVal}>{m ? m.tire_pressure[i]?.toFixed(1) : '--'}</Text>
              <Text style={styles.tireUnit}>PSI</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function TripBlock({ icon, label, value, unit }: { icon: any; label: string; value: string; unit: string }) {
  return (
    <View style={styles.tripBlock}>
      <MaterialCommunityIcons name={icon} size={22} color={theme.colors.brand} />
      <Text style={styles.tripLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.tripValue}>{value}</Text>
        <Text style={styles.tripUnit}> {unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
  },
  title: { fontFamily: theme.font.display, fontSize: 26, color: theme.colors.onSurface, letterSpacing: 2 },
  sub: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceTertiary, paddingHorizontal: theme.spacing.md,
    paddingVertical: 8, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.success,
  },
  connDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
  connText: { fontFamily: theme.font.textBold, fontSize: 10, letterSpacing: 2, color: theme.colors.success },

  gaugesRow: { flexDirection: 'row', gap: theme.spacing.md, justifyContent: 'center' },
  gaugeCard: {
    flex: 1, backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md, alignItems: 'center',
  },

  tripRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  tripBlock: {
    flexGrow: 1, minWidth: 140,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md, gap: 4,
  },
  tripLabel: { fontFamily: theme.font.textBold, fontSize: 10, letterSpacing: 1.5, color: theme.colors.onSurfaceSecondary, marginTop: theme.spacing.sm },
  tripValue: { fontFamily: theme.font.display, fontSize: 26, color: theme.colors.onSurface, lineHeight: 28 },
  tripUnit: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary },

  tireCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  tireHead: { fontFamily: theme.font.textBold, fontSize: 11, letterSpacing: 2, color: theme.colors.onSurfaceSecondary, marginBottom: theme.spacing.sm },
  tireGrid: { flexDirection: 'row', gap: theme.spacing.md },
  tireBox: {
    flex: 1, backgroundColor: theme.colors.surfaceTertiary, borderRadius: theme.radius.md,
    padding: theme.spacing.md, alignItems: 'center',
  },
  tirePos: { fontFamily: theme.font.textBold, fontSize: 10, letterSpacing: 2, color: theme.colors.brand },
  tireVal: { fontFamily: theme.font.display, fontSize: 30, color: theme.colors.onSurface, marginTop: 4 },
  tireUnit: { fontFamily: theme.font.text, fontSize: 10, color: theme.colors.onSurfaceSecondary },
});
