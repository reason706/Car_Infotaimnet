import React from 'react';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { PlayerProvider } from '@/src/state/player';
import { BottomControlBar } from '@/src/components/BottomControlBar';
import { NowPlayingOverlay } from '@/src/components/NowPlayingOverlay';
import { ToastProvider, useToast } from '@/src/components/Toast';

function CockpitInner() {
  const toast = useToast();
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Slot />
      </View>
      <NowPlayingOverlay />
      <BottomControlBar showToast={toast.show} />
    </View>
  );
}

export default function CockpitLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom', 'left', 'right']}>
        <PlayerProvider>
          <ToastProvider>
            <CockpitInner />
          </ToastProvider>
        </PlayerProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  body: { flex: 1 },
});
