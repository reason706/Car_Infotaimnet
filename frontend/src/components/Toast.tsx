import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Card, Text, motion } from '@/src/ui';

type Toast = { id: number; message: string };
type Ctx = { show: (msg: string) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), motion.toast);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          entering={FadeIn.duration(motion.normal)}
          exiting={FadeOut.duration(motion.normal)}
          style={styles.wrap}
          pointerEvents="none"
          testID="toast"
        >
          <Card variant="raised" radius="pill" padding="md" style={styles.card}>
            <Text variant="bodyBold" style={styles.text}>{toast.message}</Text>
          </Card>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 24, left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  card: { paddingHorizontal: 16 },
  text: { fontSize: 13, letterSpacing: 0.5 },
});
