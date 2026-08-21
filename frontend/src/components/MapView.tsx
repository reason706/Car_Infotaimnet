import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, G, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { theme } from '@/src/theme';

type Props = {
  width?: number;
  height?: number;
  variant?: 'dark' | 'light';
  showRoute?: boolean;
  testID?: string;
};

const STOPS = (w: number, h: number) => [
  { x: w * 0.18, y: h * 0.82 },
  { x: w * 0.28, y: h * 0.70 },
  { x: w * 0.42, y: h * 0.62 },
  { x: w * 0.55, y: h * 0.48 },
  { x: w * 0.62, y: h * 0.42 },
  { x: w * 0.72, y: h * 0.34 },
];

export function MapView({ width = 900, height = 600, variant = 'light', showRoute = true, testID }: Props) {
  const light = variant === 'light';
  const bg1 = light ? '#F5F6F8' : '#0d1219';
  const bg2 = light ? '#E9ECF0' : '#050608';
  const streetColor = light ? '#D4D8DE' : theme.colors.border;
  const majorStreet = light ? '#B8BEC7' : theme.colors.borderStrong;
  const waterColor = light ? '#A8C8E0' : '#0b1830';
  const parkColor = light ? '#CCE1CE' : '#0f2a1a';
  const routeColor = '#2E7CF6';
  const labelColor = light ? '#4A4F58' : '#8D93A0';

  const rows = 7;
  const cols = 9;
  const grid: React.ReactElement[] = [];
  for (let r = 1; r < rows; r++) {
    const y = (height / rows) * r;
    grid.push(<Line key={`h${r}`} x1={0} y1={y} x2={width} y2={y} stroke={streetColor} strokeWidth={1} />);
  }
  for (let c = 1; c < cols; c++) {
    const x = (width / cols) * c;
    grid.push(<Line key={`v${c}`} x1={x} y1={0} x2={x} y2={height} stroke={streetColor} strokeWidth={1} />);
  }

  const majors = [
    { x1: 0, y1: height * 0.32, x2: width, y2: height * 0.32 },
    { x1: 0, y1: height * 0.72, x2: width, y2: height * 0.72 },
    { x1: width * 0.28, y1: 0, x2: width * 0.28, y2: height },
    { x1: width * 0.72, y1: 0, x2: width * 0.72, y2: height },
  ];

  const stops = STOPS(width, height);
  const routeD = stops.reduce((acc, s, i) => {
    if (i === 0) return `M ${s.x} ${s.y}`;
    const prev = stops[i - 1];
    const cx1 = prev.x + (s.x - prev.x) * 0.5;
    const cy1 = prev.y;
    const cx2 = prev.x + (s.x - prev.x) * 0.5;
    const cy2 = s.y;
    return acc + ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${s.x} ${s.y}`;
  }, '');

  return (
    <View style={[styles.wrap, { backgroundColor: bg1 }]} testID={testID}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="mbg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bg1} />
            <Stop offset="1" stopColor={bg2} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill="url(#mbg)" />

        {/* River / water */}
        <Path
          d={`M ${width * 0.02} ${height * 0.05}
              C ${width * 0.15} ${height * 0.18}, ${width * 0.1} ${height * 0.28}, ${width * 0.28} ${height * 0.34}
              C ${width * 0.45} ${height * 0.4}, ${width * 0.55} ${height * 0.22}, ${width * 0.7} ${height * 0.18}
              C ${width * 0.82} ${height * 0.16}, ${width * 0.9} ${height * 0.28}, ${width} ${height * 0.24}
              L ${width} ${height * 0.02} L ${width * 0.02} ${height * 0.02} Z`}
          fill={waterColor}
          opacity={light ? 0.85 : 0.85}
        />
        {/* Right-side vertical waterway */}
        <Path
          d={`M ${width * 0.9} ${height * 0.3}
              C ${width * 0.94} ${height * 0.5}, ${width * 0.92} ${height * 0.7}, ${width * 0.96} ${height}
              L ${width} ${height} L ${width} ${height * 0.3} Z`}
          fill={waterColor}
          opacity={light ? 0.85 : 0.85}
        />

        {/* Park block */}
        <Rect x={width * 0.05} y={height * 0.42} width={width * 0.14} height={height * 0.12} rx={4} fill={parkColor} opacity={0.85} />

        {/* Grid streets */}
        <G>{grid}</G>

        {/* Major arterials */}
        {majors.map((m, i) => (
          <Line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={majorStreet} strokeWidth={4} />
        ))}

        {/* Diagonal highways */}
        <Line x1={width * 0.05} y1={height * 0.95} x2={width * 0.95} y2={height * 0.3} stroke={majorStreet} strokeWidth={5} opacity={0.55} />

        {showRoute && (
          <>
            {/* Route halo */}
            <Path d={routeD} stroke={routeColor} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.2} />
            <Path d={routeD} stroke={routeColor} strokeWidth={5} strokeLinecap="round" fill="none" />
            {/* Alt segment (traffic red) */}
            <Path
              d={`M ${stops[1].x} ${stops[1].y} L ${stops[1].x + 40} ${stops[1].y - 6}`}
              stroke="#E53E3E"
              strokeWidth={5}
              strokeLinecap="round"
            />

            {/* Origin marker */}
            <Circle cx={stops[0].x} cy={stops[0].y} r={9} fill={routeColor} />
            <Circle cx={stops[0].x} cy={stops[0].y} r={4} fill="#FFFFFF" />

            {/* Destination pin */}
            <Path
              d={`M ${stops[stops.length - 1].x} ${stops[stops.length - 1].y - 26}
                  C ${stops[stops.length - 1].x - 14} ${stops[stops.length - 1].y - 26}, ${stops[stops.length - 1].x - 14} ${stops[stops.length - 1].y - 6}, ${stops[stops.length - 1].x} ${stops[stops.length - 1].y}
                  C ${stops[stops.length - 1].x + 14} ${stops[stops.length - 1].y - 6}, ${stops[stops.length - 1].x + 14} ${stops[stops.length - 1].y - 26}, ${stops[stops.length - 1].x} ${stops[stops.length - 1].y - 26} Z`}
              fill={routeColor}
            />
            <Circle cx={stops[stops.length - 1].x} cy={stops[stops.length - 1].y - 16} r={5} fill="#FFFFFF" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: theme.radius.lg },
});
