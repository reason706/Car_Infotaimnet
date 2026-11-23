import React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius as radii, RadiusToken, shadows, ShadowToken, spacing, SpacingToken } from '../tokens';

export type CardVariant = 'surface' | 'raised' | 'secondary' | 'panel' | 'media' | 'outline' | 'glass';

export type CardProps = ViewProps & {
  variant?: CardVariant;
  padding?: SpacingToken;
  radius?: RadiusToken;
  shadow?: ShadowToken;
  style?: StyleProp<ViewStyle>;
};

const variants: Record<CardVariant, ViewStyle> = {
  surface: { backgroundColor: colors.surface, borderColor: colors.border },
  raised: { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
  secondary: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
  panel: { backgroundColor: colors.surfacePanel, borderColor: colors.borderPanel },
  media: { backgroundColor: colors.surfaceCard, borderColor: colors.white08 },
  outline: { backgroundColor: colors.transparent, borderColor: colors.border },
  glass: { backgroundColor: colors.white12, borderColor: colors.white10 },
};

/** Container with background, border, radius and padding from tokens. */
export function Card({ variant = 'raised', padding = 'lg', radius = 'lg', shadow = 'none', style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[{ borderWidth: 1, borderRadius: radii[radius], padding: spacing[padding] }, variants[variant], shadows[shadow], style]}
    />
  );
}
