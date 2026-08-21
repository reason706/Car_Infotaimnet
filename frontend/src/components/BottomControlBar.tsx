import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function BottomControlBar({
  onOpenTrunk,
  showToast,
}: {
  onOpenTrunk?: () => void;
  showToast?: (msg: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [defrostFront, setDefrostFront] = useState(false);
  const [defrostRear, setDefrostRear] = useState(false);
  const [tempL, setTempL] = useState(20);
  const [tempR, setTempR] = useState(20);
  const [fanLevel, setFanLevel] = useState(3);
  const [seatLLevel, setSeatLLevel] = useState(1);
  const [seatRLevel, setSeatRLevel] = useState(1);
  const [volume, setVolume] = useState(0.6);

  const notify = (m: string) => showToast?.(m);

  return (
    <View style={styles.bar} testID="bottom-control-bar">
      <IconBtn
        icon="car-outline"
        testID="ctrl-car"
        active={pathname.includes('/dashboard')}
        onPress={() => router.push('/(cockpit)/dashboard')}
      />
      <IconBtn
        icon="music"
        testID="ctrl-media"
        active={pathname.includes('/media')}
        onPress={() => router.push('/(cockpit)/media')}
      />
      <IconBtn
        icon="package-variant-closed"
        testID="ctrl-trunk"
        onPress={() => { onOpenTrunk?.(); notify('Trunk Opening…'); }}
      />
      <IconBtn
        icon="car-defrost-front"
        testID="ctrl-defrost-front"
        active={defrostFront}
        onPress={() => setDefrostFront(v => !v)}
      />

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
        <Pressable
          onPress={() => setFanLevel(f => (f % 5) + 1)}
          testID="ctrl-fan"
          hitSlop={4}
        >
          <MaterialCommunityIcons name="fan" size={26} color={theme.colors.onSurface} />
        </Pressable>
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, i < fanLevel && { backgroundColor: theme.colors.brand }]} />
          ))}
        </View>
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

      <IconBtn
        icon="car-defrost-rear"
        testID="ctrl-defrost-rear"
        active={defrostRear}
        onPress={() => setDefrostRear(v => !v)}
      />

      <View style={styles.volCluster} testID="volume-slider">
        <Pressable onPress={() => setVolume(Math.max(0, volume - 0.1))} testID="ctrl-vol-down" hitSlop={6}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={theme.colors.onSurfaceSecondary} />
        </Pressable>
        <MaterialCommunityIcons name={volume === 0 ? 'volume-mute' : 'volume-high'} size={22} color={theme.colors.onSurface} />
        <View style={styles.volTrack}>
          <View style={[styles.volFill, { width: `${volume * 100}%` }]} />
        </View>
        <Pressable onPress={() => setVolume(Math.min(1, volume + 0.1))} testID="ctrl-vol-up" hitSlop={6}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

function IconBtn({
  icon, testID, active, onPress,
}: {
  icon: IconName; testID: string; active?: boolean; onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.btn, active && styles.btnActive]} onPress={onPress} testID={testID}>
      <MaterialCommunityIcons name={icon} size={26} color={active ? theme.colors.brand : theme.colors.onSurface} />
    </Pressable>
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
      <Pressable style={styles.btn} onPress={onSeat} testID={seatTestID}>
        <MaterialCommunityIcons name="car-seat" size={24} color={seatLevel > 0 ? theme.colors.accentAmber : theme.colors.onSurface} />
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i < seatLevel && { backgroundColor: theme.colors.accentAmber }]} />
          ))}
        </View>
      </Pressable>
      <View style={styles.tempCol} testID={tempTestID}>
        <Pressable onPress={onUp} hitSlop={6}>
          <MaterialCommunityIcons name="chevron-up" size={16} color={theme.colors.onSurfaceSecondary} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.tempVal}>{temp}</Text>
          <Text style={styles.tempDeg}>°</Text>
        </View>
        <Pressable onPress={onDown} hitSlop={6}>
          <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.onSurfaceSecondary} />
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
    backgroundColor: '#0A0B0D',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    height: 82,
  },
  btn: {
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    borderRadius: theme.radius.md, gap: 3,
  },
  btnActive: { backgroundColor: theme.colors.brandTertiary },
  dotsRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },
  fanCluster: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  cluster: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tempCol: { alignItems: 'center', minWidth: 42 },
  tempVal: { fontFamily: theme.font.display, fontSize: 22, color: theme.colors.onSurface, lineHeight: 24, letterSpacing: 0.5 },
  tempDeg: { fontFamily: theme.font.display, fontSize: 14, color: theme.colors.onSurface },
  volCluster: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm, height: 44, minWidth: 190,
  },
  volTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, overflow: 'hidden' },
  volFill: { height: '100%', backgroundColor: theme.colors.brand },
});
