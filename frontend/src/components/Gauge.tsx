import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { theme } from '@/src/theme';

type GaugeProps = {
  value: number;
  min?: number;
  max: number;
  label: string;
  unit?: string;
  size?: number;
  segments?: number;
  warnFrom?: number;
  redFrom?: number;
  format?: (v: number) => string;
  testID?: string;
};

// Semi-circular gauge from -220deg to +40deg (260deg total sweep).
export function Gauge({
  value, min = 0, max, label, unit, size = 220, segments = 26,
  warnFrom, redFrom, format, testID,
}: GaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 6;
  const rInner = rOuter - 18;
  const START = -220;
  const SWEEP = 260;
  const clamp = Math.max(min, Math.min(max, value));
  const pct = (clamp - min) / (max - min);
  const angle = START + SWEEP * pct;

  const ticks = [];
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const a = ((START + SWEEP * t) * Math.PI) / 180;
    const filled = t <= pct;
    const isRed = redFrom !== undefined && (min + (max - min) * t) >= redFrom;
    const isWarn = warnFrom !== undefined && !isRed && (min + (max - min) * t) >= warnFrom;
    const color = filled
      ? isRed ? theme.colors.error : isWarn ? theme.colors.warning : theme.colors.brand
      : theme.colors.border;
    const x1 = cx + Math.cos(a) * rInner;
    const y1 = cy + Math.sin(a) * rInner;
    const x2 = cx + Math.cos(a) * rOuter;
    const y2 = cy + Math.sin(a) * rOuter;
    ticks.push(
      <Path
        key={i}
        d={`M ${x1} ${y1} L ${x2} ${y2}`}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
    );
  }

  // needle
  const na = (angle * Math.PI) / 180;
  const nx = cx + Math.cos(na) * (rInner - 6);
  const ny = cy + Math.sin(na) * (rInner - 6);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} testID={testID}>
      <Svg width={size} height={size}>
        <G>{ticks}</G>
        <Circle cx={cx} cy={cy} r={rInner - 12} stroke={theme.colors.border} strokeWidth={1} fill="transparent" />
        <Path
          d={`M ${cx} ${cy} L ${nx} ${ny}`}
          stroke={theme.colors.brand}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx={cx} cy={cy} r={6} fill={theme.colors.brand} />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{format ? format(clamp) : Math.round(clamp)}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: theme.font.display,
    color: theme.colors.onSurface,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: 1,
  },
  unit: {
    fontFamily: theme.font.text,
    color: theme.colors.onSurfaceSecondary,
    fontSize: 12,
    letterSpacing: 1.2,
    marginTop: -4,
  },
  label: {
    fontFamily: theme.font.textBold,
    color: theme.colors.onSurfaceSecondary,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
