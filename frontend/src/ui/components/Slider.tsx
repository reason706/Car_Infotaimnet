import React from 'react';
import { PanResponder, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../tokens';

export type SliderProps = {
  /** Current value, 0..1 */
  value: number;
  onChange: (value: number) => void;
  /** Snap to N equal steps (e.g. 4 → 0, .25, .5, .75, 1) */
  steps?: number;
  fillColor?: string;
  trackColor?: string;
  thumbColor?: string;
  thumbBorderColor?: string;
  thumbSize?: number;
  trackHeight?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Horizontal drag/tap slider. All sliders in the app share this. */
export function Slider({
  value, onChange, steps, fillColor = colors.accent, trackColor = colors.white12,
  thumbColor = colors.white, thumbBorderColor = fillColor, thumbSize = 14, trackHeight = 6, style, testID,
}: SliderProps) {
  const widthRef = React.useRef(0);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const update = React.useCallback((x: number) => {
    if (!widthRef.current) return;
    let v = clamp01(x / widthRef.current);
    if (steps) v = Math.round(v * steps) / steps;
    onChangeRef.current(Math.round(v * 100) / 100);
  }, [steps]);

  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
    onPanResponderMove: (e) => update(e.nativeEvent.locationX),
  }), [update]);

  const pct = `${clamp01(value) * 100}%` as const;
  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(value) * 100) }}
      style={[styles.track, { height: trackHeight, borderRadius: radius.pill, backgroundColor: trackColor }, style]}
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={[styles.fill, { width: pct, backgroundColor: fillColor }]} />
      <View
        pointerEvents="none"
        style={[styles.thumb, {
          left: pct, width: thumbSize, height: thumbSize, marginLeft: -thumbSize / 2, top: (trackHeight - thumbSize) / 2,
          borderRadius: thumbSize / 2, backgroundColor: thumbColor, borderColor: thumbBorderColor,
        }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, position: 'relative', overflow: 'visible' },
  fill: { height: '100%', borderRadius: radius.pill },
  thumb: { position: 'absolute', borderWidth: 2 },
});
