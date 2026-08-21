import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '@/src/theme';
import { api, Contact, CallLog } from '@/src/api';

const DIAL_KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

export default function ContactsScreen() {
  const params = useLocalSearchParams<{ call?: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [tab, setTab] = useState<'RECENTS' | 'CONTACTS'>('RECENTS');
  const [dialed, setDialed] = useState('');
  const [inCall, setInCall] = useState<Contact | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);

  const refresh = async () => {
    const [c, l] = await Promise.all([api.contacts(), api.callLogs()]);
    setContacts(c); setLogs(l);
  };
  useEffect(() => { refresh().catch(() => {}); }, []);

  useEffect(() => {
    if (params?.call) {
      const c = contacts.find((x) => x.id === params.call);
      if (c) startCall(c);
    }
  }, [params?.call, contacts.length]);

  useEffect(() => {
    if (!inCall) return;
    const iv = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [inCall]);

  const startCall = (c: Contact) => {
    setInCall(c);
    setCallSeconds(0);
  };
  const endCall = async () => {
    if (!inCall) return;
    try {
      await api.addCallLog({
        contact_id: inCall.id, name: inCall.name, phone: inCall.phone,
        direction: 'outgoing', duration: callSeconds,
      });
      await refresh();
    } catch {}
    setInCall(null);
    setCallSeconds(0);
  };

  const sorted = useMemo(() => contacts.slice().sort((a, b) => a.name.localeCompare(b.name)), [contacts]);

  return (
    <View style={styles.root} testID="contacts-screen">
      {/* LEFT */}
      <View style={styles.leftPane}>
        <View style={styles.tabRow}>
          {(['RECENTS', 'CONTACTS'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              testID={`contacts-tab-${t.toLowerCase()}`}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {tab === 'RECENTS' && logs.map((l) => (
            <Pressable
              key={l.id}
              style={styles.row}
              testID={`call-log-${l.id}`}
              onPress={() => {
                const c = contacts.find((x) => x.id === l.contact_id) ?? { id: 'x', name: l.name, phone: l.phone, favorite: false };
                startCall(c as Contact);
              }}
            >
              <View style={[styles.avatarWrap, l.direction === 'missed' && { borderColor: theme.colors.error }]}>
                <MaterialCommunityIcons
                  name={l.direction === 'incoming' ? 'phone-incoming' : l.direction === 'outgoing' ? 'phone-outgoing' : 'phone-missed'}
                  size={20}
                  color={l.direction === 'missed' ? theme.colors.error : theme.colors.brand}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{l.name}</Text>
                <Text style={styles.rowSub}>{l.phone} · {l.direction}</Text>
              </View>
              {l.duration > 0 && <Text style={styles.rowMeta}>{fmtDuration(l.duration)}</Text>}
            </Pressable>
          ))}
          {tab === 'CONTACTS' && sorted.map((c) => (
            <Pressable
              key={c.id}
              style={styles.row}
              testID={`contact-${c.id}`}
              onPress={() => startCall(c)}
            >
              {c.avatar ? (
                <Image source={{ uri: c.avatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarInitial}>{c.name[0]}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{c.name}</Text>
                <Text style={styles.rowSub}>{c.phone}</Text>
              </View>
              {c.favorite && <MaterialCommunityIcons name="star" size={18} color={theme.colors.brand} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* RIGHT: Dialpad or In-Call */}
      <View style={styles.rightPane}>
        {inCall ? (
          <View style={styles.callView} testID="in-call-view">
            {inCall.avatar ? (
              <Image source={{ uri: inCall.avatar }} style={styles.callAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.callAvatar, { backgroundColor: theme.colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontFamily: theme.font.display, fontSize: 60, color: theme.colors.onSurface }}>{inCall.name[0]}</Text>
              </View>
            )}
            <Text style={styles.callName}>{inCall.name}</Text>
            <Text style={styles.callPhone}>{inCall.phone}</Text>
            <Text style={styles.callTimer}>{fmtDuration(callSeconds)}</Text>
            <View style={styles.callActions}>
              <CallActBtn icon="microphone-off" label="MUTE" />
              <CallActBtn icon="volume-high" label="SPEAKER" active />
              <CallActBtn icon="keyboard" label="KEYPAD" />
            </View>
            <Pressable style={styles.endCallBtn} onPress={endCall} testID="end-call-btn">
              <MaterialCommunityIcons name="phone-hangup" size={30} color="#FFFFFF" />
              <Text style={styles.endCallText}>END CALL</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.dialWrap}>
            <View style={styles.dialDisplay}>
              <TextInput
                value={dialed}
                onChangeText={setDialed}
                placeholder="Enter number"
                placeholderTextColor={theme.colors.onSurfaceSecondary}
                style={styles.dialInput}
                keyboardType="phone-pad"
                testID="dial-input"
              />
              {dialed.length > 0 && (
                <Pressable onPress={() => setDialed((s) => s.slice(0, -1))} testID="dial-backspace">
                  <MaterialCommunityIcons name="backspace" size={22} color={theme.colors.onSurfaceSecondary} />
                </Pressable>
              )}
            </View>
            <View style={styles.dialGrid}>
              {DIAL_KEYS.map(([num, sub]) => (
                <Pressable
                  key={num}
                  style={styles.dialKey}
                  testID={`dial-key-${num}`}
                  onPress={() => setDialed((s) => s + num)}
                >
                  <Text style={styles.dialNum}>{num}</Text>
                  {sub ? <Text style={styles.dialSub}>{sub}</Text> : <Text style={styles.dialSub}> </Text>}
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.callBtn, !dialed && { opacity: 0.4 }]}
              disabled={!dialed}
              testID="dial-call-btn"
              onPress={() => startCall({ id: 'manual', name: 'Unknown', phone: dialed, favorite: false })}
            >
              <MaterialCommunityIcons name="phone" size={28} color={theme.colors.onBrandPrimary} />
              <Text style={styles.callBtnText}>CALL</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function CallActBtn({ icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <View style={[styles.callActBtn, active && { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand }]}>
      <MaterialCommunityIcons name={icon} size={22} color={active ? theme.colors.onBrandPrimary : theme.colors.onSurface} />
      <Text style={[styles.callActLabel, active && { color: theme.colors.onBrandPrimary }]}>{label}</Text>
    </View>
  );
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.md },
  leftPane: {
    flex: 1, backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  rightPane: {
    flex: 1, backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md, justifyContent: 'space-between',
  },
  tabRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  tab: {
    flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border,
  },
  tabActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  tabText: { fontFamily: theme.font.textBold, fontSize: 12, color: theme.colors.onSurfaceSecondary, letterSpacing: 1.5 },
  tabTextActive: { color: theme.colors.onBrandPrimary },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    minHeight: 60,
  },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.brandTertiary, borderWidth: 1, borderColor: theme.colors.brand,
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarInitial: { fontFamily: theme.font.display, fontSize: 22, color: theme.colors.onSurface },
  rowName: { fontFamily: theme.font.displayMedium, fontSize: 18, color: theme.colors.onSurface },
  rowSub: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  rowMeta: { fontFamily: theme.font.display, fontSize: 14, color: theme.colors.onSurfaceSecondary },

  dialWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md },
  dialDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    width: '80%', paddingBottom: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  dialInput: { flex: 1, fontFamily: theme.font.display, fontSize: 34, color: theme.colors.onSurface, letterSpacing: 2, textAlign: 'center' },
  dialGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '80%', justifyContent: 'space-between', rowGap: theme.spacing.sm },
  dialKey: {
    width: '30%', height: 64, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.surfaceTertiary, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  dialNum: { fontFamily: theme.font.display, fontSize: 26, color: theme.colors.onSurface, letterSpacing: 1 },
  dialSub: { fontFamily: theme.font.textBold, fontSize: 9, letterSpacing: 2, color: theme.colors.onSurfaceSecondary, marginTop: -2 },
  callBtn: {
    marginTop: theme.spacing.md, flexDirection: 'row', gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand, paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill, alignItems: 'center',
  },
  callBtnText: { fontFamily: theme.font.textBold, fontSize: 14, letterSpacing: 2, color: theme.colors.onBrandPrimary },

  callView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  callAvatar: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: theme.colors.brand },
  callName: { fontFamily: theme.font.display, fontSize: 32, color: theme.colors.onSurface, letterSpacing: 1 },
  callPhone: { fontFamily: theme.font.text, fontSize: 14, color: theme.colors.onSurfaceSecondary },
  callTimer: { fontFamily: theme.font.display, fontSize: 28, color: theme.colors.brand, letterSpacing: 2, marginTop: theme.spacing.md },
  callActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  callActBtn: {
    width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border, gap: 2,
    backgroundColor: theme.colors.surfaceTertiary,
  },
  callActLabel: { fontFamily: theme.font.textBold, fontSize: 8, letterSpacing: 1, color: theme.colors.onSurface },
  endCallBtn: {
    marginTop: theme.spacing.lg, flexDirection: 'row', gap: theme.spacing.sm,
    backgroundColor: theme.colors.error, paddingHorizontal: theme.spacing.xxl, paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill, alignItems: 'center',
  },
  endCallText: { fontFamily: theme.font.textBold, fontSize: 14, color: '#FFFFFF', letterSpacing: 2 },
});
