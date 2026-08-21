import React from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { theme } from '@/src/theme';

type Props = {
  temperature: number;
  active: boolean;
  onToggle: () => void;
  onDown: () => void;
  onUp: () => void;
  onTemperatureChange?: (value: number) => void;
  compact?: boolean;
};

type AirflowMode = 'face' | 'feet' | 'face-feet' | 'defrost';

export function ClimateWidget({ temperature, active, onToggle, onDown, onUp, onTemperatureChange, compact = false }: Props) {
  const [autoActive, setAutoActive] = React.useState(true);
  const [fanLevel, setFanLevel] = React.useState(3);
  const [airflow, setAirflow] = React.useState<AirflowMode>('face-feet');
  const [frontDefrost, setFrontDefrost] = React.useState(false);
  const [rearDefrost, setRearDefrost] = React.useState(false);
  const [recirculation, setRecirculation] = React.useState(false);
  const [fanTrackWidth, setFanTrackWidth] = React.useState(0);
  const [temperatureTrackWidth, setTemperatureTrackWidth] = React.useState(0);
  const fanTrackWidthRef = React.useRef(0);
  const temperatureTrackWidthRef = React.useRef(0);

  const setFanFromPosition = (position: number) => {
    if (!fanTrackWidthRef.current) return;
    setFanLevel(Math.max(1, Math.min(5, Math.round((position / fanTrackWidthRef.current) * 4) + 1)));
  };

  const setTemperatureFromPosition = (position: number) => {
    if (!temperatureTrackWidthRef.current || !onTemperatureChange) return onUp();
    const ratio = Math.max(0, Math.min(1, position / temperatureTrackWidthRef.current));
    onTemperatureChange(Math.round(16 + ratio * 14));
  };

  const fanResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => setFanFromPosition(event.nativeEvent.locationX),
    onPanResponderMove: (event) => setFanFromPosition(event.nativeEvent.locationX),
  }), [fanTrackWidth]);
  const temperatureResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => setTemperatureFromPosition(event.nativeEvent.locationX),
    onPanResponderMove: (event) => setTemperatureFromPosition(event.nativeEvent.locationX),
  }), [temperatureTrackWidth, onTemperatureChange]);

  return (
    <View style={[styles.widget, compact ? styles.widgetCompact : styles.widgetFull]} testID="climate-widget">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>CABIN CLIMATE</Text>
            <Text style={styles.title}>A / C</Text>
          </View>
          <Pressable style={[styles.statusPill, active && styles.statusPillActive]} onPress={onToggle} testID="climate-toggle">
            <Text style={[styles.statusText, active && styles.statusTextActive]}>{active ? 'ON' : 'OFF'}</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.autoButton, autoActive && styles.autoButtonActive]} onPress={() => setAutoActive((value) => !value)} testID="climate-auto">
          <Text style={[styles.autoText, autoActive && styles.autoTextActive]}>AUTO</Text>
        </Pressable>
      </View>

      <View style={styles.controlSection}>
        <Text style={styles.sectionLabel}>Fan</Text>
        <View style={styles.sliderRow}>
          <MaterialCommunityIcons name="fan" size={26} color={theme.colors.onSurface} />
          <View
            style={styles.sliderTrack}
            onLayout={(event) => { fanTrackWidthRef.current = event.nativeEvent.layout.width; setFanTrackWidth(event.nativeEvent.layout.width); }}
            {...fanResponder.panHandlers}
            testID="climate-fan-slider"
          >
            <View style={[styles.sliderFill, { width: `${fanLevel * 20}%` }]} />
            <View style={[styles.sliderThumb, { left: `${fanLevel * 20 - 2}%` }]} />
          </View>
        </View>
        <View style={styles.scaleRow}>{[1, 2, 3, 4, 5].map((level) => <Text key={level} style={styles.scaleText}>{level}</Text>)}</View>
      </View>

      <View style={styles.controlSection}>
        <Text style={styles.sectionLabel}>Temperature</Text>
        <View style={styles.temperatureRow}>
          <Text style={styles.temperatureValue}>{temperature}<Text style={styles.temperatureUnit}>°C</Text></Text>
          <View
            style={styles.sliderTrack}
            onLayout={(event) => { temperatureTrackWidthRef.current = event.nativeEvent.layout.width; setTemperatureTrackWidth(event.nativeEvent.layout.width); }}
            {...temperatureResponder.panHandlers}
            testID="climate-temperature-slider"
          >
            <View style={[styles.temperatureFill, { width: `${Math.max(0, Math.min(100, (temperature - 16) * 7.14))}%` }]} />
            <View style={[styles.sliderThumb, { left: `${Math.max(0, Math.min(100, (temperature - 16) * 7.14))}%` }]} />
          </View>
        </View>
      </View>

      {!compact && <>
        <Text style={[styles.sectionLabel, styles.airflowHeading]}>Airflow</Text>
        <View style={styles.airflowRow}>
          <AirflowButton direction="face" label="Face" active={airflow === 'face'} onPress={() => setAirflow('face')} testID="climate-airflow-face" />
          <AirflowButton direction="feet" label="Feet" active={airflow === 'feet'} onPress={() => setAirflow('feet')} testID="climate-airflow-feet" />
          <AirflowButton direction="face-feet" label="Face + feet" active={airflow === 'face-feet'} onPress={() => setAirflow('face-feet')} testID="climate-airflow-face-feet" />
          <AirflowButton direction="defrost" label="Defrost" active={airflow === 'defrost'} onPress={() => setAirflow('defrost')} testID="climate-airflow-defrost" />
        </View>

        <View style={styles.utilityRows}>
          <View style={styles.utilityRow}>
            <UtilityButton icon="car-defrost-front" label="Front Defrost" active={frontDefrost} onPress={() => setFrontDefrost((value) => !value)} testID="climate-front-defrost" />
            <UtilityButton icon="car-defrost-rear" label="Rear Defrost" active={rearDefrost} onPress={() => setRearDefrost((value) => !value)} testID="climate-rear-defrost" />
          </View>
          <View style={styles.utilityRow}>
            <UtilityButton icon="car" label="Fresh Air" active={!recirculation} onPress={() => setRecirculation(false)} testID="climate-fresh-air" />
            <UtilityButton icon="car-side" label="Recirculation" active={recirculation} onPress={() => setRecirculation(true)} testID="climate-recirculation" />
          </View>
        </View>
      </>}

      {compact && <View style={styles.compactFooter}><Text style={styles.compactHint}>{active ? 'Cooling on' : 'Climate off'}</Text><Text style={styles.compactHint}>Fan {fanLevel}</Text></View>}
    </View>
  );
}

