import React from 'react';
import { Slot, usePathname } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { PlayerProvider } from '@/src/state/player';
import { BottomControlBar } from '@/src/components/BottomControlBar';
import { MusicPlayerWidget } from '@/src/components/MusicPlayerWidget';
import { ToastProvider, useToast } from '@/src/components/Toast';

function CockpitInner() {
  const toast = useToast();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/(cockpit)' || pathname.endsWith('/index') || pathname.endsWith('/cockpit/');
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Slot />
      </View>
      {pathname.includes('/widgets') || pathname.includes('/media') ? null : <MusicPlayerWidget movable={isHome} compact={isHome} />}
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
