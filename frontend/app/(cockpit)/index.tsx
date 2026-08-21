import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/src/theme';
import { LeftVehicleStatusPanel } from '@/src/components/LeftVehicleStatusPanel';
import { RightNavigationMapPanel } from '@/src/components/RightNavigationMapPanel';

export default function CockpitHome() {
  return (
    <View style={styles.root} testID="cockpit-home">
      <View style={styles.left}>
        <LeftVehicleStatusPanel />
      </View>
      <View style={styles.gap} />
      <View style={styles.right}>
        <RightNavigationMapPanel />
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
    width: 380,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  gap: { width: theme.spacing.sm },
  right: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
});