function AirflowButton({ direction, label, active, onPress, testID }: { direction: 'face' | 'feet' | 'face-feet' | 'defrost'; label: string; active: boolean; onPress: () => void; testID: string }) {
  const color = active ? theme.colors.brand : theme.colors.onSurface;
  return <Pressable style={[styles.airflowButton, active && styles.controlActive]} onPress={onPress} testID={testID}>
    <AirflowIcon direction={direction} color={color} />
    <Text style={styles.controlLabel}>{label}</Text>
  </Pressable>;
}

function AirflowIcon({ direction, color }: { direction: 'face' | 'feet' | 'face-feet' | 'defrost'; color: string }) {
  if (direction === 'defrost') {
    return <Svg width={42} height={34} viewBox="0 0 42 34">
      <Path d="M5 25 L9 11 L33 11 L37 25" fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <Line x1="15" y1="15" x2="13" y2="23" stroke={color} strokeWidth={2} />
      <Line x1="21" y1="15" x2="20" y2="23" stroke={color} strokeWidth={2} />
      <Line x1="27" y1="15" x2="28" y2="23" stroke={color} strokeWidth={2} />
    </Svg>;
  }
  return <Svg width={42} height={34} viewBox="0 0 42 34">
    <Circle cx="25" cy="7" r="3.5" fill={color} />
    <Path d="M25 12 L25 21 L17 28 M25 17 L17 19 M25 21 L32 28" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    {(direction === 'face' || direction === 'face-feet') && <>
      <Line x1="9" y1="14" x2="18" y2="14" stroke={color} strokeWidth={2} />
      <Polyline points="12,11 9,14 12,17" fill="none" stroke={color} strokeWidth={2} />
    </>}
    {(direction === 'feet' || direction === 'face-feet') && <>
      <Line x1="12" y1="28" x2="20" y2="28" stroke={color} strokeWidth={2} />
      <Polyline points="15,25 12,28 15,31" fill="none" stroke={color} strokeWidth={2} />
    </>}
  </Svg>;
}

