import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { MapView } from '@/src/components/MapView';
import { api, Destination } from '@/src/api';

export default function NavigationScreen() {
  const [dests, setDests] = useState<Destination[]>([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Destination | null>(null);

  useEffect(() => {
    api.destinations().then(setDests).catch(() => {});
  }, []);

  const runSearch = async (q: string) => {
    setQuery(q);
    try {
      const results = await api.searchDestinations(q);
      setDests(results);
    } catch {}
  };

  const filtered = dests;

  return (
    <View style={styles.root} testID="navigation-screen">
      <View style={styles.mapWrap}>
        <MapView width={900} height={800} vehiclePos={active ? 0.6 : 0.35} />
      </View>

      <View style={styles.panel} testID="nav-panel">
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceSecondary} />
          <TextInput
            testID="nav-search-input"
            placeholder="Search destination"
            placeholderTextColor={theme.colors.onSurfaceSecondary}
            value={query}
            onChangeText={runSearch}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => runSearch('')} testID="nav-search-clear">
              <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.onSurfaceSecondary} />
            </Pressable>
          )}
        </View>

        {active && (
          <View style={styles.activeCard} testID="active-route-card">
            <Text style={styles.activeLabel}>ACTIVE ROUTE</Text>
            <Text style={styles.activeName}>{active.name}</Text>
            <Text style={styles.activeAddr}>{active.address}</Text>
            <View style={styles.activeStats}>
              <StatBlock label="ETA" value={`${active.eta_minutes}`} unit="MIN" />
              <StatBlock label="DIST" value={`${active.distance_km.toFixed(1)}`} unit="KM" />
              <StatBlock label="ARRIVE" value={arriveIn(active.eta_minutes)} />
            </View>
            <Pressable style={styles.stopBtn} onPress={() => setActive(null)} testID="stop-route-btn">
              <MaterialCommunityIcons name="close" size={18} color={theme.colors.onSurface} />
              <Text style={styles.stopText}>End Route</Text>
            </Pressable>
          </View>
        )}

        {!active && (
          <>
            <Text style={styles.sectionHead}>SUGGESTED</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {filtered.map((d) => (
                <Pressable
                  key={d.id}
                  style={styles.destRow}
                  testID={`dest-${d.id}`}
                  onPress={() => setActive(d)}
                >
                  <View style={styles.destIcon}>
                    <MaterialCommunityIcons
                      name={
                        d.category === 'home' ? 'home' :
                        d.category === 'work' ? 'briefcase' :
                        d.category === 'favorite' ? 'star' : 'clock-outline'
                      }
                      size={22}
                      color={theme.colors.brand}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.destName}>{d.name}</Text>
                    <Text style={styles.destAddr} numberOfLines={1}>{d.address}</Text>
                  </View>
                  <View style={styles.destMeta}>
                    <Text style={styles.destEta}>{d.eta_minutes}</Text>
                    <Text style={styles.destEtaUnit}>MIN</Text>
                  </View>
                </Pressable>
              ))}
              {filtered.length === 0 && (
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="map-search" size={44} color={theme.colors.onSurfaceSecondary} />
                  <Text style={styles.emptyText}>No destinations found</Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

function arriveIn(mins: number) {
  const d = new Date(Date.now() + mins * 60_000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function StatBlock({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.md },
  mapWrap: { flex: 1, borderRadius: theme.radius.lg, overflow: 'hidden' },
  panel: {
    width: 340, backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceTertiary,
    borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md,
    height: 52, gap: theme.spacing.sm,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, color: theme.colors.onSurface, fontFamily: theme.font.text, fontSize: 15 },
  sectionHead: {
    fontFamily: theme.font.textBold, fontSize: 11, letterSpacing: 2,
    color: theme.colors.onSurfaceSecondary, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
  },
  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.divider,
    minHeight: 60,
  },
  destIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.brandTertiary,
  },
  destName: { fontFamily: theme.font.displayMedium, fontSize: 18, color: theme.colors.onSurface },
  destAddr: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 1 },
  destMeta: { alignItems: 'center' },
  destEta: { fontFamily: theme.font.display, fontSize: 22, color: theme.colors.brand, lineHeight: 22 },
  destEtaUnit: { fontFamily: theme.font.textBold, fontSize: 9, color: theme.colors.onSurfaceSecondary, letterSpacing: 1 },

  activeCard: {
    marginTop: theme.spacing.md, padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceTertiary, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.brand,
  },
  activeLabel: { fontFamily: theme.font.textBold, fontSize: 10, letterSpacing: 2, color: theme.colors.brand },
  activeName: { fontFamily: theme.font.display, fontSize: 26, color: theme.colors.onSurface, marginTop: 4, letterSpacing: 0.4 },
  activeAddr: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  activeStats: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  statBlock: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, padding: theme.spacing.sm },
  statLabel: { fontFamily: theme.font.textBold, fontSize: 9, letterSpacing: 1.5, color: theme.colors.onSurfaceSecondary },
  statValue: { fontFamily: theme.font.display, fontSize: 22, color: theme.colors.onSurface, lineHeight: 24, marginTop: 2 },
  statUnit: { fontFamily: theme.font.text, fontSize: 10, color: theme.colors.onSurfaceSecondary },
  stopBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    marginTop: theme.spacing.md, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, paddingVertical: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  stopText: { fontFamily: theme.font.textBold, fontSize: 13, color: theme.colors.onSurface, letterSpacing: 1 },

  emptyBox: { alignItems: 'center', paddingVertical: theme.spacing.xxl, gap: theme.spacing.sm },
  emptyText: { fontFamily: theme.font.text, fontSize: 13, color: theme.colors.onSurfaceSecondary },
});
