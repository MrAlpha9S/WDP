import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Fonts } from '@/constants/theme';
import { NETWORK_ERROR_MESSAGE } from '../api/axios';

interface NoConnectionStateProps {
  onRetry: () => void;
  message?: string;
  accentColor?: string;
  mutedColor?: string;
  style?: ViewStyle;
}

// Shared "can't reach the server" empty state — same icon/message/RETRY shape
// every screen was independently re-implementing. No shared Palette exists on
// mobile (every screen redeclares its own), so colors are props with neutral
// defaults, matching RefetchButton's convention.
export function NoConnectionState({
  onRetry,
  message = NETWORK_ERROR_MESSAGE,
  accentColor = '#9A9AA0',
  mutedColor = '#6B6B70',
  style,
}: NoConnectionStateProps) {
  return (
    <View style={[styles.center, style]}>
      <Ionicons name="cloud-offline-outline" size={40} color={mutedColor} />
      <Text style={[styles.text, { color: mutedColor }]}>{message}</Text>
      <Pressable style={[styles.retryBtn, { borderColor: accentColor }]} onPress={onRetry}>
        <Text style={[styles.retryText, { color: accentColor }]}>RETRY</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  text: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
