import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { usePlayer } from '@/src/state/player';

export function NowPlayingOverlay() {
  const player = usePlayer();
  const offset = React.useRef(new Animated.ValueXY()).current;
  const panResponder = React.useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => offset.setOffset({ x: (offset.x as any)._value, y: (offset.y as any)._value }),
    onPanResponderMove: Animated.event([null, { dx: offset.x, dy: offset.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => offset.flattenOffset(),
  })).current;
  if (!player.current) return null;

  return (
    <Animated.View style={[styles.nowBar, { transform: offset.getTranslateTransform() }]} testID="global-now-bar" {...panResponder.panHandlers}>
      <Image source={{ uri: player.current.artwork }} style={styles.nowArt} contentFit="cover" />
      <View style={styles.copy}>
        <Text style={styles.nowTitle} numberOfLines={1}>{player.current.title}</Text>
        <Text style={styles.nowArtist} numberOfLines={1}>{player.current.artist} · {player.current.album}</Text>
        <View style={styles.nowTrack}><View style={[styles.nowFill, { width: `${player.progress * 100}%` }]} /></View>
      </View>
      <View style={styles.nowCtrls}>
        <Pressable onPress={player.prev} style={styles.nowBtn} testID="global-now-prev"><MaterialCommunityIcons name="skip-previous" size={26} color={theme.colors.onSurface} /></Pressable>
        <Pressable onPress={player.toggle} style={[styles.nowBtn, styles.nowBtnPrimary]} testID="global-now-toggle"><MaterialCommunityIcons name={player.isPlaying ? 'pause' : 'play'} size={28} color={theme.colors.onBrandPrimary} /></Pressable>
        <Pressable onPress={player.next} style={styles.nowBtn} testID="global-now-next"><MaterialCommunityIcons name="skip-next" size={26} color={theme.colors.onSurface} /></Pressable>
        <Pressable onPress={player.close} style={styles.closeBtn} testID="global-now-close" accessibilityLabel="Close music player"><MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceSecondary} /></Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  nowBar: {
    position: 'absolute', right: theme.spacing.md, bottom: 94, width: '68%', maxWidth: 420,
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md,
    zIndex: 30,
  },
  nowArt: { width: 56, height: 56, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  copy: { flex: 1, marginLeft: theme.spacing.md },
  nowTitle: { fontFamily: theme.font.displayMedium, fontSize: 18, color: theme.colors.onSurface },
  nowArtist: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  nowTrack: { marginTop: theme.spacing.sm, height: 3, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  nowFill: { height: '100%', backgroundColor: theme.colors.brand },
  nowCtrls: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  nowBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nowBtnPrimary: { backgroundColor: theme.colors.brand },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
});