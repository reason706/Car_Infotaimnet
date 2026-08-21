import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, Track } from '@/src/api';

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
};

const PlayerCtx = createContext<Ctx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    api.tracks().then((data) => {
      setTracks(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isPlaying || tracks.length === 0) return;
    const iv = setInterval(() => {
      setProgress((p) => {
        const dur = tracks[index]?.duration ?? 240;
        const next = p + 1 / dur;
        if (next >= 1) {
          setIndex((i) => (i + 1) % tracks.length);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isPlaying, index, tracks]);

  const play = useCallback((t?: Track) => {
    if (t) {
      const idx = tracks.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        setIndex(idx);
        setProgress(0);
      }
    }
    setIsPlaying(true);
  }, [tracks]);

  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((p) => !p), []);
  const next = useCallback(() => {
    setIndex((i) => (tracks.length ? (i + 1) % tracks.length : 0));
    setProgress(0);
  }, [tracks]);
  const prev = useCallback(() => {
    setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : 0));
    setProgress(0);
  }, [tracks]);

  const setByTitle = useCallback((title: string): Track | null => {
    const q = title.toLowerCase();
    const t = tracks.find((x) => x.title.toLowerCase().includes(q) || x.artist.toLowerCase().includes(q));
    if (t) {
      const idx = tracks.findIndex((x) => x.id === t.id);
      setIndex(idx);
      setProgress(0);
      setIsPlaying(true);
      return t;
    }
    return null;
  }, [tracks]);

  const current = tracks[index] ?? null;

  const value = useMemo<Ctx>(() => ({
    tracks, current, index, isPlaying, progress,
    play, pause, toggle, next, prev, setByTitle,
  }), [tracks, current, index, isPlaying, progress, play, pause, toggle, next, prev, setByTitle]);

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
