import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LatLng = { lng: number; lat: number };

export type LocationState = {
  loading: boolean;
  granted: boolean | null;
  canAskAgain: boolean;
  coords: LatLng | null;
  error: string | null;
};

const DEFAULT: LatLng = { lng: -74.17, lat: 40.735 }; // Newark

export function useUserLocation() {
  const [state, setState] = useState<LocationState>({
    loading: true, granted: null, canAskAgain: true, coords: null, error: null,
  });

  const request = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation on web
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setState({
                  loading: false, granted: true, canAskAgain: true,
                  coords: { lng: pos.coords.longitude, lat: pos.coords.latitude },
                  error: null,
                });
                resolve();
              },
              (err) => {
                setState({
                  loading: false, granted: false, canAskAgain: true,
                  coords: DEFAULT, error: err.message,
                });
                resolve();
              },
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
            );
          });
          return;
        }
        setState({ loading: false, granted: false, canAskAgain: false, coords: DEFAULT, error: 'Geolocation unavailable' });
        return;
      }
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setState({
          loading: false, granted: false, canAskAgain: perm.canAskAgain,
          coords: DEFAULT, error: 'Permission denied',
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState({
        loading: false, granted: true, canAskAgain: true,
        coords: { lng: pos.coords.longitude, lat: pos.coords.latitude },
        error: null,
      });
    } catch (e: any) {
      setState({ loading: false, granted: false, canAskAgain: true, coords: DEFAULT, error: e?.message ?? 'Unknown error' });
    }
  }, []);

  useEffect(() => { request(); }, [request]);

  return { ...state, refresh: request, DEFAULT };
}
