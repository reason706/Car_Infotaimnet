import React from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { usePlayer } from '@/src/state/player';

export function MusicPlayerWidget({ movable = false, compact = false, vertical = false }: { movable?: boolean; compact?: boolean; vertical?: boolean }) {
  const player = usePlayer();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const [repeat, setRepeat] = React.useState(false);
  const [shuffle, setShuffle] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const offset = React.useRef(new Animated.ValueXY()).current;
  const offsetValue = React.useRef({ x: 0, y: 0 });
  const cardWidth = compact ? Math.min(420, Math.max(280, viewportWidth - 32)) : 640;
  const cardHeight = compact ? 132 : 190;
  const topInset = 18;
  const rightInset = 18;
  const minX = -(viewportWidth - cardWidth - rightInset);
  const maxY = Math.max(-topInset, viewportHeight - cardHeight - 96 - topInset);
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => movable && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
    onMoveShouldSetPanResponderCapture: (_, gesture) => movable && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, gesture) => {
      const x = clamp(offsetValue.current.x + gesture.dx, minX, rightInset);
      const y = clamp(offsetValue.current.y + gesture.dy, -topInset, maxY);
      offset.setValue({ x, y });
    },
    onPanResponderRelease: (_, gesture) => {
      offsetValue.current = {
        x: clamp(offsetValue.current.x + gesture.dx, minX, rightInset),
        y: clamp(offsetValue.current.y + gesture.dy, -topInset, maxY),
      };
      offset.setValue(offsetValue.current);
      setDragging(false);
    },
    onPanResponderTerminate: () => setDragging(false),
  }), [movable, offset, minX, maxY, rightInset]);
  const track = player.current;
  const artwork = track?.artwork ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=600&fit=crop&q=80';

  return (
    <Animated.View style={[styles.widget, compact && styles.widgetCompact, vertical && styles.widgetVertical, movable && styles.widgetOverlay, compact && { width: cardWidth }, dragging && styles.widgetDragging, { transform: offset.getTranslateTransform() }]} testID="music-player-widget" {...(movable ? panResponder.panHandlers : {})}>
      {movable && <View style={styles.dragHandleWrap} pointerEvents="none">
        <View style={[styles.dragHandle, dragging && styles.dragHandleActive]} />
      </View>}
      <Image source={{ uri: artwork }} style={[styles.artwork, compact && styles.artworkCompact, vertical && styles.artworkVertical]} contentFit="cover" transition={200} />
      <View style={[styles.content, vertical && styles.contentVertical]}>
        <View style={[styles.topRow, vertical && styles.topRowVertical]}>
          <View style={styles.trackCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{track?.title ?? 'No track selected'}</Text>
              <MaterialCommunityIcons name="bluetooth" size={15} color={theme.colors.brandGlow} />
            </View>
            <Text style={styles.artist} numberOfLines={1}>{track ? `${track.artist} · ${track.album}` : 'Choose music from Media Hub'}</Text>
          </View>
          <View style={[styles.controls, vertical && styles.controlsVertical]}>
            <Pressable onPress={() => setRepeat((value) => !value)} testID="music-repeat" accessibilityLabel="Toggle repeat">
              <MaterialCommunityIcons name="repeat" size={18} color={repeat ? theme.colors.brandGlow : theme.colors.onSurfaceSecondary} />
            </Pressable>
            <Pressable onPress={player.prev} testID="music-previous" accessibilityLabel="Previous track">
              <MaterialCommunityIcons name="skip-previous" size={28} color={theme.colors.onSurface} />
            </Pressable>
            <Pressable style={styles.playButton} onPress={player.toggle} testID="music-play-toggle" accessibilityLabel={player.isPlaying ? 'Pause music' : 'Play music'}>
              <MaterialCommunityIcons name={player.isPlaying ? 'pause' : 'play'} size={22} color={theme.colors.surface} />
            </Pressable>
            <Pressable onPress={player.next} testID="music-next" accessibilityLabel="Next track">
              <MaterialCommunityIcons name="skip-next" size={28} color={theme.colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => setShuffle((value) => !value)} testID="music-shuffle" accessibilityLabel="Toggle shuffle">
              <MaterialCommunityIcons name="shuffle" size={18} color={shuffle ? theme.colors.brandGlow : theme.colors.onSurfaceSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${player.progress * 100}%` }]} />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.nextCopy}>
            <Text style={styles.upNext}>UP NEXT</Text>
            <Text style={styles.nextTrack} numberOfLines={1}>{player.upNext?.title ?? 'Your queue is empty'}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  widget: { width: '100%', minHeight: 190, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#2C313C', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  widgetCompact: { minHeight: 132 },
  widgetVertical: { width: 300, minHeight: 0, flexDirection: 'column' },
  widgetOverlay: { position: 'absolute', top: 18, right: 18, zIndex: 50, elevation: 12, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 16 },
  widgetDragging: { borderColor: '#F39A4A', shadowOpacity: 0.6 },
  dragHandleWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 30, zIndex: 5, alignItems: 'center', justifyContent: 'flex-start' },
  dragHandle: { width: 92, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', opacity: 0.7 },
  dragHandleActive: { opacity: 1, backgroundColor: '#F39A4A' },
  artwork: { width: 150, minHeight: 190, backgroundColor: theme.colors.surfaceTertiary },
  artworkCompact: { width: 96, minHeight: 132 },
  artworkVertical: { width: '100%', height: 220, minHeight: 0 },
  content: { flex: 1, justifyContent: 'space-between', padding: 18, paddingTop: 22, minWidth: 0 },
  contentVertical: { width: '100%', padding: 16, paddingTop: 16, gap: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  topRowVertical: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  trackCopy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1, fontFamily: theme.font.display, fontSize: 23, color: '#FFFFFF' },
  artist: { fontFamily: theme.font.text, fontSize: 12, color: '#A8ADB8', marginTop: 3 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  controlsVertical: { justifyContent: 'space-between', width: '100%', gap: 0 },
  playButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#F39A4A' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  nextCopy: { flex: 1, minWidth: 0 },
  upNext: { fontFamily: theme.font.textBold, fontSize: 9, color: '#767D8B', letterSpacing: 1.5 },
  nextTrack: { fontFamily: theme.font.textBold, fontSize: 11, color: '#D6D9DF', marginTop: 4 },
});
