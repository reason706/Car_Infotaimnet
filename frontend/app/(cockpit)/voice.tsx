import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { AudioModule, useAudioRecorder, RecordingPresets } from 'expo-audio';
import { theme } from '@/src/theme';
import { api, VoiceIntent } from '@/src/api';
import { usePlayer } from '@/src/state/player';

const SUGGESTIONS = [
  "Play Midnight City",
  "Call Sarah Johnson",
  "Navigate to Office",
  "Play some rock music",
  "Set temperature to 22",
];

export default function VoiceScreen() {
  const router = useRouter();
  const player = usePlayer();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'result'>('idle');
  const [result, setResult] = useState<VoiceIntent | null>(null);
  const [text, setText] = useState('');
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: state === 'listening' ? scale.value : 1 }],
  }));

  const requestPerm = async () => {
    if (Platform.OS === 'web') return true;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      return !!perm.granted;
    } catch { return false; }
  };

  const startListening = async () => {
    if (Platform.OS === 'web') {
      // Web: skip audio, prompt for text via the input field
      setState('idle');
      return;
    }
    const granted = await requestPerm();
    if (!granted) return;
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('listening');
    } catch (e) {
      setState('idle');
    }
  };

  const stopListening = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setState('processing');
      if (uri) {
        const res = await api.voiceCommandAudio(uri);
        applyIntent(res);
      } else {
        setState('idle');
      }
    } catch {
      setState('idle');
    }
  };

  const submitText = async (t: string) => {
    if (!t.trim()) return;
    setState('processing');
    try {
      const res = await api.voiceCommandText(t);
      applyIntent(res);
    } catch {
      setState('idle');
    }
  };

  const applyIntent = (res: VoiceIntent) => {
    setResult(res);
    setState('result');
    if (res.intent === 'play_music' && res.target) {
      player.setByTitle(res.target);
    } else if (res.intent === 'navigate') {
      setTimeout(() => router.push('/(cockpit)/navigation'), 900);
    } else if (res.intent === 'call_contact') {
      setTimeout(() => router.push('/(cockpit)/contacts'), 900);
    }
  };

  const close = () => router.back();

  return (
    <View style={styles.root} testID="voice-screen">
      <View style={styles.topBar}>
        <Text style={styles.title}>VOICE COMMAND</Text>
        <Pressable onPress={close} style={styles.closeBtn} testID="voice-close">
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.pulseOuter, pulseStyle, state === 'listening' && { borderColor: theme.colors.brand }]}>
          <View style={styles.pulseInner}>
            <MaterialCommunityIcons
              name={state === 'processing' ? 'dots-horizontal' : 'microphone'}
              size={72}
              color={state === 'listening' ? theme.colors.brand : theme.colors.onSurface}
            />
          </View>
        </Animated.View>

        <Text style={styles.status} testID="voice-status">
          {state === 'idle' && 'Tap to speak or type below'}
          {state === 'listening' && 'Listening…'}
          {state === 'processing' && 'Processing…'}
          {state === 'result' && (result?.transcript || 'Command received')}
        </Text>

        {result && state === 'result' && (
          <View style={styles.resultCard} testID="voice-result">
            <Text style={styles.resultLabel}>INTENT</Text>
            <Text style={styles.resultIntent}>{result.intent.replace('_', ' ').toUpperCase()}</Text>
            {result.target ? <Text style={styles.resultTarget}>“{result.target}”</Text> : null}
          </View>
        )}

        <View style={styles.actionRow}>
          {Platform.OS !== 'web' && state !== 'processing' && (
            <Pressable
              onPress={state === 'listening' ? stopListening : startListening}
              style={[styles.recBtn, state === 'listening' && { backgroundColor: theme.colors.error }]}
              testID="voice-record-btn"
            >
              <MaterialCommunityIcons
                name={state === 'listening' ? 'stop' : 'microphone'}
                size={28}
                color={theme.colors.onBrandPrimary}
              />
              <Text style={styles.recText}>{state === 'listening' ? 'STOP' : 'HOLD TO TALK'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.textInputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Or type a command…"
            placeholderTextColor={theme.colors.onSurfaceSecondary}
            style={styles.textInput}
            onSubmitEditing={() => { submitText(text); setText(''); }}
            testID="voice-text-input"
          />
          <Pressable
            onPress={() => { submitText(text); setText(''); }}
            style={styles.sendBtn}
            testID="voice-text-send"
          >
            <MaterialCommunityIcons name="send" size={20} color={theme.colors.onBrandPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.suggestBar}>
        <Text style={styles.suggestHead}>TRY SAYING</Text>
        <View style={styles.chips}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              style={styles.chip}
              testID={`voice-suggest-${s}`}
              onPress={() => submitText(s)}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: theme.spacing.md },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.md },
  title: { fontFamily: theme.font.display, fontSize: 24, color: theme.colors.onSurface, letterSpacing: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSecondary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg },
  pulseOuter: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
  },
  pulseInner: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.colors.surfaceTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  status: { fontFamily: theme.font.displayMedium, fontSize: 22, color: theme.colors.onSurface, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: theme.spacing.xl },

  resultCard: {
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    alignItems: 'center', gap: 4,
  },
  resultLabel: { fontFamily: theme.font.textBold, fontSize: 10, letterSpacing: 2, color: theme.colors.brand },
  resultIntent: { fontFamily: theme.font.display, fontSize: 20, color: theme.colors.onSurface, letterSpacing: 1 },
  resultTarget: { fontFamily: theme.font.text, fontSize: 13, color: theme.colors.onSurfaceSecondary },

  actionRow: { alignItems: 'center' },
  recBtn: {
    flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center',
    backgroundColor: theme.colors.brand, paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill, minHeight: 56,
  },
  recText: { fontFamily: theme.font.textBold, fontSize: 13, color: theme.colors.onBrandPrimary, letterSpacing: 2 },

  textInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, width: '70%',
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.pill,
    borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: theme.spacing.md,
  },
  textInput: { flex: 1, height: 48, color: theme.colors.onSurface, fontFamily: theme.font.text, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' },

  suggestBar: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, gap: theme.spacing.sm },
  suggestHead: { fontFamily: theme.font.textBold, fontSize: 10, letterSpacing: 2, color: theme.colors.onSurfaceSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary, minHeight: 40, justifyContent: 'center',
  },
  chipText: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurface },
});
