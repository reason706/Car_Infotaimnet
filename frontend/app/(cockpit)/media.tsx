import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList, ActivityIndicator, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { api, Track, Video } from '@/src/api';
import { usePlayer } from '@/src/state/player';

const TABS = ['MUSIC', 'VIDEOS'] as const;
type Tab = typeof TABS[number];
const SOURCES = ['OFFLINE', 'YOUTUBE MUSIC', 'SPOTIFY', 'RADIOS'] as const;
type Source = typeof SOURCES[number];
const RADIO_COUNTRIES = [
  { label: 'United States', code: 'US' }, { label: 'United Kingdom', code: 'GB' },
  { label: 'Canada', code: 'CA' }, { label: 'Germany', code: 'DE' },
  { label: 'India', code: 'IN' }, { label: 'Japan', code: 'JP' },
];
type RadioStation = { stationuuid: string; name: string; country: string; favicon: string; url_resolved: string; homepage: string };

export default function MediaScreen() {
  const player = usePlayer();
  const [tab, setTab] = useState<Tab>('MUSIC');
  const [source, setSource] = useState<Source>('OFFLINE');
  const [videos, setVideos] = useState<Video[]>([]);
  const [country, setCountry] = useState('US');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loadingRadios, setLoadingRadios] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<'youtube' | 'spotify' | null>(null);

  useEffect(() => { api.videos().then(setVideos).catch(() => {}); }, []);

  useEffect(() => {
    if (source !== 'RADIOS') return;
    setLoadingRadios(true);
    fetch(`https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${country}?limit=24&order=clickcount&reverse=true`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: RadioStation[]) => setStations(data.filter((station) => station.url_resolved)))
      .catch(() => setStations([]))
      .finally(() => setLoadingRadios(false));
  }, [country, source]);

  const importOfflineMusic = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*', multiple: true, copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const tracks = result.assets.map((asset) => ({
      id: `offline-${asset.uri}`,
      title: asset.name.replace(/\.[^/.]+$/, ''),
      artist: 'Imported offline', album: 'Local library', duration: 240,
      artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80',
      genre: 'Offline', streamUrl: asset.uri,
    }));
    player.addTracks(tracks);
  };

  const playRadio = async (station: RadioStation) => {
    const track: Track = {
      id: `radio-${station.stationuuid}`, title: station.name, artist: station.country,
      album: 'Live radio', duration: 3600, artwork: station.favicon || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80', genre: 'Radio', streamUrl: station.url_resolved,
    };
    const queue = stations.map((item) => ({
      id: `radio-${item.stationuuid}`, title: item.name, artist: item.country,
      album: 'Live radio', duration: 3600, artwork: item.favicon || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80', genre: 'Radio', streamUrl: item.url_resolved,
    }));
    player.playExternal(track, queue);
  };

  return (
    <View style={styles.root} testID="media-screen">
      <View style={styles.header}>
        <Text style={styles.title}>MEDIA HUB</Text>
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              testID={`media-tab-${t.toLowerCase()}`}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'MUSIC' ? (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 140 }}>
          <View style={styles.sourceRow}>
            {SOURCES.map((item) => (
              <Pressable key={item} style={[styles.sourceBtn, source === item && styles.sourceBtnActive]} onPress={() => setSource(item)} testID={`media-source-${item.toLowerCase().replace(/ /g, '-')}`}>
                <MaterialCommunityIcons name={item === 'OFFLINE' ? 'download-circle-outline' : item === 'RADIOS' ? 'radio' : item === 'SPOTIFY' ? 'spotify' : 'youtube'} size={18} color={source === item ? theme.colors.onBrandPrimary : theme.colors.onSurfaceSecondary} />
                <Text style={[styles.sourceText, source === item && styles.sourceTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {source === 'OFFLINE' && <>
            <Pressable style={styles.importBox} onPress={importOfflineMusic} testID="btn-import-offline">
              <MaterialCommunityIcons name="music-box-outline" size={30} color={theme.colors.brand} />
              <View style={styles.importCopy}><Text style={styles.importTitle}>Import offline music</Text><Text style={styles.importBody}>Add MP3, M4A, WAV, or other audio files from this device.</Text></View>
              <MaterialCommunityIcons name="plus" size={24} color={theme.colors.brand} />
            </Pressable>
            <FlatList
            data={player.tracks} scrollEnabled={false} keyExtractor={(t) => t.id} numColumns={4}
            columnWrapperStyle={{ gap: theme.spacing.md }} ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
            renderItem={({ item }) => <TrackCard item={item} onPress={() => item.streamUrl ? player.playExternal(item, [item]) : player.play(item)} />}
          />
          </>}
          {source === 'YOUTUBE MUSIC' && <ProviderPanel provider="youtube" connected={connectedProvider === 'youtube'} onConnect={() => setConnectedProvider('youtube')} />}
          {source === 'SPOTIFY' && <ProviderPanel provider="spotify" connected={connectedProvider === 'spotify'} onConnect={() => setConnectedProvider('spotify')} />}
          {source === 'RADIOS' && <RadioPanel country={country} setCountry={setCountry} stations={stations} loading={loadingRadios} onPlay={playRadio} />}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 140 }}>
          <Text style={styles.section}>PARKED VIEWING</Text>
          <View style={styles.videoGrid}>
            {videos.map((v) => (
              <Pressable key={v.id} style={styles.videoCard} testID={`video-${v.id}`}>
                <Image source={{ uri: v.thumbnail }} style={styles.videoThumb} contentFit="cover" transition={200} />
                <View style={styles.videoBadge}>
                  <MaterialCommunityIcons name="play" size={14} color={theme.colors.onBrandPrimary} />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                  <Text style={styles.videoMeta}>{v.channel} · {Math.round(v.duration / 60)}m</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

    </View>
  );
}

function TrackCard({ item, onPress }: { item: Track; onPress: () => void }) {
  return <Pressable style={styles.card} testID={`track-${item.id}`} onPress={onPress}>
    <Image source={{ uri: item.artwork }} style={styles.cardArt} contentFit="cover" transition={200} />
    <View style={styles.playOverlay}><MaterialCommunityIcons name="play-circle" size={44} color={theme.colors.brand} /></View>
    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
    <Text style={styles.cardSub} numberOfLines={1}>{item.artist}</Text>
  </Pressable>;
}

function ProviderPanel({ provider, connected, onConnect }: { provider: 'youtube' | 'spotify'; connected: boolean; onConnect: () => void }) {
  const youtube = provider === 'youtube';
  const icon = youtube ? 'youtube' : 'spotify';
  const color = youtube ? '#FF3B30' : '#1ED760';
  const title = youtube ? 'YouTube Music' : 'Spotify';
  const url = youtube ? 'https://music.youtube.com/' : 'https://open.spotify.com/embed/';
  return <View style={styles.providerPanel}>
    <View style={[styles.providerIcon, { backgroundColor: color }]}><MaterialCommunityIcons name={icon} size={34} color="#FFFFFF" /></View>
    <View style={styles.providerCopy}><Text style={styles.providerTitle}>{title}</Text><Text style={styles.providerBody}>{connected ? 'Connected inside this cockpit session.' : `Sign in with your ${youtube ? 'Google' : 'Spotify'} account to listen here.`}</Text></View>
    <Pressable style={styles.openProviderBtn} onPress={onConnect} testID={`btn-connect-${provider}`}><Text style={styles.openProviderText}>{connected ? 'RELOAD' : 'SIGN IN'}</Text><MaterialCommunityIcons name="login" size={15} color="#FFFFFF" /></Pressable>
    {connected && <View style={styles.providerEmbed}>
      {Platform.OS === 'web' ? <iframe src={url} title={`${title} player`} style={{ width: '100%', height: 360, border: 0 }} /> : <WebView source={{ uri: url }} style={{ flex: 1 }} />}
    </View>}
  </View>;
}

function RadioPanel({ country, setCountry, stations, loading, onPlay }: { country: string; setCountry: (value: string) => void; stations: RadioStation[]; loading: boolean; onPlay: (station: RadioStation) => void }) {
  return <View>
    <Text style={styles.section}>LIVE RADIO BY COUNTRY</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countryRow}>
      {RADIO_COUNTRIES.map((item) => <Pressable key={item.code} style={[styles.countryBtn, country === item.code && styles.countryBtnActive]} onPress={() => setCountry(item.code)}><Text style={[styles.countryText, country === item.code && styles.countryTextActive]}>{item.label}</Text></Pressable>)}
    </ScrollView>
    {loading ? <ActivityIndicator color={theme.colors.brand} style={styles.loader} /> : <View style={styles.radioGrid}>
      {stations.map((station) => <Pressable key={station.stationuuid} style={styles.radioCard} onPress={() => onPlay(station)} testID={`radio-${station.stationuuid}`}>
        <View style={styles.radioArt}>{station.favicon ? <Image source={{ uri: station.favicon }} style={styles.radioLogo} contentFit="contain" /> : <MaterialCommunityIcons name="radio" size={30} color={theme.colors.brand} />}</View>
        <View style={{ flex: 1 }}><Text style={styles.radioName} numberOfLines={1}>{station.name}</Text><Text style={styles.radioMeta} numberOfLines={1}>{station.country}</Text></View>
        <MaterialCommunityIcons name="play-circle-outline" size={28} color={theme.colors.brand} />
      </Pressable>)}
    </View>}
    {!loading && stations.length === 0 && <Text style={styles.emptyText}>No stations found for this country.</Text>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  title: { fontFamily: theme.font.display, fontSize: 26, color: theme.colors.onSurface, letterSpacing: 2 },
  tabRow: { flexDirection: 'row', gap: theme.spacing.sm },
  tab: {
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border,
    minHeight: 44, justifyContent: 'center',
  },
  tabActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  tabText: { fontFamily: theme.font.textBold, fontSize: 12, color: theme.colors.onSurfaceSecondary, letterSpacing: 1.5 },
  tabTextActive: { color: theme.colors.onBrandPrimary },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  sourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 10 },
  sourceBtnActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  sourceText: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.onSurfaceSecondary, letterSpacing: 1 },
  sourceTextActive: { color: theme.colors.onBrandPrimary },
  importBox: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, marginBottom: theme.spacing.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.brand, borderRadius: theme.radius.lg, backgroundColor: theme.colors.brandTertiary },
  importCopy: { flex: 1 }, importTitle: { fontFamily: theme.font.displayMedium, fontSize: 20, color: theme.colors.onSurface }, importBody: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary, marginTop: 3 },

  card: { flex: 1, gap: 4 },
  cardArt: { width: '100%', aspectRatio: 1, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  playOverlay: {
    position: 'absolute', bottom: 44, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22,
  },
  cardTitle: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurface, marginTop: 6 },
  cardSub: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary },
  providerPanel: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.xl, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  providerIcon: { width: 64, height: 64, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1 }, providerTitle: { fontFamily: theme.font.display, fontSize: 25, color: theme.colors.onSurface }, providerBody: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 4 },
  openProviderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.brand, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 10 }, openProviderText: { fontFamily: theme.font.textBold, fontSize: 11, color: '#FFFFFF', letterSpacing: 1 },
  providerEmbed: { width: '100%', height: 360, marginTop: theme.spacing.lg, overflow: 'hidden', borderRadius: theme.radius.md, backgroundColor: '#FFFFFF' },
  countryRow: { gap: theme.spacing.sm, paddingBottom: theme.spacing.md }, countryBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 9 }, countryBtnActive: { borderColor: theme.colors.brand, backgroundColor: theme.colors.brand }, countryText: { fontFamily: theme.font.textBold, fontSize: 11, color: theme.colors.onSurfaceSecondary }, countryTextActive: { color: '#FFFFFF' },
  radioGrid: { gap: theme.spacing.sm }, radioCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }, radioArt: { width: 52, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center' }, radioLogo: { width: 42, height: 42 }, radioName: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurface }, radioMeta: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary, marginTop: 2 }, loader: { marginTop: theme.spacing.xl }, emptyText: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, paddingVertical: theme.spacing.xl },

  section: { fontFamily: theme.font.textBold, fontSize: 11, letterSpacing: 2, color: theme.colors.onSurfaceSecondary, marginBottom: theme.spacing.md },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  videoCard: { width: '31%', backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  videoThumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: theme.colors.surfaceTertiary },
  videoBadge: {
    position: 'absolute', bottom: 68, right: 10,
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  videoInfo: { padding: theme.spacing.md },
  videoTitle: { fontFamily: theme.font.displayMedium, fontSize: 15, color: theme.colors.onSurface },
  videoMeta: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary, marginTop: 4 },

});
