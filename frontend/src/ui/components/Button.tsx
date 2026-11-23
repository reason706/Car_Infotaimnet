import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label?: string;
  icon?: IconName;
  iconRight?: IconName;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Highlighted / selected state (toggles, filters) */
  active?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<ButtonVariant, { bg: string; border: string; fg: string }> = {
  primary: { bg: colors.brand, border: colors.brand, fg: colors.onBrandPrimary },
  secondary: { bg: colors.surfaceSecondary, border: colors.border, fg: colors.onSurface },
  outline: { bg: colors.transparent, border: colors.border, fg: colors.onSurface },
  ghost: { bg: colors.transparent, border: colors.transparent, fg: colors.onSurface },
  inverse: { bg: colors.white, border: colors.white, fg: colors.surface },
};

const activeStyle = { bg: colors.brandTertiary, border: colors.brand, fg: colors.brandGlow };

const sizeStyles: Record<ButtonSize, ViewStyle & { icon: number }> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, icon: 14 },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, icon: 18 },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, icon: 22 },
};

/** Pill-shaped text button. <Button label="Open trunk" icon="car-back" variant="outline" /> */
export function Button({ label, icon, iconRight, variant = 'secondary', size = 'md', active, fullWidth, disabled, style, ...rest }: ButtonProps) {
  const v = active ? activeStyle : variantStyles[variant];
  const { icon: iconPx, ...pad } = sizeStyles[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        pad,
        { backgroundColor: v.bg, borderColor: v.border },
        fullWidth && styles.full,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={iconPx} color={v.fg} />}
      {label ? <Text variant="button" color={v.fg}>{label}</Text> : null}
      {iconRight && <View><Icon name={iconRight} size={iconPx} color={v.fg} /></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2, borderRadius: radius.pill, borderWidth: 1 },
  full: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
});
