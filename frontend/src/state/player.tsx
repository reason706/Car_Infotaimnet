import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api, Track } from '@/src/api';
import { Platform } from 'react-native';
import { storage } from '@/src/utils/storage';

const IMPORTED_TRACKS_KEY = 'media.imported-tracks';

type PlayerState = {
  tracks: Track[];
  current: Track | null;
  index: number;
  isPlaying: boolean;
  progress: number; // 0..1
};

type Ctx = PlayerState & {
  play: (t?: Track) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setByTitle: (title: string) => Track | null;
  playExternal: (track: Track, queue?: Track[]) => void;
  addTracks: (items: Track[]) => void;
  close: () => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [externalCurrent, setExternalCurrent] = useState<Track | null>(null);
  const [externalQueue, setExternalQueue] = useState<Track[]>([]);
  const [externalIndex, setExternalIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopExternalAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.tracks().catch(() => [] as Track[]),
      storage.getItem(IMPORTED_TRACKS_KEY, '[]'),
    ]).then(([remoteTracks, rawImported]) => {
      let importedTracks: Track[] = [];
      try {
        const parsed = JSON.parse(typeof rawImported === 'string' ? rawImported : '[]');
        if (Array.isArray(parsed)) importedTracks = parsed;
      } catch {}
      setTracks([...importedTracks, ...remoteTracks.filter((track) => !importedTracks.some((item) => item.id === track.id))]);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !externalCurrent?.streamUrl || !isPlaying) return;
    stopExternalAudio();
    const audio = new Audio(externalCurrent.streamUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    return stopExternalAudio;
  }, [externalCurrent?.id, externalCurrent?.streamUrl, isPlaying, stopExternalAudio]);

  useEffect(() => {
    if (!isPlaying || tracks.length === 0) return;
    const iv = setInterval(() => {
      setProgress((p) => {
        const dur = externalCurrent?.duration ?? tracks[index]?.duration ?? 240;
        const next = p + 1 / dur;
        if (next >= 1) {
          setIndex((i) => (i + 1) % tracks.length);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isPlaying, index, tracks, externalCurrent]);

  const play = useCallback((t?: Track) => {
    setDismissed(false);
    if (t) {
      setExternalCurrent(null);
      setExternalQueue([]);
      stopExternalAudio();
      const idx = tracks.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        setIndex(idx);
        setProgress(0);
      }
    }
    setIsPlaying(true);
  }, [stopExternalAudio, tracks]);

  const addTracks = useCallback((items: Track[]) => {
    setTracks((currentTracks) => {
      const known = new Set(currentTracks.map((track) => track.id));
      const added = items.filter((track) => !known.has(track.id));
      if (added.length) {
        const imported = [...currentTracks.filter((track) => track.id.startsWith('offline-')), ...added];
        storage.setItem(IMPORTED_TRACKS_KEY, JSON.stringify(imported)).catch(() => {});
      }
      return [...currentTracks, ...added];
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);
  const toggle = useCallback(() => {
    if (externalCurrent && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
    setIsPlaying((p) => !p);
  }, [externalCurrent, isPlaying]);
  const next = useCallback(() => {
    if (externalQueue.length) {
      const nextIndex = (externalIndex + 1) % externalQueue.length;
      setExternalIndex(nextIndex);
      setExternalCurrent(externalQueue[nextIndex]);
      setProgress(0);
      stopExternalAudio();
      return;
    }
    setIndex((i) => (tracks.length ? (i + 1) % tracks.length : 0));
    setProgress(0);
  }, [externalIndex, externalQueue, stopExternalAudio, tracks]);
  const prev = useCallback(() => {
    if (externalQueue.length) {
      const previousIndex = (externalIndex - 1 + externalQueue.length) % externalQueue.length;
      setExternalIndex(previousIndex);
      setExternalCurrent(externalQueue[previousIndex]);
      setProgress(0);
      stopExternalAudio();
      return;
    }
    setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : 0));
    setProgress(0);
  }, [externalIndex, externalQueue, stopExternalAudio, tracks]);

  const setByTitle = useCallback((title: string): Track | null => {
    const q = title.toLowerCase();
    const t = tracks.find((x) => x.title.toLowerCase().includes(q) || x.artist.toLowerCase().includes(q));
    if (t) {
      setDismissed(false);
      const idx = tracks.findIndex((x) => x.id === t.id);
      setIndex(idx);
      setExternalCurrent(null);
      setExternalQueue([]);
      stopExternalAudio();
      setProgress(0);
      setIsPlaying(true);
      return t;
    }
    return null;
  }, [stopExternalAudio, tracks]);

  const playExternal = useCallback((track: Track, queue: Track[] = [track]) => {
    setDismissed(false);
    const nextIndex = Math.max(0, queue.findIndex((item) => item.id === track.id));
    setExternalQueue(queue);
    setExternalIndex(nextIndex);
    setExternalCurrent(queue[nextIndex] ?? track);
    setProgress(0);
    setIsPlaying(true);
    stopExternalAudio();
  }, [stopExternalAudio]);

  const close = useCallback(() => {
    stopExternalAudio();
    setIsPlaying(false);
    setDismissed(true);
    setExternalCurrent(null);
    setExternalQueue([]);
    setProgress(0);
  }, [stopExternalAudio]);

  const current = dismissed ? null : externalCurrent ?? tracks[index] ?? null;

  const value = useMemo<Ctx>(() => ({
    tracks, current, index, isPlaying, progress,
    play, pause, toggle, next, prev, setByTitle, playExternal, addTracks, close,
  }), [tracks, current, index, isPlaying, progress, play, pause, toggle, next, prev, setByTitle, playExternal, addTracks, close]);

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
