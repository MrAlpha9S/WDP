import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Fonts, Palette, Radius } from '@/constants/theme';

export type BadgeTone = 'gold' | 'red' | 'green' | 'amber' | 'violet' | 'muted';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Small pulsing dot instead of an icon — for "in progress" states (live race, running). */
  dot?: boolean;
}

// Exported so screens that draw their own status-colored elements (card
// borders, accent stripes, etc.) reuse this exact tone→hex mapping instead
// of re-deriving/duplicating it — one source of truth for what each tone means.
export const TONE_COLOR: Record<BadgeTone, string> = {
  gold: Palette.gold,
  red: Palette.red,
  green: Palette.green,
  amber: Palette.amber,
  violet: Palette.violet,
  muted: Palette.textMuted,
};

/**
 * Status badge — always pairs color with a label (never color-only), per
 * Phase 1 design system audit.
 */
export function Badge({ label, tone = 'muted', icon, dot = false }: BadgeProps) {
  const color = TONE_COLOR[tone];
  return (
    <View style={[styles.base, { borderColor: `${color}44`, backgroundColor: `${color}18` }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      {icon && <Ionicons name={icon} size={10} color={color} />}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
