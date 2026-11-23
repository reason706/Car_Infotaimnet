import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export type PillTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const tones: Record<PillTone, { bg: string; border: string; fg: string }> = {
  neutral: { bg: colors.transparent, border: colors.borderMuted, fg: colors.textDim },
  brand: { bg: colors.selectedSurface, border: colors.selectedBorder, fg: colors.selectedText },
  success: { bg: colors.successSurface, border: colors.successBorder, fg: colors.success },
  warning: { bg: colors.transparent, border: colors.warning, fg: colors.warning },
  danger: { bg: colors.transparent, border: colors.error, fg: colors.error },
};

export type PillProps = {
  label: string;
  tone?: PillTone;
  /** When set, active uses the "brand" tone and inactive uses `tone` */
  active?: boolean;
  icon?: IconName;
  /** Show a small status dot before the label */
  dot?: boolean;
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** Small status badge / toggle chip. <Pill label="LIVE" tone="success" dot /> */
export function Pill({ label, tone = 'neutral', active, icon, dot, onPress, testID, style }: PillProps) {
  const t = tones[active ? 'brand' : tone];
  const content = (
    <>
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      {icon && <Icon name={icon} size={12} color={t.fg} />}
      <Text variant="captionBold" color={t.fg}>{label}</Text>
    </>
  );
  const boxStyle = [styles.base, { backgroundColor: t.bg, borderColor: t.border }, style];
  if (!onPress) return <View style={boxStyle} testID={testID}>{content}</View>;
  return (
    <Pressable style={({ pressed }) => [boxStyle, pressed && { opacity: 0.75 }]} onPress={onPress} testID={testID} accessibilityRole="button" accessibilityState={{ selected: !!active }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
