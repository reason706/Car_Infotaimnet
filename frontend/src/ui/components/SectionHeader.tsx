import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { spacing } from '../tokens';
import { Text } from './Text';

export type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  size?: 'screen' | 'panel';
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Eyebrow + title (+ optional right-side slot). Used at the top of screens and panels. */
export function SectionHeader({ eyebrow, title, size = 'panel', right, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.copy}>
        {eyebrow ? <Text variant="eyebrow" color="accentCyan">{eyebrow}</Text> : null}
        <Text variant={size === 'screen' ? 'screenTitle' : 'title'} style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  copy: { flexShrink: 1 },
  title: { marginTop: 2 },
});