function UtilityButton({ icon, label, active, onPress, testID }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; active: boolean; onPress: () => void; testID: string }) {
  return <Pressable style={[styles.utilityButton, active && styles.controlActive]} onPress={onPress} testID={testID}><Text style={styles.utilityLabel}>{label}</Text><MaterialCommunityIcons name={icon} size={30} color={active ? theme.colors.brand : theme.colors.onSurface} /></Pressable>;
}

const styles = StyleSheet.create({
  widget: { backgroundColor: '#1D1E23', borderRadius: 28, borderWidth: 1, borderColor: '#34363D', padding: 22 },
  widgetCompact: { minHeight: 150 },
  widgetFull: { width: 520, minHeight: 620 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  eyebrow: { fontFamily: theme.font.textBold, fontSize: 9, color: '#9FA4B5', letterSpacing: 1.8, marginBottom: 2 },
  title: { fontFamily: theme.font.display, fontSize: 34, color: '#FFFFFF', letterSpacing: 2 },
  statusPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: '#666A77' },
  statusPillActive: { backgroundColor: '#172D68', borderColor: '#5D8DFF' },
  statusText: { fontFamily: theme.font.textBold, fontSize: 10, color: '#A5A8B2', letterSpacing: 1 },
  statusTextActive: { color: '#6D9BFF' },
  autoButton: { paddingHorizontal: 17, paddingVertical: 9, borderRadius: theme.radius.pill, backgroundColor: '#4F6FEA' },
  autoButtonActive: { backgroundColor: '#5A73F5' },
  autoText: { fontFamily: theme.font.textBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 1 },
  autoTextActive: { color: theme.colors.onBrandPrimary },
  controlSection: { marginTop: 28 },
  sectionLabel: { fontFamily: theme.font.textBold, fontSize: 11, color: '#B4B6C1', letterSpacing: 0.4, marginBottom: 12 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sliderTrack: { height: 6, flex: 1, borderRadius: theme.radius.pill, backgroundColor: '#363940', position: 'relative' },
  sliderFill: { height: '100%', borderRadius: theme.radius.pill, backgroundColor: '#7198FF' },
  temperatureFill: { height: '100%', borderRadius: theme.radius.pill, backgroundColor: '#F05D62' },
  sliderThumb: { position: 'absolute', top: -8, width: 22, height: 22, marginLeft: -11, borderRadius: theme.radius.pill, backgroundColor: '#77A1FF', borderWidth: 2, borderColor: '#D5E1FF' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 42, marginTop: 8 },
  scaleText: { fontFamily: theme.font.text, fontSize: 10, color: theme.colors.onSurfaceSecondary },
  temperatureRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  temperatureValue: { fontFamily: theme.font.display, fontSize: 42, color: '#FFFFFF', minWidth: 78 },
  temperatureUnit: { fontFamily: theme.font.textBold, fontSize: 13, color: '#C0C2CA' },
  airflowRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  airflowHeading: { marginTop: 28 },
  airflowButton: { alignItems: 'center', justifyContent: 'center', width: 86, minHeight: 70, borderRadius: 14, gap: 5 },
  utilityRows: { marginTop: 18, gap: 14 },
  utilityRow: { flexDirection: 'row', gap: 14 },
  utilityButton: { alignItems: 'flex-start', justifyContent: 'flex-start', width: 140, minHeight: 82, borderRadius: 14, gap: 10, paddingHorizontal: 2 },
  utilityLabel: { fontFamily: theme.font.text, fontSize: 11, color: '#B4B6C1' },
  controlActive: { backgroundColor: 'transparent' },
  controlLabel: { fontFamily: theme.font.text, fontSize: 10, color: '#B4B6C1', textAlign: 'center' },
  compactFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm },
  compactHint: { fontFamily: theme.font.text, fontSize: 10, color: theme.colors.onSurfaceSecondary },
});
