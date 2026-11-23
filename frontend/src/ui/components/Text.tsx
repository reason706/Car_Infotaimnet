import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors, ColorToken, typography, TypographyToken } from '../tokens';

export type TextProps = RNTextProps & {
  /** Text style preset from tokens.typography */
  variant?: TypographyToken;
  /** Colour token name (e.g. "onSurfaceSecondary") or any colour string */
  color?: ColorToken | (string & {});
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
};

export function resolveColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  return (colors as Record<string, unknown>)[color] as string ?? color;
}

/** Themed text. <Text variant="eyebrow" color="accentCyan">LIVE</Text> */
export function Text({ variant = 'body', color, align, uppercase, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: resolveColor(color, colors.onSurface) },
        align && { textAlign: align },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
