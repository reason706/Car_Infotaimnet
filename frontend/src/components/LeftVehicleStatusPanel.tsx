import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { api, VehicleMetrics } from '@/src/api';
import { useToast } from '@/src/components/Toast';

type Gear = 'P' | 'R' | 'N' | 'D';
type Props = { testID?: string; gear?: Gear; onGearChange?: (gear: Gear) => void };

export function LeftVehicleStatusPanel({ testID, gear: controlledGear, onGearChange }: Props) {
  const toast = useToast();
  const [localGear, setLocalGear] = useState<Gear>('P');
  const [lightsOn, setLightsOn] = useState(false);
  const [m, setM] = useState<VehicleMetrics | null>(null);

  useEffect(() => {
    let cancel = false;
    const tick = () => api.vehicleMetrics().then(v => { if (!cancel) setM(v); }).catch(() => {});
    tick();
    const iv = setInterval(tick, 1500);
    return () => { cancel = true; clearInterval(iv); };
  }, []);

  const fuelKm = m ? Math.round(m.range_km) : 560;
  const fuelPct = m ? Math.round(m.fuel_percent) : 78;
  const ecoPct = 62;
  const gear = controlledGear ?? localGear;
  const gears: Gear[] = ['P', 'R', 'N', 'D'];

  return (
    <View style={styles.root} testID={testID ?? 'left-vehicle-panel'}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.eyebrow}>VEHICLE STATUS</Text>
          <Text style={styles.panelTitle}>READY TO DRIVE</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Top row: PRND + light controls */}
      <View style={styles.topRow}>
        <View style={styles.prndRow}>
          {gears.map((g) => (
            <Pressable key={g} style={[styles.gearBtn, gear === g && styles.gearBtnActive]} onPress={() => { setLocalGear(g); onGearChange?.(g); }} testID={`prnd-${g}`} hitSlop={6}>
              <Text style={[styles.prndText, gear === g && styles.prndActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.lightsRow}>
          <Pressable onPress={() => setLightsOn(!lightsOn)} testID="btn-lights-low" hitSlop={6}>
            <MaterialCommunityIcons name="car-light-dimmed" size={22} color={theme.colors.onSurfaceSecondary} />
          </Pressable>
          <Pressable onPress={() => setLightsOn(!lightsOn)} testID="btn-lights-high" hitSlop={6}>
            <MaterialCommunityIcons name="car-light-high" size={22} color={lightsOn ? theme.colors.brand : theme.colors.onSurfaceSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Info row: fuel-for + big gear + weather */}
      <View style={styles.subInfoRow}>
        <View style={styles.subCol}>
          <View style={styles.subIconRow}>
            <View style={styles.subIcon}>
              <MaterialCommunityIcons name="gas-station" size={14} color={theme.colors.onSurfaceSecondary} />
            </View>
            <View>
              <Text style={styles.subLbl}>Fuel for</Text>
              <Text style={styles.subVal}>{fuelKm} <Text style={styles.subUnit}>km</Text></Text>
            </View>
          </View>
        </View>

        <Text style={styles.gearBig} testID="gear-big">{gear}</Text>

        <View style={styles.subCol}>
          <View style={[styles.subIconRow, { alignSelf: 'flex-end' }]}>
            <MaterialCommunityIcons name="weather-cloudy" size={20} color={theme.colors.onSurfaceSecondary} />
            <View>
              <Text style={styles.subLbl}>Cloudy</Text>
              <Text style={styles.subVal}>{m ? Math.round(m.outside_temp) : 17}°</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Car + neon gauges */}
      <View style={styles.carStage}>
        <View style={styles.stageGlow} />
        <View style={styles.carRow}>
        <NeonGauge
          testID="fuel-gauge"
          icon="gas-station"
          pct={fuelPct}
          color={theme.colors.accentCyan}
          label={`${fuelPct} %`}
        />

        <View style={styles.carSlot}>
          <Image
            source={require('../../assets/images/PngItem_5122003.png')}
            style={styles.carImage}
            contentFit="contain"
            transition={200}
            testID="top-down-car"
          />
        </View>

        <NeonGauge
          testID="eco-gauge"
          icon="leaf"
          pct={ecoPct}
          color={theme.colors.brand}
          label="Eco"
          warning
        />
        </View>
      </View>

      {/* Open Trunk */}
      <Pressable
        style={({ pressed }) => [styles.trunkBtn, pressed && styles.trunkBtnPressed]}
        onPress={() => toast.show('Trunk Opening…')}
        testID="btn-open-trunk"
      >
        <Text style={styles.trunkText}>Open Trunk</Text>
      </Pressable>

      {/* Metrics grid */}
      <View style={styles.metricsCard} testID="metrics-card">
        <MetricCell label="Avg. fuel cons." value="12" unit="L/100km" />
        <View style={styles.metricSep} />
        <MetricCell label="Avg. speed" value={m ? Math.round(m.trip_avg_speed).toString() : '74'} unit="km/h" />
        <View style={styles.metricSep} />
        <MetricCell label="Distance" value={m ? Math.round(m.trip_distance + 90).toString() : '115'} unit="km" />
        <View style={styles.metricSep} />
        <MetricCell label="Fuel/price" value="6.91" unit="$" />
        <View style={styles.metricSep} />
        <MetricCell label="Fuel used" value={m ? (m.trip_fuel_used + 10).toFixed(1) : '12.8'} unit="L" />
      </View>

      <View style={styles.pageDots} testID="page-dots">
        <View style={[styles.pageDot, styles.pageDotActive]} />
        <View style={styles.pageDot} />
        <View style={styles.pageDot} />
      </View>
    </View>
  );
}

function NeonGauge({ pct, color, icon, label, warning, testID }: {
  pct: number; color: string; icon: any; label: string; warning?: boolean; testID?: string;
}) {
  return (
    <View style={styles.gaugeCol} testID={testID}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.onSurfaceSecondary} />
      {warning && (
        <MaterialCommunityIcons name="alert-circle" size={14} color={theme.colors.warning} style={{ marginTop: 4 }} />
      )}
      <View style={styles.gaugeTrackWrap}>
        <View style={styles.gaugeTrack}>
          <View style={styles.gaugeInner}>
            <View
              style={[
                styles.gaugeFill,
                {
                  height: `${pct}%`,
                  backgroundColor: color,
                  shadowColor: color,
                },
              ]}
            />
            {/* Glow overlay using SVG gradient for extra neon look */}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                <LinearGradient id={`glow-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
                  <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y={`${100 - pct}%`} width="100%" height={`${pct}%`} fill={`url(#glow-${color})`} />
            </Svg>
          </View>
        </View>
      </View>
      <Text style={styles.gaugeLbl}>{label}</Text>
    </View>
  );
}

function MetricCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel} numberOfLines={1}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.metricVal}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopRightRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },

  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  eyebrow: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.accentCyan, letterSpacing: 2 },
  panelTitle: { fontFamily: theme.font.display, fontSize: 24, color: theme.colors.onSurface, letterSpacing: 1, marginTop: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: theme.spacing.sm, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: '#143326', borderWidth: 1, borderColor: '#285A42' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
  liveText: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.success, letterSpacing: 1 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: theme.spacing.sm, minHeight: 28,
  },
  prndRow: { flexDirection: 'row', gap: theme.spacing.xs, backgroundColor: theme.colors.surfaceRaised, padding: 4, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border },
  gearBtn: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.sm },
  gearBtnActive: { backgroundColor: theme.colors.brand, shadowColor: theme.colors.brand, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
  prndText: {
    fontFamily: theme.font.textBold,
    fontSize: 15,
    color: '#4A4E56',
    letterSpacing: 2,
  },
  prndActive: { color: theme.colors.onSurface },
  lightsRow: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },

  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  subCol: { width: 96 },
  subIconRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  subIcon: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  subLbl: { fontFamily: theme.font.text, fontSize: 10, color: theme.colors.onSurfaceSecondary },
  subVal: { fontFamily: theme.font.displayMedium, fontSize: 20, color: theme.colors.onSurface, letterSpacing: 0.5 },
  subUnit: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary },

  gearBig: {
    fontFamily: theme.font.display,
    fontSize: 82,
    color: theme.colors.onSurface,
    lineHeight: 88,
    letterSpacing: 1,
  },

  carStage: { flex: 1, position: 'relative', marginTop: theme.spacing.sm },
  stageGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, alignSelf: 'center', top: '30%', backgroundColor: '#153C65', opacity: 0.18 },
  carRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  gaugeCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '85%',
    paddingVertical: theme.spacing.sm,
  },
  gaugeTrackWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  gaugeTrack: {
    width: 8,
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: '#0C0D10',
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 1,
    overflow: 'hidden',
  },
  gaugeInner: {
    flex: 1,
    borderRadius: theme.radius.pill,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  gaugeFill: {
    width: '100%',
    borderRadius: theme.radius.pill,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.9,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 6,
      },
      web: {
        // @ts-ignore
        boxShadow: '0 0 10px rgba(0,212,255,0.55), 0 0 20px rgba(0,212,255,0.35)',
      },
    }),
  },
  gaugeLbl: { fontFamily: theme.font.textBold, fontSize: 11, color: theme.colors.onSurface, letterSpacing: 1 },

  carSlot: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', zIndex: 1 },
  carImage: { width: 220, height: 380, opacity: 0.98 },

  trunkBtn: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: theme.colors.brand,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  trunkBtnPressed: { backgroundColor: theme.colors.surfaceRaised },
  trunkText: { fontFamily: theme.font.textBold, fontSize: 12, color: theme.colors.onSurface, letterSpacing: 1 },

  metricsCard: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'stretch',
  },
  metricSep: { width: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  metricLabel: {
    fontFamily: theme.font.text,
    fontSize: 9,
    color: theme.colors.onSurfaceSecondary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  metricVal: {
    fontFamily: theme.font.display,
    fontSize: 22,
    color: theme.colors.onSurface,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  metricUnit: {
    fontFamily: theme.font.text,
    fontSize: 9,
    color: theme.colors.onSurfaceSecondary,
    marginLeft: 3,
  },

  pageDots: { flexDirection: 'row', alignSelf: 'center', gap: 6, marginTop: theme.spacing.sm },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  pageDotActive: { backgroundColor: theme.colors.onSurface },
});
