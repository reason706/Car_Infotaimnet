import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Icon, IconButton, LevelDots, Text, colors, spacing } from '@/src/ui';
import { usePlayer } from '@/src/state/player';
import { VolumeSlider } from '@/src/components/VolumeSlider';

export function BottomControlBar({
  onOpenTrunk,
  showToast,
}: {
  onOpenTrunk?: () => void;
  showToast?: (msg: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const player = usePlayer();
  const [defrostFront, setDefrostFront] = useState(false);
  const [defrostRear, setDefrostRear] = useState(false);
  const [tempL, setTempL] = useState(20);
  const [tempR, setTempR] = useState(20);
  const [fanLevel, setFanLevel] = useState(3);
  const [seatLLevel, setSeatLLevel] = useState(1);
  const [seatRLevel, setSeatRLevel] = useState(1);

  const notify = (m: string) => showToast?.(m);

  return (
    <View style={styles.bar} testID="bottom-control-bar">
      <IconButton size="lg" iconSize={26} icon="home-variant" testID="ctrl-home"
        active={pathname === '/(cockpit)' || pathname === '/'}
        onPress={() => router.replace('/(cockpit)')} />
      <IconButton size="lg" iconSize={26} icon="car-outline" testID="ctrl-car"
        active={pathname.includes('/dashboard')}
        onPress={() => router.push('/(cockpit)/dashboard')} />
      <IconButton size="lg" iconSize={26} icon="music" testID="ctrl-media"
        active={pathname.includes('/media')}
        onPress={() => router.push('/(cockpit)/media')} />
      <IconButton size="lg" iconSize={26} icon="view-dashboard-outline" testID="ctrl-widgets"
        active={pathname.includes('/widgets')}
        onPress={() => router.push('/(cockpit)/widgets')} />
      <IconButton size="lg" iconSize={26} icon="package-variant-closed" testID="ctrl-trunk"
        onPress={() => { onOpenTrunk?.(); notify('Trunk Opening…'); }} />
      <IconButton size="lg" iconSize={26} icon="car-defrost-front" testID="ctrl-defrost-front"
        active={defrostFront}
        onPress={() => setDefrostFront(v => !v)} />

      <ClimateCluster
        seatTestID="ctrl-seat-l"
        tempTestID="ctrl-temp-l"
        temp={tempL}
        seatLevel={seatLLevel}
        onSeat={() => setSeatLLevel(l => (l + 1) % 4)}
        onDown={() => setTempL(Math.max(16, tempL - 1))}
        onUp={() => setTempL(Math.min(30, tempL + 1))}
      />

      <View style={styles.fanCluster}>
        <Pressable onPress={() => setFanLevel(f => (f % 5) + 1)} testID="ctrl-fan" hitSlop={4}>
          <Icon name="fan" size={26} />
        </Pressable>
        <LevelDots count={5} level={fanLevel} color={colors.brand} />
      </View>

      <ClimateCluster
        seatTestID="ctrl-seat-r"
        tempTestID="ctrl-temp-r"
        temp={tempR}
        seatLevel={seatRLevel}
        onSeat={() => setSeatRLevel(l => (l + 1) % 4)}
        onDown={() => setTempR(Math.max(16, tempR - 1))}
        onUp={() => setTempR(Math.min(30, tempR + 1))}
      />

      <IconButton size="lg" iconSize={26} icon="car-defrost-rear" testID="ctrl-defrost-rear"
        active={defrostRear}
        onPress={() => setDefrostRear(v => !v)} />

      <View style={styles.volCluster}><VolumeSlider value={player.volume} onChange={player.setVolume} testID="volume-slider" /></View>
    </View>
  );
}

function ClimateCluster({
  temp, onDown, onUp, seatTestID, tempTestID, seatLevel, onSeat,
}: {
  temp: number; onDown: () => void; onUp: () => void;
  seatTestID: string; tempTestID: string; seatLevel: number; onSeat: () => void;
}) {
  return (
    <View style={styles.cluster}>
      <IconButton size="lg" icon="car-seat" testID={seatTestID} onPress={onSeat}
        color={seatLevel > 0 ? 'accentAmber' : 'onSurface'}>
        <LevelDots count={3} level={seatLevel} color={colors.accentAmber} />
      </IconButton>
      <View style={styles.tempCol} testID={tempTestID}>
        <Pressable onPress={onUp} hitSlop={6}>
          <Icon name="chevron-up" size="sm" color="onSurfaceSecondary" />
        </Pressable>
        <View style={styles.tempRow}>
          <Text variant="title" style={styles.tempVal}>{temp}</Text>
          <Text variant="title" style={styles.tempDeg}>°</Text>
        </View>
        <Pressable onPress={onDown} hitSlop={6}>
          <Icon name="chevron-down" size="sm" color="onSurfaceSecondary" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.controlBar,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    height: 82,
  },
  fanCluster: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  cluster: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  tempCol: { alignItems: 'center', minWidth: 42 },
  tempRow: { flexDirection: 'row', alignItems: 'baseline' },
  tempVal: { fontSize: 22, lineHeight: 24, letterSpacing: 0.5 },
  tempDeg: { fontSize: 14, letterSpacing: 0 },
  volCluster: { width: 190, paddingHorizontal: spacing.sm, height: 44, justifyContent: 'center' },
});
