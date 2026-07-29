import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useState } from 'react';

import { Palette, Radius } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  live?: boolean;
  style?: ViewStyle;
}

/**
 * Shared card primitive — see Phase 1 design system audit. Elevation is a
 * border, not a shadow (shadows read poorly on the app's near-black surfaces).
 * `live` adds the standard in-progress treatment (gold border + pulse dot).
 */
export function Card({ children, onPress, live = false, style }: CardProps) {
  const [pressed, setPressed] = useState(false);

  const content = (
    <View
      style={[
        styles.base,
        live && styles.live,
        pressed && onPress && styles.pressed,
        style,
      ]}>
      {live && <View style={styles.liveDot} />}
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  live: { borderColor: Palette.gold },
  liveDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Palette.red,
  },
});
