import React from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';

type Props = { value: number; onChange: (value: number) => void; testID: string; compact?: boolean };

export function VolumeSlider({ value, onChange, testID, compact = false }: Props) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const trackWidthRef = React.useRef(0);
  const updateFromPosition = (position: number) => {
    if (!trackWidthRef.current) return;
    onChange(Math.round(Math.max(0, Math.min(1, position / trackWidthRef.current)) * 100) / 100);
  };
  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => updateFromPosition(event.nativeEvent.locationX),
    onPanResponderMove: (event) => updateFromPosition(event.nativeEvent.locationX),
  }), [trackWidth, onChange]);

  return (
    <View style={[styles.root, compact && styles.rootCompact]} testID={testID}>
      <Pressable onPress={() => onChange(value <= 0 ? 0.7 : 0)} hitSlop={6} accessibilityLabel={value === 0 ? 'Unmute' : 'Mute'}>
        <MaterialCommunityIcons name={value === 0 ? 'volume-mute' : 'volume-high'} size={compact ? 16 : 20} color={theme.colors.onSurfaceSecondary} />
      </Pressable>
      <View
        style={styles.track}
        onLayout={(event) => { trackWidthRef.current = event.nativeEvent.layout.width; setTrackWidth(event.nativeEvent.layout.width); }}
        {...responder.panHandlers}
      >
        <View style={[styles.fill, { width: `${value * 100}%` }]} />
        <View style={[styles.thumb, { left: `${value * 100}%` }]} />
      </View>
      <Text style={styles.value}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  rootCompact: { minWidth: 120 },
  track: { height: 6, flex: 1, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', position: 'relative', overflow: 'visible' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#F39A4A' },
  thumb: { position: 'absolute', top: -4, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F39A4A' },
  value: { width: 30, fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.onSurfaceSecondary, textAlign: 'right' },
});
