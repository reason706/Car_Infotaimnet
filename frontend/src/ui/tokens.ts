/**
 * DriveHub design tokens — the ONE place to change how the app looks.
 *
 * Think of this file like a Sass variables partial:
 *   - `palette`  raw colour values (never used for meaning, only for lookup)
 *   - `colors`   semantic colours the UI actually uses (change these to re-skin)
 *   - `spacing`, `radius`, `iconSize`, `controlSize`  sizing scales
 *   - `fonts`, `typography`  font families and reusable text styles
 *   - `shadows`, `motion`  elevation presets and animation timings
 *
 * Components in `src/ui` read from here. Screens should use those components
 * (or these tokens) instead of hardcoding hex values or pixel sizes.
 */
import type { TextStyle, ViewStyle } from 'react-native';

/* ------------------------------------------------------------------ */
/* Palette — raw values                                               */
/* ------------------------------------------------------------------ */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // Neutrals, darkest → lightest
  ink950: '#050608',
  ink925: '#090A0C',
  ink900: '#0A0B0D',
  ink875: '#0C0D10',
  ink850: '#191B21',
  ink800: '#1B1D22',
  ink775: '#1D1E23',
  ink750: '#22252B',
  ink725: '#25282E',
  ink700: '#2A2D34',
  ink650: '#2C313C',
  ink600: '#33373F',
  ink575: '#34363D',
  ink550: '#363940',
  ink500: '#454955',
  ink450: '#4A4E56',
  ink400: '#666A77',
  ink350: '#6B7280',
  ink325: '#767D8B',
  ink300: '#7A7F88',
  ink250: '#8D93A0',
  ink200: '#A5A8B2',
  ink175: '#A8ADB8',
  ink150: '#B4B6C1',
  ink125: '#B6BAC3',
  ink100: '#C0C2CA',
  ink75: '#D6D9DF',
  ink60: '#D9DDE3',
  ink50: '#E4E7EB',
  ink40: '#EAECEF',
  ink35: '#EEF0F2',
  ink25: '#F1F3F6',
  ink10: '#F3F5F8',

  slate300: '#AEB8C7',
  slate950: '#0C1016',

  // Blues
  blue900: '#132B54',
  blue850: '#153C65',
  blue800: '#172D68',
  blue700: '#2A64D6',
  blue600: '#2E7CF6',
  blue500: '#3A82FF',
  blue450: '#4F6FEA',
  blue425: '#5A73F5',
  blue400: '#5AA0FF',
  blue375: '#5D8DFF',
  blue350: '#6D9BFF',
  blue300: '#7198FF',
  blue275: '#77A1FF',
  blue100: '#B6D0FF',
  blue75: '#D5E1FF',
  blue25: '#EAF1FF',

  // Indigo (weather card)
  indigo900: '#1A1A4E',
  indigo700: '#2C2A72',
  indigo500: '#3A3897',
  indigo200: '#C7C9E0',
  indigo150: '#D7D9F4',
  indigo100: '#E4E5F8',
  indigo50: '#F0F2FF',

  // Status / accents
  cyan500: '#00D4FF',
  green900: '#143326',
  green800: '#285A42',
  green500: '#3DDC84',
  spotify: '#1ED760',
  orange500: '#F39A4A',
  amber500: '#FF9D2E',
  amber600: '#F59E0B',
  amber300: '#FBD38D',
  amber50: '#FFF8E1',
  amberDark: '#7B5E00',
  yellow500: '#FFC933',
  red600: '#E53E3E',
  red500: '#FF4C4C',
  red450: '#FF3B30',
  coral500: '#F05D62',
} as const;

/** Make a translucent version of a hex colour: alpha('#FFFFFF', 0.12) */
export function alpha(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}

