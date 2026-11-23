import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, ColorToken, iconSize, IconSizeToken } from '../tokens';
import { resolveColor } from './Text';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type IconProps = {
  name: IconName;
  /** Size token ("sm" | "md" | ...) or exact pixels */
  size?: IconSizeToken | number;
  color?: ColorToken | (string & {});
  testID?: string;
};

/** The one icon set used across the app. Swap the icon family here. */
export function Icon({ name, size = 'lg', color, testID }: IconProps) {
  const px = typeof size === 'number' ? size : iconSize[size];
  return <MaterialCommunityIcons name={name} size={px} color={resolveColor(color, colors.onSurface)} testID={testID} />;
}
