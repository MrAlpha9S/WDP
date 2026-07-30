import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette, Radius } from '@/constants/theme';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accentColor?: string;
  /** Optional trailing count, e.g. number of items matching this filter. */
  count?: number;
}

/**
 * Filter chip — replaces the bespoke "filter pill" Pressable + StyleSheet
 * pattern duplicated across predictions, statistics, payments, invites, and
 * the jockey dashboard. See Phase 1 design system audit.
 */
export function Chip({ label, active, onPress, accentColor = Palette.gold, count }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, active && { borderColor: accentColor, backgroundColor: `${accentColor}1A` }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={count != null ? `${label}, ${count}` : label}>
      <Text style={[styles.label, active && { color: accentColor }]}>{label}</Text>
      {count != null && count > 0 && (
        <View style={[styles.count, active && { backgroundColor: accentColor }]}>
          <Text style={[styles.countText, active && { color: Palette.background }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Palette.textMuted,
  },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.textMuted,
  },
});
