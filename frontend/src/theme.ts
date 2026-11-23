/**
 * Compatibility layer: `theme` is built from the design tokens in
 * `src/ui/tokens.ts`. Edit values THERE, not here.
 */
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

export const theme = {
  colors,
  spacing,
  radius,
  font: fonts,
};

export type Theme = typeof theme;
