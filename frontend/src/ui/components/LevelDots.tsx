import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../tokens';

export type LevelDotsProps = { count: number; level: number; color?: string; emptyColor?: string; size?: number };

/** Row of small dots showing a level (fan speed, seat heat...). */
export function LevelDots({ count, level, color = colors.brand, emptyColor = colors.border, size = 4 }: LevelDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: i < level ? color : emptyColor }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 3, marginTop: 2 } });
