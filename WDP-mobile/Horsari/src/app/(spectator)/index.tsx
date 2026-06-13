import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthContext';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  gold: '#C9A24B',
} as const;

export default function SpectatorHome() {
  const { session, logout } = useAuth();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="eye-outline" size={40} color={Palette.gold} />
          </View>

          <Text style={styles.title}>KHU VỰC KHÁN GIẢ</Text>
          <Text style={styles.subtitle}>Xin chào, {session?.user.fullName || session?.user.username}</Text>

          <View style={styles.badge}>
            <Ionicons name="construct-outline" size={14} color={Palette.gold} />
            <Text style={styles.badgeText}>ĐANG PHÁT TRIỂN</Text>
          </View>

          <Text style={styles.body}>
            Tính năng dành cho khán giả đang được xây dựng.{'\n'}
            Vui lòng quay lại sau.
          </Text>

          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={16} color={Palette.red} />
            <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E1A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3010',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.gold,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A1215',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.red,
  },
});
