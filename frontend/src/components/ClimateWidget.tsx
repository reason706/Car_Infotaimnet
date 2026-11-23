import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { Button, Card, Icon, IconName, Pill, Slider, Text, colors, radius, spacing } from '@/src/ui';

const TEMP_MIN = 16;
const TEMP_MAX = 30;
const climateSlider = { trackColor: colors.climateTrack, thumbColor: colors.climateThumb, thumbBorderColor: colors.climateThumbBorder, thumbSize: 22 };

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

export function ClimateWidget({ temperature, active, onToggle, onDown: _onDown, onUp, onTemperatureChange, compact = false }: Props) {
  const [autoActive, setAutoActive] = React.useState(true);
  const [fanLevel, setFanLevel] = React.useState(3);
  const [airflow, setAirflow] = React.useState<AirflowMode>('face-feet');
  const [frontDefrost, setFrontDefrost] = React.useState(false);
  const [rearDefrost, setRearDefrost] = React.useState(false);
  const [recirculation, setRecirculation] = React.useState(false);

  const temperatureRatio = Math.max(0, Math.min(1, (temperature - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)));
  const setTemperatureFromRatio = (ratio: number) => {
    if (!onTemperatureChange) return onUp();
    onTemperatureChange(Math.round(TEMP_MIN + ratio * (TEMP_MAX - TEMP_MIN)));
  };

  return (
    <Card variant="panel" radius="xl" padding="none" style={[styles.widget, compact ? styles.widgetCompact : styles.widgetFull]} testID="climate-widget">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text variant="micro" color="textDim" style={styles.eyebrow}>CABIN CLIMATE</Text>
            <Text variant="screenTitle" style={styles.title}>A / C</Text>
          </View>
          <Pill label={active ? 'ON' : 'OFF'} active={active} onPress={onToggle} testID="climate-toggle" style={styles.statusPill} />
        </View>
        <Button label="AUTO" size="sm" variant="primary" onPress={() => setAutoActive((value) => !value)} testID="climate-auto"
          style={[styles.autoButton, autoActive && styles.autoButtonActive]} />
      </View>

      <View style={styles.controlSection}>
        <Text variant="label" color="textSubtle" style={styles.sectionLabel}>Fan</Text>
        <View style={styles.sliderRow}>
          <Icon name="fan" size={26} />
          <Slider
            value={fanLevel / 5}
            onChange={(v) => setFanLevel(Math.max(1, Math.min(5, Math.round(v * 5))))}
            {...climateSlider}
            fillColor={colors.climateFan}
            testID="climate-fan-slider"
          />
        </View>
        <View style={styles.scaleRow}>{[1, 2, 3, 4, 5].map((level) => <Text key={level} variant="caption" color="onSurfaceSecondary">{level}</Text>)}</View>
      </View>

      <View style={styles.controlSection}>
        <Text variant="label" color="textSubtle" style={styles.sectionLabel}>Temperature</Text>
        <View style={styles.temperatureRow}>
          <Text variant="hero" style={styles.temperatureValue}>{temperature}<Text variant="bodyBold" color="textLight" style={styles.temperatureUnit}>°C</Text></Text>
          <Slider
            value={temperatureRatio}
            onChange={setTemperatureFromRatio}
            {...climateSlider}
            fillColor={colors.climateHeat}
            testID="climate-temperature-slider"
          />
        </View>
      </View>

      {!compact && <>
        <Text variant="label" color="textSubtle" style={[styles.sectionLabel, styles.airflowHeading]}>Airflow</Text>
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

      {compact && <View style={styles.compactFooter}><Text variant="caption" color="onSurfaceSecondary">{active ? 'Cooling on' : 'Climate off'}</Text><Text variant="caption" color="onSurfaceSecondary">Fan {fanLevel}</Text></View>}
    </Card>
  );
}

function AirflowButton({ direction, label, active, onPress, testID }: { direction: 'face' | 'feet' | 'face-feet' | 'defrost'; label: string; active: boolean; onPress: () => void; testID: string }) {
  const color = active ? colors.brand : colors.onSurface;
  return <Pressable style={styles.airflowButton} onPress={onPress} testID={testID} accessibilityState={{ selected: active }}>
    <AirflowIcon direction={direction} color={color} />
    <Text variant="caption" color="textSubtle" align="center">{label}</Text>
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

function UtilityButton({ icon, label, active, onPress, testID }: { icon: IconName; label: string; active: boolean; onPress: () => void; testID: string }) {
  return <Pressable style={styles.utilityButton} onPress={onPress} testID={testID} accessibilityState={{ selected: active }}><Text variant="body" color="textSubtle" style={styles.utilityLabel}>{label}</Text><Icon name={icon} size={30} color={active ? 'brand' : 'onSurface'} /></Pressable>;
}

const styles = StyleSheet.create({
  widget: { padding: 22 },
  widgetCompact: { minHeight: 150 },
  widgetFull: { width: 520, minHeight: 620 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { letterSpacing: 1.8, marginBottom: 2 },
  title: { fontSize: 34 },
  statusPill: { paddingHorizontal: spacing.lg, paddingVertical: 7, alignSelf: 'center' },
  autoButton: { paddingHorizontal: 17, paddingVertical: 9, backgroundColor: colors.climateAuto, borderColor: colors.climateAuto },
  autoButtonActive: { backgroundColor: colors.climateAutoActive, borderColor: colors.climateAutoActive },
  controlSection: { marginTop: 28 },
  sectionLabel: { marginBottom: spacing.md },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 42, marginTop: spacing.sm },
  temperatureRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  temperatureValue: { fontSize: 42, lineHeight: 50, letterSpacing: 0, minWidth: 78 },
  temperatureUnit: { fontSize: 13 },
  airflowRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  airflowHeading: { marginTop: 28 },
  airflowButton: { alignItems: 'center', justifyContent: 'center', width: 86, minHeight: 70, borderRadius: radius.card, gap: 5 },
  utilityRows: { marginTop: 18, gap: 14 },
  utilityRow: { flexDirection: 'row', gap: 14 },
  utilityButton: { alignItems: 'flex-start', justifyContent: 'flex-start', width: 140, minHeight: 82, borderRadius: radius.card, gap: 10, paddingHorizontal: 2 },
  utilityLabel: { fontSize: 11 },
  compactFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
});
