import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, ScrollView, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/src/theme';
import { MapboxMap, MapStyle } from '@/src/components/MapboxMap';
import { useToast } from '@/src/components/Toast';
import { useUserLocation } from '@/src/hooks/use-user-location';
import { geocodeSearch, fetchDirections, formatDistanceKm, formatDurationMin, etaClock, GeocodeFeature, Directions } from '@/src/lib/mapbox';

type Coord = [number, number];

export function RightNavigationMapPanel({ testID }: { testID?: string }) {
  const toast = useToast();
  const loc = useUserLocation();
  const [time, setTime] = useState(new Date());
  const [query, setQuery] = useState('');
  const [features, setFeatures] = useState<GeocodeFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [destination, setDestination] = useState<GeocodeFeature | null>(null);
  const [directions, setDirections] = useState<Directions | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(iv);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setFeatures([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const proximity: Coord | undefined = loc.coords ? [loc.coords.lng, loc.coords.lat] : undefined;
      const res = await geocodeSearch(query, proximity);
      setFeatures(res);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, loc.coords?.lng, loc.coords?.lat]);

  const selectDestination = async (f: GeocodeFeature) => {
    setDestination(f);
    setShowResults(false);
    setQuery(f.text);
    setNavigating(false);
    if (!loc.coords) return;
    setLoadingRoute(true);
    const dirs = await fetchDirections([loc.coords.lng, loc.coords.lat], f.center);
    setDirections(dirs);
    setLoadingRoute(false);
    if (!dirs) toast.show('Could not calculate route');
  };

  const clearRoute = () => {
    setDestination(null);
    setDirections(null);
    setQuery('');
    setNavigating(false);
  };

  const startNavigation = () => {
    if (!directions) { toast.show('Search a destination first'); return; }
    setNavigating(true);
    setShowResults(false);
    setShowLayerMenu(false);
    toast.show('Navigation started');
  };

  const origin: Coord | null = loc.coords ? [loc.coords.lng, loc.coords.lat] : null;
  const dest: Coord | null = destination?.center ?? null;
  const routeCoords = directions?.geometry.coordinates ?? null;

  const hh = time.getHours() % 12 || 12;
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ampm = time.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <View style={styles.root} testID={testID ?? 'right-map-panel'}>
      <View style={StyleSheet.absoluteFill}>
        <MapboxMap
          origin={origin}
          destination={dest}
          route={routeCoords}
          followUser
          navigating={navigating}
          mapStyle={mapStyle}
          testID="mapbox-map"
        />
      </View>

      {/* Top overlay row — hidden while navigating */}
      {!navigating && (
      <View style={styles.topRow} pointerEvents="box-none">
        <View style={styles.lockPill} pointerEvents="none">
          <MaterialCommunityIcons name="lock-outline" size={16} color={theme.colors.onSurfaceLight} />
        </View>

        <View style={styles.searchWrap} testID="dest-search">
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.onSurfaceLight} />
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setShowResults(true); }}
              placeholder="Search destination"
              placeholderTextColor="#7A7F88"
              onFocus={() => setShowResults(true)}
              style={styles.searchInput}
              testID="dest-search-input"
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color={theme.colors.brand} />}
            {query.length > 0 && !searching && (
              <Pressable onPress={() => { setQuery(''); setFeatures([]); clearRoute(); }} hitSlop={6} testID="dest-search-clear">
                <MaterialCommunityIcons name="close-circle" size={16} color="#7A7F88" />
              </Pressable>
            )}
          </View>
          {showResults && features.length > 0 && (
            <View style={styles.results} testID="search-results">
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 260 }}>
                {features.map((f) => (
                  <Pressable
                    key={f.id}
                    style={styles.resultRow}
                    testID={`search-result-${f.id}`}
                    onPress={() => selectDestination(f)}
                  >
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.brand} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle} numberOfLines={1}>{f.text}</Text>
                      <Text style={styles.resultSub} numberOfLines={1}>{f.place_name}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.rightGroup}>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{hh}:{mm} <Text style={styles.timeAmpm}>{ampm}</Text></Text>
          </View>
          <View style={styles.badgePill}>
            <MaterialCommunityIcons name="signal" size={14} color={theme.colors.onSurfaceLight} />
            <Text style={styles.badgeText}>4G</Text>
            <MaterialCommunityIcons name="bluetooth" size={14} color={theme.colors.brand} />
          </View>
        </View>
      </View>
      )}

      {/* When navigating: compact top bar */}
      {navigating && (
        <View style={styles.navTopBar} testID="nav-top-bar">
          <MaterialCommunityIcons name="navigation" size={18} color={theme.colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navTopTitle} numberOfLines={1}>{destination?.text}</Text>
            <Text style={styles.navTopSub} numberOfLines={1}>
              {directions ? `${formatDurationMin(directions.duration)} · ${formatDistanceKm(directions.distance)} · ETA ${etaClock(directions.duration)}` : ''}
            </Text>
          </View>
          <View style={styles.timePillCompact}>
            <Text style={styles.timeText}>{hh}:{mm} <Text style={styles.timeAmpm}>{ampm}</Text></Text>
          </View>
        </View>
      )}

      {/* Layer switcher */}
      <MapLayerSwitcher
        current={mapStyle}
        onChange={setMapStyle}
        open={showLayerMenu}
        setOpen={setShowLayerMenu}
      />

      {/* Location permission banner */}
      {!loc.loading && loc.granted === false && !navigating && (
        <View style={styles.permBanner} testID="location-perm-banner">
          <MaterialCommunityIcons name="crosshairs-off" size={16} color={theme.colors.onSurfaceLight} />
          <Text style={styles.permText}>Enable location to find routes from your position</Text>
          {loc.canAskAgain ? (
            <Pressable onPress={loc.refresh} style={styles.permBtn} testID="btn-enable-loc">
              <Text style={styles.permBtnText}>Enable</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => Platform.OS !== 'web' && Linking.openSettings()} style={styles.permBtn} testID="btn-open-settings">
              <Text style={styles.permBtnText}>Open Settings</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Recenter button */}
      <Pressable style={styles.recenterBtn} testID="btn-recenter" onPress={loc.refresh}>
        <MaterialCommunityIcons name="crosshairs-gps" size={20} color={theme.colors.onSurfaceLight} />
      </Pressable>

      {/* Route card */}
      {destination && (
        <RouteOverviewCard
          destination={destination}
          directions={directions}
          loading={loadingRoute}
          onGo={startNavigation}
          onCancel={clearRoute}
          navigating={navigating}
        />
      )}

      {/* Empty-state hint when no destination */}
      {!destination && !navigating && (
        <View style={styles.hintCard} testID="route-hint-card">
          <MaterialCommunityIcons name="map-search" size={22} color={theme.colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hintTitle}>Where to?</Text>
            <Text style={styles.hintSub}>Search a destination to plan your route</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function RouteOverviewCard({
  destination, directions, loading, onGo, onCancel, navigating,
}: {
  destination: GeocodeFeature;
  directions: Directions | null;
  loading: boolean;
  onGo: () => void;
  onCancel: () => void;
  navigating: boolean;
}) {
  const dist = directions ? formatDistanceKm(directions.distance) : '—';
  const dur = directions ? formatDurationMin(directions.duration) : '—';
  const eta = directions ? etaClock(directions.duration) : '—';

  return (
    <View style={styles.routeCard} testID="route-overview-card">
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1613400832712-fdac59fadc2f?w=400&h=300&fit=crop&q=80' }}
        style={styles.routeThumb}
        contentFit="cover"
        transition={200}
        testID="dest-thumb"
      />

      <View style={styles.routeInfo}>
        <Text style={styles.stationName} numberOfLines={1} testID="dest-name">{destination.text}</Text>
        <Text style={styles.stationAddr} numberOfLines={1} testID="dest-address">{destination.place_name}</Text>
        <View style={styles.iconRow}>
          <SmallIconBtn icon="crosshairs-gps" testID="rc-recenter" />
          <SmallIconBtn icon="account-multiple" testID="rc-people" />
          <SmallIconBtn icon="ray-vertex" testID="rc-altroute" />
        </View>
      </View>

      <View style={styles.timelineCol}>
        <View style={styles.timelineHeader}>
          <MaterialCommunityIcons name="play" size={14} color={theme.colors.onSurfaceLight} />
          <View style={styles.timelineTrack}>
            <View style={styles.timelineBase} />
            {directions && (
              <>
                <View style={styles.timelineFill} />
                <View style={styles.timelineWarn}>
                  <MaterialCommunityIcons name="alert" size={10} color="#fff" />
                </View>
              </>
            )}
          </View>
          <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.brand} />
        </View>
        <View style={styles.etaRow}>
          <View style={styles.etaBlock}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaTime} testID="eta-clock">{loading ? '—' : eta}</Text>
          </View>
          <View style={styles.etaBlock}>
            <Text style={styles.etaLabel}>DURATION</Text>
            <Text style={styles.etaTime} testID="eta-dur">{loading ? '—' : dur}</Text>
          </View>
          <View style={styles.etaBlock}>
            <Text style={styles.etaLabel}>DISTANCE</Text>
            <Text style={styles.etaTime} testID="eta-dist">{loading ? '—' : dist}</Text>
          </View>
        </View>
      </View>

      <View style={styles.ctaCol}>
        {loading ? (
          <View style={styles.goBtnLoading} testID="btn-go-loading">
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <Pressable
            style={[styles.goBtn, navigating && { backgroundColor: theme.colors.success }]}
            testID="btn-go"
            onPress={onGo}
            disabled={!directions}
          >
            <MaterialCommunityIcons name={navigating ? 'navigation' : 'play'} size={16} color="#FFFFFF" />
            <Text style={styles.goText}>{navigating ? 'NAVIGATING' : 'GO'}</Text>
          </Pressable>
        )}
        <Pressable style={styles.cancelBtn} testID="btn-cancel" onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SmallIconBtn({ icon, testID }: { icon: any; testID: string }) {
  return (
    <Pressable style={styles.smallIconBtn} testID={testID}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.onSurfaceLight} />
    </Pressable>
  );
}

const LAYER_OPTIONS: Array<{ key: MapStyle; label: string; icon: any }> = [
  { key: 'streets', label: 'Streets', icon: 'road-variant' },
  { key: 'satellite', label: 'Satellite', icon: 'satellite-variant' },
  { key: 'outdoors', label: 'Terrain', icon: 'terrain' },
  { key: 'dark', label: 'Dark', icon: 'weather-night' },
  { key: '3d', label: '3D', icon: 'cube-outline' },
];

function MapLayerSwitcher({
  current, onChange, open, setOpen,
}: {
  current: MapStyle; onChange: (s: MapStyle) => void;
  open: boolean; setOpen: (v: boolean) => void;
}) {
  return (
    <View style={styles.layerWrap} testID="layer-switcher">
      {open && (
        <View style={styles.layerMenu}>
          {LAYER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={[styles.layerOpt, current === opt.key && styles.layerOptActive]}
              onPress={() => { onChange(opt.key); setOpen(false); }}
              testID={`layer-${opt.key}`}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={18}
                color={current === opt.key ? theme.colors.brand : theme.colors.onSurfaceLight}
              />
              <Text style={[styles.layerLbl, current === opt.key && { color: theme.colors.brand }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        style={styles.layerBtn}
        onPress={() => setOpen(!open)}
        testID="btn-layer-toggle"
      >
        <MaterialCommunityIcons name="layers" size={20} color={theme.colors.onSurfaceLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, position: 'relative',
    backgroundColor: theme.colors.surfaceLight,
    overflow: 'hidden',
    borderRadius: theme.radius.xl,
  },

  topRow: {
    position: 'absolute', top: theme.spacing.md,
    left: theme.spacing.md, right: theme.spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm,
    zIndex: 20,
  },
  lockPill: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFFE6', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  searchWrap: { flex: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: '#FFFFFFEE', borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  searchInput: {
    flex: 1, color: theme.colors.onSurfaceLight,
    fontFamily: theme.font.text, fontSize: 14,
    // @ts-ignore
    outlineStyle: 'none',
  },
  results: {
    marginTop: theme.spacing.sm, backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 6,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EEF0F2',
  },
  resultTitle: { fontFamily: theme.font.textBold, fontSize: 13, color: theme.colors.onSurfaceLight },
  resultSub: { fontFamily: theme.font.text, fontSize: 11, color: '#7A7F88', marginTop: 1 },

  rightGroup: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  timePill: {
    backgroundColor: '#FFFFFFCC', paddingHorizontal: theme.spacing.md, paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  timeText: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurfaceLight, letterSpacing: 0.5 },
  timeAmpm: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceLight },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFFCC', paddingHorizontal: theme.spacing.md, paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  badgeText: { fontFamily: theme.font.textBold, fontSize: 11, color: theme.colors.onSurfaceLight },

  permBanner: {
    position: 'absolute', top: 70, left: theme.spacing.md, right: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: '#FFF8E1', borderColor: '#FBD38D', borderWidth: 1,
    borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
  },
  permText: { flex: 1, fontFamily: theme.font.text, fontSize: 12, color: '#7B5E00' },
  permBtn: {
    backgroundColor: '#F59E0B', paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.pill,
  },
  permBtnText: { fontFamily: theme.font.textBold, fontSize: 11, color: '#FFFFFF' },

  recenterBtn: {
    position: 'absolute', right: theme.spacing.md, bottom: 200,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 4,
  },

  hintCard: {
    position: 'absolute', left: theme.spacing.md, right: theme.spacing.md, bottom: theme.spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: theme.radius.xl,
    padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  hintTitle: { fontFamily: theme.font.displayMedium, fontSize: 20, color: theme.colors.onSurfaceLight },
  hintSub: { fontFamily: theme.font.text, fontSize: 12, color: '#7A7F88', marginTop: 2 },

  routeCard: {
    position: 'absolute',
    left: theme.spacing.md, right: theme.spacing.md, bottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  routeThumb: { width: 84, height: 76, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  routeInfo: { flex: 1.4, gap: 4, paddingRight: theme.spacing.md, borderRightWidth: 1, borderRightColor: '#EAECEF' },
  stationName: { fontFamily: theme.font.displayMedium, fontSize: 18, color: theme.colors.onSurfaceLight, letterSpacing: 0.3 },
  stationAddr: { fontFamily: theme.font.text, fontSize: 11, color: '#6B7280' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  smallIconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F6' },

  timelineCol: { flex: 1.5, gap: 8, paddingHorizontal: theme.spacing.md, borderRightWidth: 1, borderRightColor: '#EAECEF' },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  timelineTrack: { flex: 1, height: 6, backgroundColor: '#E4E7EB', borderRadius: 3, position: 'relative' },
  timelineBase: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 3, backgroundColor: '#E4E7EB' },
  timelineFill: { position: 'absolute', left: '30%', width: '20%', height: 6, borderRadius: 3, backgroundColor: '#E53E3E' },
  timelineWarn: {
    position: 'absolute', left: '52%', top: -8,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF9D2E',
    alignItems: 'center', justifyContent: 'center',
  },
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
  etaBlock: { alignItems: 'flex-start', gap: 1 },
  etaLabel: { fontFamily: theme.font.textBold, fontSize: 9, letterSpacing: 1, color: '#7A7F88' },
  etaTime: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurfaceLight, letterSpacing: 0.3 },

  ctaCol: { gap: theme.spacing.sm, alignItems: 'stretch', minWidth: 110 },
  goBtn: {
    flexDirection: 'row', gap: 6, justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl, paddingVertical: 12,
    borderRadius: theme.radius.pill, backgroundColor: theme.colors.brand,
    alignItems: 'center',
    shadowColor: theme.colors.brand, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3,
  },
  goBtnLoading: {
    paddingHorizontal: theme.spacing.xl, paddingVertical: 12,
    borderRadius: theme.radius.pill, backgroundColor: theme.colors.brand,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  goText: { fontFamily: theme.font.textBold, fontSize: 13, color: '#FFFFFF', letterSpacing: 1.5 },
  cancelBtn: {
    paddingHorizontal: theme.spacing.xl, paddingVertical: 10,
    borderRadius: theme.radius.pill, backgroundColor: '#F1F3F6', alignItems: 'center',
  },
  cancelText: { fontFamily: theme.font.textBold, fontSize: 12, color: '#4A4E56' },

  navTopBar: {
    position: 'absolute', top: theme.spacing.md,
    left: theme.spacing.md, right: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: '#FFFFFFEE', borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 10, elevation: 4,
    zIndex: 20,
  },
  navTopTitle: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurfaceLight, letterSpacing: 0.3 },
  navTopSub: { fontFamily: theme.font.text, fontSize: 11, color: '#6B7280', marginTop: 1 },
  timePillCompact: { paddingHorizontal: theme.spacing.md, paddingVertical: 4, backgroundColor: '#F1F3F6', borderRadius: theme.radius.pill },

  layerWrap: {
    position: 'absolute', right: theme.spacing.md, top: 80,
    alignItems: 'flex-end', gap: theme.spacing.sm,
    zIndex: 15,
  },
  layerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 4,
  },
  layerMenu: {
    backgroundColor: '#FFFFFF', borderRadius: theme.radius.md,
    padding: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 4,
    minWidth: 140,
  },
  layerOpt: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  layerOptActive: { backgroundColor: '#EAF1FF' },
  layerLbl: { fontFamily: theme.font.textBold, fontSize: 12, color: theme.colors.onSurfaceLight, letterSpacing: 0.3 },
});
