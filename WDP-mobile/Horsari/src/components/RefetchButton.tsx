import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { Fonts } from '@/constants/theme';
import { formatAgo } from '../utils/formatAgo';

interface RefetchButtonProps {
  onRefetch: () => void | Promise<void>;
  lastUpdated: number | null;
  loading?: boolean;
  accentColor?: string;
  borderColor?: string;
  style?: ViewStyle;
}

// Manual refresh trigger + a ticking "last updated X ago" label. Ported from
// WDP-web/Horsari/src/components/RefetchButton.tsx — doesn't own fetch logic
// or lastUpdated state itself, the caller sets lastUpdated (Date.now()) at
// the end of its own load() function, keeping this dumb and reusable across
// every screen's differently-shaped fetch function. No shared Palette exists
// on mobile (every screen redeclares its own), so colors are props with
// neutral defaults instead of a Palette-shaped object.
export function RefetchButton({
  onRefetch,
  lastUpdated,
  loading,
  accentColor = '#9A9AA0',
  borderColor = '#262629',
  style,
}: RefetchButtonProps) {
  const [now, setNow] = useState(() => Date.now());
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading ?? internalLoading;

  useEffect(() => {
    if (lastUpdated == null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isLoading) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading, spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handlePress = async () => {
    if (isLoading) return;
    setInternalLoading(true);
    try {
      await onRefetch();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      style={[styles.button, { borderColor, opacity: isLoading ? 0.6 : 1 }, style]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="refresh" size={12} color={accentColor} />
      </Animated.View>
      <Text style={[styles.label, { color: accentColor }]}>
        {lastUpdated != null ? `Updated ${formatAgo(lastUpdated, now)}` : 'Refetch'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
