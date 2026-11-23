import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors, ColorToken, controlSize, ControlSizeToken, iconSize, IconSizeToken, radius } from '../tokens';
import { Icon, IconName } from './Icon';
import { resolveColor } from './Text';

export type IconButtonVariant = 'ghost' | 'tinted' | 'solid' | 'inverse';

export type IconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  icon: IconName;
  variant?: IconButtonVariant;
  /** Touch-target size */
  size?: ControlSizeToken;
  iconSize?: IconSizeToken | number;
  /** Colour when inactive (token or string) */
  color?: ColorToken | (string & {});
  active?: boolean;
  /** Colour when active (default: brand) */
  activeColor?: ColorToken | (string & {});
  round?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Square/round icon-only button. Used for task bar, player controls, toggles. */
export function IconButton({
  icon, variant = 'ghost', size = 'md', iconSize: iconSz, color, active, activeColor = 'brand', round, style, children, ...rest
}: IconButtonProps) {
  const box = controlSize[size];
  const px = typeof iconSz === 'number' ? iconSz : iconSize[iconSz ?? (size === 'lg' ? 'xl' : size === 'md' ? 'lg' : 'md')];
  const fg = active ? resolveColor(activeColor, colors.brand) : resolveColor(color, variant === 'solid' ? colors.onBrandPrimary : variant === 'inverse' ? colors.surface : colors.onSurface);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      hitSlop={4}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        { width: box, height: box, borderRadius: round ? box / 2 : radius.md },
        variant === 'tinted' && styles.tinted,
        variant === 'solid' && styles.solid,
        variant === 'inverse' && styles.inverse,
        active && variant !== 'solid' && variant !== 'inverse' && styles.active,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={icon} size={px} color={fg} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tinted: { backgroundColor: colors.surfaceSecondary },
  solid: { backgroundColor: colors.brand },
  inverse: { backgroundColor: colors.white },
  active: { backgroundColor: colors.brandTertiary },
  pressed: { opacity: 0.7 },
});
