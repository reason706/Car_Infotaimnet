import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { api, Track, Video } from '@/src/api';
import { usePlayer } from '@/src/state/player';
import { MusicPlayerWidget } from '@/src/components/MusicPlayerWidget';
import { storage } from '@/src/utils/storage';

const TABS = ['MUSIC', 'VIDEOS'] as const;
type Tab = typeof TABS[number];
const SOURCES = ['LOCAL', 'YOUTUBE MUSIC', 'SPOTIFY', 'RADIO'] as const;
type Source = typeof SOURCES[number];
const LIBRARY_TABS = ['ALBUMS', 'ALL', 'FAVORITES'] as const;
type LibraryTab = typeof LIBRARY_TABS[number];
type RadioCountry = { name: string; code: string; stationcount?: number };
const DEFAULT_RADIO_COUNTRIES: RadioCountry[] = [
  { name: 'United States', code: 'US' }, { name: 'United Kingdom', code: 'GB' },
  { name: 'Canada', code: 'CA' }, { name: 'Germany', code: 'DE' },
  { name: 'India', code: 'IN' }, { name: 'Japan', code: 'JP' },
];
type RadioStation = { stationuuid: string; name: string; country: string; favicon: string; url_resolved?: string; url?: string; homepage: string };

export default function MediaScreen() {
  const player = usePlayer();
  const [tab, setTab] = useState<Tab>('MUSIC');
  const [source, setSource] = useState<Source>('LOCAL');
  const [videos, setVideos] = useState<Video[]>([]);
  const [country, setCountry] = useState('US');
  const [radioCountries, setRadioCountries] = useState<RadioCountry[]>(DEFAULT_RADIO_COUNTRIES);
  const [countrySearch, setCountrySearch] = useState('');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loadingRadios, setLoadingRadios] = useState(false);
  const [favoriteRadioIds, setFavoriteRadioIds] = useState<string[]>([]);
  const [favoriteRadioStations, setFavoriteRadioStations] = useState<RadioStation[]>([]);
  const [radioFilter, setRadioFilter] = useState<'ALL' | 'FAVORITES'>('ALL');
  const [connectedProvider, setConnectedProvider] = useState<'youtube' | 'spotify' | null>(null);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('ALBUMS');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [albumName, setAlbumName] = useState('');
  const [albums, setAlbums] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  useEffect(() => { api.videos().then(setVideos).catch(() => {}); }, []);

  useEffect(() => {
    Promise.all([
      storage.getItem('media.favorite-tracks', '[]'),
      storage.getItem('media.albums', '[]'),
      storage.getItem('media.favorite-radio-stations', '[]'),
    ]).then(([favoriteRaw, albumRaw, favoriteRadioRaw]) => {
      try { setFavoriteIds(JSON.parse(typeof favoriteRaw === 'string' ? favoriteRaw : '[]')); } catch {}
      try { setAlbums(JSON.parse(typeof albumRaw === 'string' ? albumRaw : '[]')); } catch {}
      try {
        const savedFavorites = JSON.parse(typeof favoriteRadioRaw === 'string' ? favoriteRadioRaw : '[]');
        if (Array.isArray(savedFavorites)) {
          const savedStations = savedFavorites.filter((station): station is RadioStation => typeof station === 'object' && typeof station.stationuuid === 'string');
          setFavoriteRadioStations(savedStations);
          setFavoriteRadioIds(savedFavorites.map((station: RadioStation | string) => typeof station === 'string' ? station : station.stationuuid));
        }
      } catch {}
    });
  }, []);

  useEffect(() => {
    if (source !== 'RADIO') return;
    fetch('https://de1.api.radio-browser.info/json/countries?order=stationcount&reverse=true')
      .then((response) => response.ok ? response.json() : [])
      .then((data: Array<RadioCountry & { iso_3166_1?: string }>) => {
        const countries = data.map((item) => ({ name: item.name, code: item.iso_3166_1 || item.code, stationcount: item.stationcount })).filter((item) => item.code && item.name);
        if (countries.length > 0) setRadioCountries(countries);
      })
      .catch(() => {});
  }, [source]);

  useEffect(() => {
    if (source !== 'RADIO') return;
    setLoadingRadios(true);
    fetch(`https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${country}?limit=24&order=clickcount&reverse=true`)
      .then((response) => response.ok ? response.json() : [])
      .then((data: RadioStation[]) => setStations(data.filter((station) => station.url_resolved || station.url)))
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
      artist: 'Imported offline', album: selectedAlbum ?? 'Local library', duration: 240,
      artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80',
      genre: 'Offline', streamUrl: asset.uri,
    }));
    player.addTracks(tracks);
  };

  const localTracks = player.tracks.filter((track) => track.id.startsWith('offline-'));
  const albumNames = Array.from(new Set([...albums, ...localTracks.map((track) => track.album)]));
  const selectedAlbumTracks = selectedAlbum ? localTracks.filter((track) => track.album === selectedAlbum) : [];
  const favoriteTracks = localTracks.filter((track) => favoriteIds.includes(track.id));
  const toggleFavorite = (track: Track) => {
    setFavoriteIds((current) => {
      const next = current.includes(track.id) ? current.filter((id) => id !== track.id) : [...current, track.id];
      storage.setItem('media.favorite-tracks', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };
  const createAlbum = () => {
    const name = albumName.trim();
    if (!name || albums.includes(name)) return;
    const next = [...albums, name];
    setAlbums(next);
    setAlbumName('');
    storage.setItem('media.albums', JSON.stringify(next)).catch(() => {});
  };

  const playRadio = async (station: RadioStation) => {
    const track: Track = {
      id: `radio-${station.stationuuid}`, title: station.name, artist: station.country,
      album: 'Live radio', duration: 3600, artwork: station.favicon || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80', genre: 'Radio', streamUrl: station.url_resolved || station.url || '',
    };
    const queue = stations.map((item) => ({
      id: `radio-${item.stationuuid}`, title: item.name, artist: item.country,
      album: 'Live radio', duration: 3600, artwork: item.favicon || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80', genre: 'Radio', streamUrl: item.url_resolved || item.url || '',
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
        <View style={styles.musicArea}>
          <View style={styles.sourceRow}>
            {SOURCES.map((item) => (
              <Pressable key={item} style={[styles.sourceBtn, source === item && styles.sourceBtnActive]} onPress={() => setSource(item)} testID={`media-source-${item.toLowerCase().replace(/ /g, '-')}`}>
                <MaterialCommunityIcons name={item === 'LOCAL' ? 'folder-music' : item === 'RADIO' ? 'radio' : item === 'SPOTIFY' ? 'spotify' : 'youtube'} size={18} color={source === item ? theme.colors.onBrandPrimary : theme.colors.onSurfaceSecondary} />
                <Text style={[styles.sourceText, source === item && styles.sourceTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.mediaColumns}>
          <ScrollView style={styles.libraryScroll} contentContainerStyle={styles.libraryScrollContent} showsVerticalScrollIndicator>
          <View style={styles.libraryColumn}>
          {source === 'LOCAL' && <>
            <View style={styles.musicHero}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
                <Text style={styles.heroTitle}>MUSIC FOR THE ROAD</Text>
                <Text style={styles.heroBody}>Play imported music, live radio, or connect a streaming service.</Text>
              </View>
              <Pressable style={styles.importButton} onPress={importOfflineMusic} testID="btn-import-offline">
                <MaterialCommunityIcons name="music-note-plus" size={18} color="#FFFFFF" />
                <Text style={styles.importButtonText}>IMPORT MUSIC</Text>
              </Pressable>
            </View>
            <View style={styles.libraryHeader}>
              <View style={styles.libraryTitleRow}>
                {selectedAlbum && <Pressable onPress={() => setSelectedAlbum(null)} testID="album-back"><MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.brandGlow} /></Pressable>}
                <Text style={styles.section}>{selectedAlbum ?? 'LOCAL MUSIC'}</Text>
              </View>
              <View style={styles.libraryTabs}>{LIBRARY_TABS.map((item) => <Pressable key={item} onPress={() => setLibraryTab(item)} style={[styles.libraryTab, libraryTab === item && styles.libraryTabActive]}><Text style={[styles.libraryTabText, libraryTab === item && styles.libraryTabTextActive]}>{item}</Text></Pressable>)}</View>
            </View>
            <View style={styles.albumCreator}>
              <TextInput value={albumName} onChangeText={setAlbumName} placeholder="New album name" placeholderTextColor={theme.colors.onSurfaceSecondary} style={styles.albumInput} testID="album-name-input" />
              <Pressable style={styles.createAlbumButton} onPress={createAlbum} testID="btn-create-album"><MaterialCommunityIcons name="playlist-plus" size={17} color="#FFFFFF" /><Text style={styles.createAlbumText}>CREATE ALBUM</Text></Pressable>
            </View>
            {!selectedAlbum && albumNames.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumNames}>{albumNames.map((name) => <Pressable key={name} style={styles.albumChip} onPress={() => setSelectedAlbum(name)} testID={`album-${name}`}><MaterialCommunityIcons name="album" size={15} color={theme.colors.brandGlow} /><Text style={styles.albumChipText}>{name}</Text><Text style={styles.albumCount}>{localTracks.filter((track) => track.album === name).length}</Text></Pressable>)}</ScrollView>}
            <View style={styles.libraryContent}>
              {selectedAlbum ? <TrackGrid tracks={selectedAlbumTracks} favoriteIds={favoriteIds} onFavorite={toggleFavorite} onRemove={player.removeTrack} onPress={(item) => item.streamUrl ? player.playExternal(item, selectedAlbumTracks) : player.play(item)} /> : libraryTab === 'ALBUMS' ? <AlbumGrid tracks={localTracks} albumNames={albumNames} onPress={(name) => setSelectedAlbum(name)} /> : <TrackGrid tracks={libraryTab === 'FAVORITES' ? favoriteTracks : localTracks} favoriteIds={favoriteIds} onFavorite={toggleFavorite} onRemove={player.removeTrack} onPress={(item) => item.streamUrl ? player.playExternal(item, localTracks) : player.play(item)} />}
            </View>
          </>}
          {source === 'YOUTUBE MUSIC' && <ProviderPanel provider="youtube" connected={connectedProvider === 'youtube'} onConnect={() => setConnectedProvider('youtube')} />}
          {source === 'SPOTIFY' && <ProviderPanel provider="spotify" connected={connectedProvider === 'spotify'} onConnect={() => setConnectedProvider('spotify')} />}
          {source === 'RADIO' && <RadioPanel country={country} setCountry={setCountry} countries={radioCountries} countrySearch={countrySearch} setCountrySearch={setCountrySearch} stations={stations} loading={loadingRadios} filter={radioFilter} setFilter={setRadioFilter} favoriteIds={favoriteRadioIds} favoriteStations={favoriteRadioStations} onFavorite={(station) => setFavoriteRadioStations((current) => { const exists = current.some((item) => item.stationuuid === station.stationuuid); const next = exists ? current.filter((item) => item.stationuuid !== station.stationuuid) : [...current, station]; setFavoriteRadioIds(next.map((item) => item.stationuuid)); storage.setItem('media.favorite-radio-stations', JSON.stringify(next)).catch(() => {}); return next; })} onPlay={playRadio} />}
          </View>
          </ScrollView>
          <View style={styles.playerColumn}><MusicPlayerWidget vertical /></View>
          </View>
        </View>
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

function TrackCard({ item, onPress, favorite, onFavorite, onRemove }: { item: Track; onPress: () => void; favorite?: boolean; onFavorite?: () => void; onRemove?: (id: string) => void }) {
  return <Pressable style={styles.card} testID={`track-${item.id}`} onPress={onPress}>
    <Image source={{ uri: item.artwork }} style={styles.cardArt} contentFit="cover" transition={200} />
    <View style={styles.playOverlay}><MaterialCommunityIcons name="play-circle" size={44} color={theme.colors.brand} /></View>
    {onFavorite && <Pressable style={styles.loveButton} onPress={onFavorite} testID={`love-${item.id}`}><MaterialCommunityIcons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? theme.colors.accentRed : '#FFFFFF'} /></Pressable>}
    {onRemove && <Pressable style={styles.removeButton} onPress={() => onRemove(item.id)} testID={`remove-${item.id}`} accessibilityLabel={`Remove ${item.title}`}><MaterialCommunityIcons name="trash-can-outline" size={17} color="#FFFFFF" /></Pressable>}
    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
    <Text style={styles.cardSub} numberOfLines={1}>{item.artist}</Text>
  </Pressable>;
}

function TrackGrid({ tracks, onPress, favoriteIds, onFavorite, onRemove }: { tracks: Track[]; onPress: (item: Track) => void; favoriteIds?: string[]; onFavorite?: (item: Track) => void; onRemove?: (id: string) => void }) {
  return <View style={styles.trackGrid}>{tracks.length > 0 ? tracks.map((item) => <TrackCard key={item.id} item={item} onPress={() => onPress(item)} favorite={favoriteIds?.includes(item.id)} onFavorite={onFavorite ? () => onFavorite(item) : undefined} onRemove={onRemove} />) : <Text style={styles.emptyText}>No local tracks yet. Import music to build your library.</Text>}</View>;
}

function AlbumGrid({ tracks, albumNames, onPress }: { tracks: Track[]; albumNames: string[]; onPress: (album: string) => void }) {
  return <View style={styles.trackGrid}>{albumNames.map((album) => {
    const albumTracks = tracks.filter((track) => track.album === album);
    const cover = albumTracks[0];
    return <Pressable key={album} style={styles.albumCard} onPress={() => onPress(album)} testID={`album-card-${album}`}><Image source={{ uri: cover?.artwork ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop&q=80' }} style={styles.albumArt} contentFit="cover" transition={200} /><Text style={styles.cardTitle} numberOfLines={1}>{album}</Text><Text style={styles.cardSub}>{albumTracks.length} {albumTracks.length === 1 ? 'track' : 'tracks'}</Text></Pressable>;
  })}</View>;
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

function RadioPanel({ country, setCountry, countries, countrySearch, setCountrySearch, stations, loading, filter, setFilter, favoriteIds, favoriteStations, onFavorite, onPlay }: { country: string; setCountry: (value: string) => void; countries: RadioCountry[]; countrySearch: string; setCountrySearch: (value: string) => void; stations: RadioStation[]; loading: boolean; filter: 'ALL' | 'FAVORITES'; setFilter: (value: 'ALL' | 'FAVORITES') => void; favoriteIds: string[]; favoriteStations: RadioStation[]; onFavorite: (station: RadioStation) => void; onPlay: (station: RadioStation) => void }) {
  const visibleCountries = countrySearch.trim() ? countries.filter((item) => item.name.toLowerCase().includes(countrySearch.toLowerCase())) : [];
  const selectedCountry = countries.find((item) => item.code === country);
  const visibleStations = filter === 'FAVORITES' ? favoriteStations : stations;
  return <View>
    <Text style={styles.section}>LIVE RADIO BY COUNTRY</Text>
    <TextInput value={countrySearch} onChangeText={setCountrySearch} placeholder={selectedCountry?.name ?? 'Search all countries'} placeholderTextColor={theme.colors.onSurfaceSecondary} style={styles.countrySearch} testID="radio-country-search" />
    {countrySearch.trim() ? <View style={styles.countryRow}>
      {visibleCountries.map((item) => <Pressable key={item.code} style={[styles.countryBtn, country === item.code && styles.countryBtnActive]} onPress={() => { setCountry(item.code); setCountrySearch(''); }} testID={`radio-country-${item.code}`}><Text style={[styles.countryText, country === item.code && styles.countryTextActive]}>{item.name}</Text></Pressable>)}
      {visibleCountries.length === 0 && <Text style={styles.searchEmpty}>No matching country.</Text>}
    </View> : selectedCountry && <View style={styles.selectedCountry}><MaterialCommunityIcons name="map-marker" size={15} color={theme.colors.brandGlow} /><Text style={styles.selectedCountryText}>{selectedCountry.name}</Text></View>}
    <View style={styles.radioFilterRow}>
      {(['ALL', 'FAVORITES'] as const).map((item) => <Pressable key={item} style={[styles.radioFilter, filter === item && styles.radioFilterActive]} onPress={() => setFilter(item)}><MaterialCommunityIcons name={item === 'ALL' ? 'radio-tower' : 'heart'} size={14} color={filter === item ? '#FFFFFF' : theme.colors.onSurfaceSecondary} /><Text style={[styles.radioFilterText, filter === item && styles.radioFilterTextActive]}>{item}</Text></Pressable>)}
    </View>
    {loading ? <ActivityIndicator color={theme.colors.brand} style={styles.loader} /> : <View style={styles.radioGrid}>
      {visibleStations.map((station) => <Pressable key={station.stationuuid} style={styles.radioCard} onPress={() => onPlay(station)} testID={`radio-${station.stationuuid}`}>
        <View style={styles.radioArt}>{station.favicon ? <Image source={{ uri: station.favicon }} style={styles.radioLogo} contentFit="contain" /> : <MaterialCommunityIcons name="radio" size={30} color={theme.colors.brand} />}</View>
        <View style={{ flex: 1 }}><Text style={styles.radioName} numberOfLines={1}>{station.name}</Text><Text style={styles.radioMeta} numberOfLines={1}>{station.country}</Text></View>
        <Pressable onPress={(event) => { event.stopPropagation(); onFavorite(station); }} testID={`radio-love-${station.stationuuid}`} accessibilityLabel={`Favorite ${station.name}`}><MaterialCommunityIcons name={favoriteIds.includes(station.stationuuid) ? 'heart' : 'heart-outline'} size={20} color={favoriteIds.includes(station.stationuuid) ? theme.colors.accentRed : theme.colors.onSurfaceSecondary} /></Pressable>
        <MaterialCommunityIcons name="play-circle-outline" size={28} color={theme.colors.brand} />
      </Pressable>)}
    </View>}
    {!loading && visibleStations.length === 0 && <Text style={styles.emptyText}>{filter === 'FAVORITES' ? 'No favorite stations in this country.' : 'No stations found for this country.'}</Text>}
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
  musicHero: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.spacing.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.accentCyan, letterSpacing: 1.8 },
  heroTitle: { fontFamily: theme.font.display, fontSize: 28, color: theme.colors.onSurface, letterSpacing: 1.5, marginTop: 4 },
  heroBody: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 5 },
  importButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: theme.colors.brand, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 11 },
  importButtonText: { fontFamily: theme.font.textBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 1 },
  mediaColumns: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'stretch', gap: theme.spacing.xl },
  musicArea: { flex: 1, padding: theme.spacing.md, paddingBottom: 0 },
  libraryScroll: { flex: 1, minWidth: 0 },
  libraryScrollContent: { paddingBottom: 140 },
  libraryColumn: { flex: 1, minWidth: 0 },
  playerColumn: { width: 300, alignSelf: 'flex-start' },
  sourceRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  sourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 10 },
  sourceBtnActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  sourceText: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.onSurfaceSecondary, letterSpacing: 1 },
  sourceTextActive: { color: theme.colors.onBrandPrimary },
  libraryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  libraryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  libraryTabs: { flexDirection: 'row', gap: theme.spacing.xs },
  libraryTab: { paddingHorizontal: theme.spacing.md, paddingVertical: 8, borderRadius: theme.radius.pill },
  libraryTabActive: { backgroundColor: theme.colors.brandTertiary },
  libraryTabText: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.onSurfaceSecondary, letterSpacing: 1 },
  libraryTabTextActive: { color: theme.colors.brandGlow },
  libraryContent: { width: '100%' },
  trackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },

  card: { width: 150, gap: 4 },
  cardArt: { width: 150, height: 150, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  playOverlay: {
    position: 'absolute', bottom: 44, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22,
  },
  cardTitle: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurface, marginTop: 6 },
  cardSub: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary },
  loveButton: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.58)' },
  albumCreator: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  albumInput: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.onSurface, fontFamily: theme.font.text, fontSize: 12, backgroundColor: theme.colors.surfaceSecondary },
  createAlbumButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.brand },
  createAlbumText: { fontFamily: theme.font.textBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 0.8 },
  albumNames: { gap: theme.spacing.sm, paddingBottom: theme.spacing.md },
  albumChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 8 },
  albumCount: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.onSurfaceSecondary },
  albumCard: { width: 190, gap: 4 },
  albumArt: { width: 190, height: 190, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  removeButton: { position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.58)' },
  albumChipText: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceTertiary },
  providerPanel: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.xl, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border },
  providerIcon: { width: 64, height: 64, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1 }, providerTitle: { fontFamily: theme.font.display, fontSize: 25, color: theme.colors.onSurface }, providerBody: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 4 },
  openProviderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.brand, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 10 }, openProviderText: { fontFamily: theme.font.textBold, fontSize: 11, color: '#FFFFFF', letterSpacing: 1 },
  providerEmbed: { width: '100%', height: 360, marginTop: theme.spacing.lg, overflow: 'hidden', borderRadius: theme.radius.md, backgroundColor: '#FFFFFF' },
  countryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, paddingBottom: theme.spacing.md }, countryBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 9 }, countryBtnActive: { borderColor: theme.colors.brand, backgroundColor: theme.colors.brand }, countryText: { fontFamily: theme.font.textBold, fontSize: 11, color: theme.colors.onSurfaceSecondary }, countryTextActive: { color: '#FFFFFF' },
  radioGrid: { gap: theme.spacing.sm }, radioCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }, radioArt: { width: 52, height: 52, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center' }, radioLogo: { width: 42, height: 42 }, radioName: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurface }, radioMeta: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary, marginTop: 2 }, loader: { marginTop: theme.spacing.xl }, emptyText: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, paddingVertical: theme.spacing.xl },

  section: { fontFamily: theme.font.textBold, fontSize: 11, letterSpacing: 2, color: theme.colors.onSurfaceSecondary, marginBottom: theme.spacing.md },
  countrySearch: { minHeight: 42, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.onSurface, fontFamily: theme.font.text, fontSize: 12, backgroundColor: theme.colors.surfaceSecondary, marginBottom: theme.spacing.sm },
  radioFilterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  radioFilter: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 8 },
  radioFilterActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  radioFilterText: { fontFamily: theme.font.textBold, fontSize: 10, color: theme.colors.onSurfaceSecondary, letterSpacing: 0.8 },
  radioFilterTextActive: { color: '#FFFFFF' },
  selectedCountry: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.brand, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: 8, marginBottom: theme.spacing.md },
  selectedCountryText: { fontFamily: theme.font.textBold, fontSize: 11, color: theme.colors.brandGlow },
  searchEmpty: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary, paddingVertical: 8 },
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
