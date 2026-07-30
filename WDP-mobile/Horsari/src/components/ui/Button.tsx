import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useState } from 'react';

import { Fonts, Palette, Radius } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'compact';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
}

/**
 * Shared button primitive — see Phase 1 design system audit. Replaces the
 * per-screen bespoke Pressable + StyleSheet pattern. `accentColor` lets the
 * two role groups (spectator gold / jockey red) tint the primary variant
 * without forking the component.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  icon,
  accentColor = Palette.gold,
  style,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  const variantStyle = getVariantStyle(variant, accentColor);
  const height = size === 'compact' ? 40 : 48;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={8}
      style={[
        styles.base,
        { height, backgroundColor: variantStyle.background, borderColor: variantStyle.border, borderWidth: variantStyle.borderWidth },
        pressed && !isDisabled && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variantStyle.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: variantStyle.text }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// Relative luminance (WCAG) — picks legible text for whichever accent is passed in,
// rather than assuming a light accent like the gold/dark-text pairing that broke on red.
function contrastingText(bgHex: string): string {
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? Palette.background : '#FFFFFF';
}

function getVariantStyle(variant: ButtonVariant, accentColor: string) {
  switch (variant) {
    case 'primary':
      return { background: accentColor, border: accentColor, borderWidth: 0, text: contrastingText(accentColor) };
    case 'secondary':
      return { background: 'transparent', border: Palette.cardBorder, borderWidth: 1, text: Palette.text };
    case 'ghost':
      return { background: 'transparent', border: 'transparent', borderWidth: 0, text: accentColor };
    case 'destructive':
      return { background: Palette.red, border: Palette.red, borderWidth: 0, text: '#FFFFFF' };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disabled: { opacity: 0.4 },
});
