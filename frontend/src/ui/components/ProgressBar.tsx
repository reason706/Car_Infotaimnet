import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors, radius } from '../tokens';

export type ProgressBarProps = { value: number; color?: string; trackColor?: string; height?: number; style?: StyleProp<ViewStyle> };

/** Non-interactive progress bar, value 0..1. */
export function ProgressBar({ value, color = colors.accent, trackColor = colors.white12, height = 5, style }: ProgressBarProps) {
  return (
    <View style={[{ height, borderRadius: radius.xs, overflow: 'hidden', backgroundColor: trackColor }, style]}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }} />
    </View>
  );
}
