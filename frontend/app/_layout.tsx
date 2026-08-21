import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as ScreenOrientation from "expo-screen-orientation";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox, Platform, View } from "react-native";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconError] = useIconFonts();
  const [appFontsLoaded, appFontError] = useFonts({
    'BarlowCondensed-Regular': require('../assets/fonts/BarlowCondensed-Regular.ttf'),
    'BarlowCondensed-Medium': require('../assets/fonts/BarlowCondensed-Medium.ttf'),
    'BarlowCondensed-Bold': require('../assets/fonts/BarlowCondensed-Bold.ttf'),
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
  });

  useEffect(() => {
    // Landscape lock
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }
    // Android: hide the system nav bar (kiosk feel).
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
      NavigationBar.setBackgroundColorAsync('#1B1D22').catch(() => {});
    }

    // Web: request fullscreen on first user gesture
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const goFull = () => {
        const el: any = document.documentElement;
        if (!document.fullscreenElement && el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        }
        window.removeEventListener('pointerdown', goFull);
      };
      window.addEventListener('pointerdown', goFull, { once: true });
    }
  }, []);

  useEffect(() => {
    if ((iconsLoaded || iconError) && (appFontsLoaded || appFontError)) {
      SplashScreen.hideAsync();
    }
  }, [iconsLoaded, iconError, appFontsLoaded, appFontError]);

  if ((!iconsLoaded && !iconError) || (!appFontsLoaded && !appFontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#090A0C' }}>
      <StatusBar hidden translucent />
      <View style={{ flex: 1, backgroundColor: '#090A0C' }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090A0C' } }} />
      </View>
    </GestureHandlerRootView>
  );
}
