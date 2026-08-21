export const theme = {
  colors: {
    // Dark charcoal base matching reference
    surface: '#1B1D22',
    surfaceRaised: '#22252B',
    surfaceSecondary: '#2A2D34',
    surfaceTertiary: '#33373F',
    onSurface: '#FFFFFF',
    onSurfaceSecondary: '#8D93A0',
    onSurfaceTertiary: '#B6BAC3',

    // Light surfaces for map area
    surfaceLight: '#F3F5F8',
    onSurfaceLight: '#1B1D22',

    // Accents — blue primary (matches reference), amber kept as secondary
    brand: '#3A82FF',
    brandPrimary: '#3A82FF',
    onBrandPrimary: '#FFFFFF',
    brandGlow: '#5AA0FF',
    accentAmber: '#FF9D2E',
    accentRed: '#FF4C4C',
    accentGreen: '#3DDC84',
    accentCyan: '#00D4FF',

    // Utility
    border: '#33373F',
    borderStrong: '#454955',
    divider: '#25282E',
    success: '#3DDC84',
    warning: '#FFC933',
    error: '#FF4C4C',
    // Legacy names used by existing screens
    brandSecondary: '#2A64D6',
    brandTertiary: '#132B54',
    onBrandTertiary: '#B6D0FF',
    surfaceInverse: '#F3F5F8',
    onSurfaceInverse: '#1B1D22',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { sm: 6, md: 12, lg: 20, xl: 28, pill: 999 },
  font: {
    display: 'BarlowCondensed-Bold',
    displayMedium: 'BarlowCondensed-Medium',
    displayRegular: 'BarlowCondensed-Regular',
    text: 'DMSans-Regular',
    textBold: 'DMSans-Bold',
  },
};

export type Theme = typeof theme;
