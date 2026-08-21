import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { api, Track, Video } from '@/src/api';
import { usePlayer } from '@/src/state/player';

const TABS = ['MUSIC', 'VIDEOS'] as const;
type Tab = typeof TABS[number];

export default function MediaScreen() {
  const player = usePlayer();
  const [tab, setTab] = useState<Tab>('MUSIC');
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => { api.videos().then(setVideos).catch(() => {}); }, []);

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
        <FlatList
          data={player.tracks}
          keyExtractor={(t) => t.id}
          numColumns={4}
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 140 }}
          columnWrapperStyle={{ gap: theme.spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              testID={`track-${item.id}`}
              onPress={() => player.play(item)}
            >
              <Image source={{ uri: item.artwork }} style={styles.cardArt} contentFit="cover" transition={200} />
              <View style={styles.playOverlay}>
                <MaterialCommunityIcons name="play-circle" size={44} color={theme.colors.brand} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{item.artist}</Text>
            </Pressable>
          )}
        />
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

      {/* Persistent Now Playing */}
      {player.current && (
        <View style={styles.nowBar} testID="media-now-bar">
          <Image source={{ uri: player.current.artwork }} style={styles.nowArt} contentFit="cover" />
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text style={styles.nowTitle} numberOfLines={1}>{player.current.title}</Text>
            <Text style={styles.nowArtist} numberOfLines={1}>{player.current.artist} · {player.current.album}</Text>
            <View style={styles.nowTrack}>
              <View style={[styles.nowFill, { width: `${player.progress * 100}%` }]} />
            </View>
          </View>
          <View style={styles.nowCtrls}>
            <Pressable onPress={player.prev} style={styles.nowBtn} testID="now-prev">
              <MaterialCommunityIcons name="skip-previous" size={28} color={theme.colors.onSurface} />
            </Pressable>
            <Pressable onPress={player.toggle} style={[styles.nowBtn, styles.nowBtnPrimary]} testID="now-toggle">
              <MaterialCommunityIcons name={player.isPlaying ? 'pause' : 'play'} size={32} color={theme.colors.onBrandPrimary} />
            </Pressable>
            <Pressable onPress={player.next} style={styles.nowBtn} testID="now-next">
              <MaterialCommunityIcons name="skip-next" size={28} color={theme.colors.onSurface} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
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

  card: { flex: 1, gap: 4 },
  cardArt: { width: '100%', aspectRatio: 1, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  playOverlay: {
    position: 'absolute', bottom: 44, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22,
  },
  cardTitle: { fontFamily: theme.font.displayMedium, fontSize: 16, color: theme.colors.onSurface, marginTop: 6 },
  cardSub: { fontFamily: theme.font.text, fontSize: 11, color: theme.colors.onSurfaceSecondary },

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

  nowBar: {
    position: 'absolute', left: theme.spacing.md, right: theme.spacing.md, bottom: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md,
  },
  nowArt: { width: 64, height: 64, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceTertiary },
  nowTitle: { fontFamily: theme.font.displayMedium, fontSize: 20, color: theme.colors.onSurface },
  nowArtist: { fontFamily: theme.font.text, fontSize: 12, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  nowTrack: { marginTop: theme.spacing.sm, height: 3, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  nowFill: { height: '100%', backgroundColor: theme.colors.brand },
  nowCtrls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nowBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  nowBtnPrimary: { backgroundColor: theme.colors.brand },
});
