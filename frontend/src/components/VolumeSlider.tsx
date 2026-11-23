import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Slider, Text, colors, spacing } from '@/src/ui';

type Props = { value: number; onChange: (value: number) => void; testID: string; compact?: boolean };

export function VolumeSlider({ value, onChange, testID, compact = false }: Props) {
  return (
    <View style={[styles.root, compact && styles.rootCompact]} testID={testID}>
      <Pressable onPress={() => onChange(value <= 0 ? 0.7 : 0)} hitSlop={6} accessibilityLabel={value === 0 ? 'Unmute' : 'Mute'}>
        <Icon name={value === 0 ? 'volume-mute' : 'volume-high'} size={compact ? 'sm' : 'md'} color="onSurfaceSecondary" />
      </Pressable>
      <Slider value={value} onChange={onChange} fillColor={colors.accent} />
      <Text variant="captionBold" color="onSurfaceSecondary" align="right" style={styles.value}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  rootCompact: { minWidth: 120 },
  value: { width: 30, letterSpacing: 0 },
});