/* ------------------------------------------------------------------ */
/* Semantic colours — what the UI uses                                */
/* ------------------------------------------------------------------ */
export const colors = {
  // App backgrounds
  background: palette.ink925,
  controlBar: palette.ink900,

  // Surfaces (dark cockpit)
  surface: palette.ink800,
  surfaceRaised: palette.ink750,
  surfaceSecondary: palette.ink700,
  surfaceTertiary: palette.ink600,
  surfaceSunken: palette.ink875,
  surfaceCard: palette.ink650,
  surfacePanel: palette.ink775,

  // Text / icons on dark surfaces
  onSurface: palette.white,
  onSurfaceSecondary: palette.ink250,
  onSurfaceTertiary: palette.ink125,
  textMuted: palette.ink175,
  textSubtle: palette.ink150,
  textFaint: palette.ink325,
  textSoft: palette.ink75,
  textDisabled: palette.ink450,
  textDim: palette.ink200,
  textLight: palette.ink100,

  // Light surfaces (map area)
  surfaceLight: palette.ink10,
  onSurfaceLight: palette.ink800,
  surfaceInverse: palette.ink10,
  onSurfaceInverse: palette.ink800,

  // Brand
  brand: palette.blue500,
  brandPrimary: palette.blue500,
  onBrandPrimary: palette.white,
  brandGlow: palette.blue400,
  brandSecondary: palette.blue700,
  brandTertiary: palette.blue900,
  onBrandTertiary: palette.blue100,
  brandSoft: palette.blue25,
  route: palette.blue600,
  glowBlue: palette.blue850,
  // Selected / "on" state for pills & chips
  selectedSurface: palette.blue800,
  selectedBorder: palette.blue375,
  selectedText: palette.blue350,

  // Accents
  accent: palette.orange500, // media / player highlight
  accentAmber: palette.amber500,
  accentRed: palette.red500,
  accentGreen: palette.green500,
  accentCyan: palette.cyan500,
  spotify: palette.spotify,

  // Status
  success: palette.green500,
  successSurface: palette.green900,
  successBorder: palette.green800,
  warning: palette.yellow500,
  error: palette.red500,
  danger: palette.red600,

  // Lines
  border: palette.ink600,
  borderStrong: palette.ink500,
  divider: palette.ink725,
  borderPanel: palette.ink575,
  borderMuted: palette.ink400,

  // Climate controls
  climateFan: palette.blue300,
  climateHeat: palette.coral500,
  climateThumb: palette.blue275,
  climateThumbBorder: palette.blue75,
  climateTrack: palette.ink550,
  climateAuto: palette.blue450,
  climateAutoActive: palette.blue425,

  // Weather card
  weatherGradient: [palette.indigo500, palette.indigo700, palette.indigo900] as const,
  weatherText: palette.indigo50,
  weatherTextSoft: palette.indigo100,
  weatherTextMuted: palette.indigo150,
  weatherTextFaint: palette.indigo200,

  // Translucent overlays
  white06: alpha(palette.white, 0.06),
  white08: alpha(palette.white, 0.08),
  white10: alpha(palette.white, 0.1),
  white12: alpha(palette.white, 0.12),
  white14: alpha(palette.white, 0.14),
  white18: alpha(palette.white, 0.18),
  white78: alpha(palette.white, 0.78),
  black24: alpha(palette.black, 0.24),
  black26: alpha(palette.black, 0.26),
  scrim: alpha(palette.black, 0.5),
  scrimStrong: alpha(palette.black, 0.58),

  white80: alpha(palette.white, 0.8),
  white90: alpha(palette.white, 0.9),
  white93: alpha(palette.white, 0.93),
  overlayPanel: alpha(palette.slate950, 0.72),
  cyanGlow: alpha(palette.cyan500, 0.55),
  cyanGlowSoft: alpha(palette.cyan500, 0.35),

  // Light cards floating on the map
  lightCard: palette.white,
  lightCardMuted: palette.ink25,
  lightDivider: palette.ink40,
  lightDividerSoft: palette.ink35,
  lightBorder: palette.ink60,
  lightTrack: palette.ink50,
  onLight: palette.ink800,
  onLightSecondary: palette.ink350,
  onLightMuted: palette.ink300,
  onLightStrong: palette.ink450,
  overlayText: palette.slate300,

  // Alert banner (e.g. location permission)
  alertSurface: palette.amber50,
  alertBorder: palette.amber300,
  alertText: palette.amberDark,
  alertAction: palette.amber600,

  // Third-party brand colours
  youtube: palette.red450,

  transparent: 'transparent',
  white: palette.white,
  black: palette.black,
} as const;

