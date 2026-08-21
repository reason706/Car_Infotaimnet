import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

type Coord = [number, number];

export type MapStyle = 'streets' | 'satellite' | 'dark' | 'outdoors' | '3d';

const STYLE_MAP: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  '3d': 'mapbox://styles/mapbox/standard',
};

type Props = {
  style?: any;
  origin?: Coord | null;
  destination?: Coord | null;
  route?: Coord[] | null;
  mapboxToken?: string;
  followUser?: boolean;
  recenterToken?: number;
  navigating?: boolean;
  mapStyle?: MapStyle;
  testID?: string;
};

function buildHtml(initial: {
  center: Coord; zoom: number; styleUrl: string; enable3d: boolean; token: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"></script>
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#F3F5F8; }
    body { overflow:hidden; }
    .mb-origin { width:16px; height:16px; border-radius:50%;
      background:#2E7CF6; border:3px solid #FFFFFF;
      box-shadow: 0 0 0 4px rgba(46,124,246,0.2);
    }
    .mb-dest {
      width:32px; height:32px; border-radius:50% 50% 50% 0;
      background:#2E7CF6; border:3px solid #FFFFFF;
      transform: rotate(-45deg);
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      display:flex; align-items:center; justify-content:center;
    }
    .mb-dest::after { content:''; width:10px; height:10px; border-radius:50%; background:#FFFFFF; }
    .mb-nav-arrow { width:34px; height:34px; display:flex; align-items:center; justify-content:center;
      background:#FFFFFF; border:2px solid #2E7CF6; border-radius:50%;
      box-shadow:0 3px 10px rgba(0,0,0,0.25); }
    .mb-nav-arrow::before { content:''; width:0; height:0; border-left:8px solid transparent;
      border-right:8px solid transparent; border-bottom:17px solid #2E7CF6; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${initial.token}';
    const map = new mapboxgl.Map({
      container: 'map',
      style: '${initial.styleUrl}',
      center: [${initial.center[0]}, ${initial.center[1]}],
      zoom: ${initial.zoom},
      pitch: ${initial.enable3d ? 55 : 0},
      bearing: ${initial.enable3d ? -20 : 0},
      attributionControl: false,
      interactive: true,
    });

    let originMarker = null;
    let destMarker = null;
    let navMarker = null;
    let hasRouteLayer = false;

    function ensure3dTerrain() {
      try {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512, maxzoom: 14
          });
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.4 });
      } catch (e) {}
    }

    function setOrigin(coord) {
      if (!coord) return;
      if (originMarker) originMarker.setLngLat(coord);
      else {
        const el = document.createElement('div'); el.className = 'mb-origin';
        originMarker = new mapboxgl.Marker(el).setLngLat(coord).addTo(map);
      }
    }
    function setDest(coord) {
      if (!coord) { if (destMarker) { destMarker.remove(); destMarker = null; } return; }
      if (destMarker) destMarker.setLngLat(coord);
      else {
        const el = document.createElement('div'); el.className = 'mb-dest';
        destMarker = new mapboxgl.Marker({ element: el, offset: [0, -16] }).setLngLat(coord).addTo(map);
      }
    }
    function setNavigation(coord, bearing) {
      if (!coord) { if (navMarker) { navMarker.remove(); navMarker = null; } return; }
      if (!navMarker) {
        const el = document.createElement('div'); el.className = 'mb-nav-arrow';
        navMarker = new mapboxgl.Marker({ element: el, rotationAlignment: 'map' }).setLngLat(coord).addTo(map);
      } else navMarker.setLngLat(coord);
      navMarker.setRotation(bearing || 0);
    }
    function setRoute(coords) {
      if (!coords || coords.length < 2) {
        if (hasRouteLayer) {
          if (map.getLayer('route-line')) map.removeLayer('route-line');
          if (map.getLayer('route-glow')) map.removeLayer('route-glow');
          if (map.getSource('route')) map.removeSource('route');
          hasRouteLayer = false;
        }
        return;
      }
      const geo = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
      if (hasRouteLayer && map.getSource('route')) {
        map.getSource('route').setData(geo);
      } else {
        map.addSource('route', { type: 'geojson', data: geo });
        map.addLayer({
          id: 'route-glow', type: 'line', source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#2E7CF6', 'line-width': 12, 'line-opacity': 0.22 }
        });
        map.addLayer({
          id: 'route-line', type: 'line', source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#2E7CF6', 'line-width': 6 }
        });
        hasRouteLayer = true;
      }
    }
    function fitToRoute(coords, padding) {
      if (!coords || coords.length < 2) return;
      const b = coords.reduce((acc, c) => acc.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(b, { padding: padding || { top: 90, bottom: 190, left: 60, right: 60 }, duration: 700 });
    }
    function flyTo(coord, zoom) {
      if (!coord) return;
      map.flyTo({ center: coord, zoom: zoom || 15, duration: 700 });
    }
    function navigate(coord, nextCoord, zoom) {
      if (!coord) return;
      const heading = nextCoord ? (Math.atan2(nextCoord[0] - coord[0], nextCoord[1] - coord[1]) * 180 / Math.PI + 360) % 360 : 0;
      setNavigation(coord, heading);
      map.easeTo({ center: coord, zoom: zoom || 16, bearing: heading, pitch: 35, duration: 900, padding: { top: 100, bottom: 220, left: 40, right: 40 } });
    }
    function setStyle(styleUrl, enable3d) {
      const cur = map.getStyle && map.getStyle();
      map.setStyle(styleUrl);
      map.once('style.load', () => {
        if (enable3d) {
          map.setPitch(55); map.setBearing(-20);
          ensure3dTerrain();
        } else {
          map.setPitch(0); map.setBearing(0);
          try { map.setTerrain(null); } catch (e) {}
        }
        // Re-apply markers + route on style change
        hasRouteLayer = false;
        if (window.__lastRoute) setRoute(window.__lastRoute);
      });
    }

    function handleMessage(raw) {
      try {
        const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (msg.type === 'origin') setOrigin(msg.coord);
        else if (msg.type === 'destination') setDest(msg.coord);
        else if (msg.type === 'route') { window.__lastRoute = msg.coords; setRoute(msg.coords); }
        else if (msg.type === 'fit') fitToRoute(msg.coords, msg.padding);
        else if (msg.type === 'flyTo') flyTo(msg.coord, msg.zoom);
        else if (msg.type === 'navigate') navigate(msg.coord, msg.nextCoord, msg.zoom);
        else if (msg.type === 'setStyle') setStyle(msg.styleUrl, !!msg.enable3d);
      } catch (e) {}
    }

    window.addEventListener('message', (e) => handleMessage(e.data));
    document.addEventListener('message', (e) => handleMessage(e.data));

    function postReady() {
      const payload = JSON.stringify({ type: 'ready' });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
      else window.parent && window.parent.postMessage(payload, '*');
    }
    map.on('load', () => {
      if (${initial.enable3d}) ensure3dTerrain();
      postReady();
    });
  </script>
</body>
</html>`;
}

/**
 * Mapbox map — works in web (iframe) and native (WebView).
 * Accepts origin / destination / route as props and posts messages to
 * the map on prop changes.
 */
export function MapboxMap({
  style, origin, destination, route,
  mapboxToken = '', followUser = false, recenterToken = 0, navigating = false, mapStyle = 'streets', testID,
}: Props) {
  const initialCenter: Coord = origin ?? [-74.17, 40.735];
  // HTML is only built once; style changes are pushed via postMessage.
  const html = useMemo(() => buildHtml({
    center: initialCenter,
    zoom: 13,
    styleUrl: STYLE_MAP[mapStyle],
    enable3d: mapStyle === '3d',
    token: mapboxToken,
  }), [mapboxToken]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const webviewRef = useRef<any>(null);
  const readyRef = useRef(false);
  const pending = useRef<any[]>([]);

  const send = (msg: any) => {
    const str = JSON.stringify(msg);
    if (!readyRef.current) { pending.current.push(msg); return; }
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(str, '*');
    } else {
      webviewRef.current?.postMessage?.(str);
    }
  };

  const flushPending = () => {
    readyRef.current = true;
    const q = pending.current.slice();
    pending.current = [];
    q.forEach(send);
  };

  useEffect(() => {
    readyRef.current = false;
    pending.current = [];
  }, [mapboxToken]);
  useEffect(() => { send({ type: 'origin', coord: origin ?? null }); }, [origin?.[0], origin?.[1]]);
  useEffect(() => { send({ type: 'destination', coord: destination ?? null }); }, [destination?.[0], destination?.[1]]);
  useEffect(() => { send({ type: 'route', coords: route ?? null }); if (route && route.length > 1) send({ type: 'fit', coords: route, padding: navigating ? { top: 90, bottom: 250, left: 40, right: 40 } : undefined }); }, [route?.length, navigating]);
  useEffect(() => {
    if (followUser && origin) send({ type: 'flyTo', coord: origin, zoom: navigating ? 16 : 14 });
  }, [followUser, navigating, origin?.[0], origin?.[1]]);
  useEffect(() => {
    if (origin) send({ type: 'flyTo', coord: origin, zoom: navigating ? 16 : 14 });
  }, [recenterToken]);
  useEffect(() => {
    if (navigating && origin && route && route.length > 1) {
      send({ type: 'navigate', coord: origin, nextCoord: route[1], zoom: 16 });
    } else {
      send({ type: 'navigate', coord: null });
    }
  }, [navigating, origin?.[0], origin?.[1], route?.[0]?.[0], route?.[0]?.[1], route?.[1]?.[0], route?.[1]?.[1]]);
  useEffect(() => {
    send({ type: 'setStyle', styleUrl: STYLE_MAP[mapStyle], enable3d: mapStyle === '3d' });
  }, [mapStyle]);

  // Listen for 'ready' message from map html
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMsg = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.type === 'ready') flushPending();
      } catch {}
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!mapboxToken) {
    return <View style={[styles.wrap, style]} testID={testID} />;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, style]} testID={testID}>
        {/* @ts-ignore RN Web iframe passthrough */}
        <iframe
          key={mapboxToken}
          ref={iframeRef as any}
          srcDoc={html}
          style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
          title="mapbox-map"
        />
      </View>
    );
  }

  const { WebView } = require('react-native-webview');
  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <WebView
        key={mapboxToken}
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: 'transparent', flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        onMessage={(e: any) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === 'ready') flushPending();
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', backgroundColor: '#E4E7EB' },
});