/** Colours for the SVG fallback map (MapView) and the Mapbox page. */
export const mapColors = {
  light: { bg1: '#F5F6F8', bg2: '#E9ECF0', street: '#D4D8DE', majorStreet: '#B8BEC7', water: '#A8C8E0', park: '#CCE1CE' },
  dark: { bg1: '#0D1219', bg2: palette.ink950, street: palette.ink600, majorStreet: palette.ink500, water: '#0B1830', park: '#0F2A1A' },
  canvas: palette.ink10,
  placeholder: palette.ink50,
  route: palette.blue600,
  routeHalo: alpha(palette.blue600, 0.2),
  destination: palette.red600,
  marker: palette.white,
  markerShadow: alpha(palette.black, 0.25),
} as const;

export type ColorToken = Exclude<keyof typeof colors, 'weatherGradient'>;

/* ------------------------------------------------------------------ */
/* Sizing scales                                                      */
/* ------------------------------------------------------------------ */
export const spacing = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export type SpacingToken = keyof typeof spacing;

export const radius = { none: 0, xs: 3, sm: 6, md: 12, card: 14, lg: 20, xl: 28, pill: 999 } as const;
export type RadiusToken = keyof typeof radius;

export const iconSize = { xs: 14, sm: 16, md: 20, lg: 24, xl: 28, xxl: 32 } as const;
export type IconSizeToken = keyof typeof iconSize;

/** Square touch targets for buttons/icon buttons. Car UIs need big targets. */
export const controlSize = { sm: 32, md: 44, lg: 60 } as const;
export type ControlSizeToken = keyof typeof controlSize;

/* ------------------------------------------------------------------ */
/* Typography                                                         */
/* ------------------------------------------------------------------ */
export const fonts = {
  display: 'BarlowCondensed-Bold',
  displayMedium: 'BarlowCondensed-Medium',
  displayRegular: 'BarlowCondensed-Regular',
  text: 'DMSans-Regular',
  textBold: 'DMSans-Bold',
} as const;

const t = (fontFamily: string, fontSize: number, extra: TextStyle = {}): TextStyle => ({ fontFamily, fontSize, ...extra });

/** Reusable text styles. Use via <Text variant="..."> from '@/src/ui'. */
export const typography = {
  hero: t(fonts.display, 56, { lineHeight: 60, letterSpacing: 1 }),
  screenTitle: t(fonts.display, 30, { letterSpacing: 2 }),
  title: t(fonts.display, 24, { letterSpacing: 1 }),
  subtitle: t(fonts.displayMedium, 17, { letterSpacing: 0.3 }),
  value: t(fonts.displayMedium, 20, { letterSpacing: 0.5 }),
  eyebrow: t(fonts.textBold, 10, { letterSpacing: 2 }),
  section: t(fonts.textBold, 11, { letterSpacing: 2 }),
  label: t(fonts.textBold, 11, { letterSpacing: 0.4 }),
  button: t(fonts.textBold, 12, { letterSpacing: 1 }),
  body: t(fonts.text, 12),
  bodyBold: t(fonts.textBold, 12),
  caption: t(fonts.text, 10),
  captionBold: t(fonts.textBold, 10, { letterSpacing: 1 }),
  micro: t(fonts.textBold, 9, { letterSpacing: 1.5 }),
} satisfies Record<string, TextStyle>;
export type TypographyToken = keyof typeof typography;

/* ------------------------------------------------------------------ */
/* Elevation & motion                                                 */
/* ------------------------------------------------------------------ */
export const shadows = {
  none: {},
  sm: { shadowColor: palette.black, shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  md: { shadowColor: palette.ink925, shadowOpacity: 0.28, shadowRadius: 16, elevation: 6 },
  lg: { shadowColor: palette.black, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  glow: { shadowColor: palette.blue500, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3 },
} satisfies Record<string, ViewStyle>;
export type ShadowToken = keyof typeof shadows;

export const motion = { fast: 150, normal: 200, slow: 300, toast: 2400 } as const;

export const tokens = { palette, colors, mapColors, spacing, radius, iconSize, controlSize, fonts, typography, shadows, motion };
export default tokens;
