import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile, JockeyProfileData } from '../../api/jockeyApi';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  redDark: '#8C1620',
  redLight: '#E8828A',
  gold: '#C9A24B',
} as const;

// Ordinal position strings look like '1st'/'23rd'/'DNF' — pull the leading
// number back out, or null for non-numeric finishes (DNF/no-show).
function parsePosition(position: string): number | null {
  const n = parseInt(position, 10);
  return Number.isNaN(n) ? null : n;
}

function attendanceLabel(attendance: JockeyProfileData['recentRaces'][number]['attendance']): string | null {
  if (attendance === 'backup') return 'DỰ PHÒNG';
  if (attendance === 'no_show') return 'VẮNG MẶT';
  return null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [biometricOn, setBiometricOn] = useState(false);
  const [profile, setProfile] = useState<JockeyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout, session } = useAuth();

  const load = async () => {
    setIsLoading(true);
    setError(null);
    const data = await getMyProfile();
    if (data) {
      setProfile(data);
    } else {
      setError('Không thể tải hồ sơ. Vui lòng thử lại.');
    }
    setIsLoading(false);
  };

  // Fetches on mount and whenever this screen regains focus (e.g. returning
  // from Edit Profile), so saved changes show up without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const numericPositions = (profile?.recentRaces ?? [])
    .map((r) => parsePosition(r.position))
    .filter((n): n is number => n !== null);
  const hasPlacement = numericPositions.length > 0;
  const avgPlacement = hasPlacement
    ? (numericPositions.reduce((a, b) => a + b, 0) / numericPositions.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top']}>
          <ActivityIndicator color={Palette.red} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top']}>
          <Ionicons name="cloud-offline-outline" size={40} color={Palette.textMuted} />
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>THỬ LẠI</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ─── Header ─── */}
          <View style={styles.header}>
          <View style={styles.headerLogoCircle}>
            <Image
              source={require('@/assets/images/horsari-logo.png')}
              style={styles.headerLogoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>HỒ SƠ CỦA TÔI</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>

          {/* ─── Hero card ─── */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#3A1A0A', '#1A1A2A', '#0A0A12']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBg}
            />
            <View style={styles.heroContent}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  {profile.jockey.image ? (
                    <Image source={{ uri: profile.jockey.image }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={44} color={Palette.textMuted} />
                  )}
                </View>
                <View style={styles.avatarBadge}>
                  <Ionicons name="trophy" size={10} color={Palette.gold} />
                </View>
              </View>
              <Text style={styles.heroName}>{session?.user.fullName || session?.user.username || 'Jockey'}</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroRank}>
                  {profile.jockey.rank != null
                    ? `HẠNG #${profile.jockey.rank} / ${profile.jockey.totalJockeys}`
                    : 'CHƯA XẾP HẠNG'}
                </Text>
              </View>
              <Pressable
                style={styles.btnEditProfile}
                onPress={() => router.push('/(jockey)/edit-profile')}>
                <Text style={styles.btnEditProfileText}>CHỈNH SỬA HỒ SƠ</Text>
              </Pressable>
            </View>
          </View>

          {/* ─── Professional Stats ─── */}
          <Text style={styles.cardSectionTitle}>Thống kê chuyên môn</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>SỐ LẦN THẮNG</Text>
              <Text style={[styles.statBig, { color: Palette.redLight }]}>
                {profile.stats.wins.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TỔNG THU NHẬP</Text>
              <Text style={[styles.statBig, { color: Palette.gold }]}>
                {profile.stats.totalPrize.toLocaleString()} ₫
              </Text>
            </View>
          </View>

          <View style={styles.placementCard}>
            <View style={styles.placementLeft}>
              <Text style={styles.statLabel}>THỨ HẠNG TRUNG BÌNH</Text>
              <View style={styles.placementValueRow}>
                {hasPlacement ? (
                  <Text style={styles.placementBig}>{avgPlacement}</Text>
                ) : (
                  <Text style={styles.placementEmpty}>Chưa có dữ liệu</Text>
                )}
                <Text style={styles.placementSub}>trên {profile.stats.totalRaces} lần đua</Text>
              </View>
            </View>
          </View>

          <View style={styles.bookingFeeCard}>
            <View>
              <Text style={styles.statLabel}>PHÍ ĐẶT CƯỠI MẶC ĐỊNH</Text>
              <Text style={styles.bookingFeeSub}>Mức phí tối thiểu khi chủ ngựa mời bạn</Text>
            </View>
            <Text style={styles.bookingFeeValue}>
              {profile.jockey.bookingFee.toLocaleString()} ₫
            </Text>
          </View>

          {/* ─── Recent Races ─── */}
          <Text style={styles.cardSectionTitle}>Đua gần đây</Text>
          <View style={styles.raceList}>
            {profile.recentRaces.length === 0 ? (
              <View style={styles.raceEmpty}>
                <Ionicons name="flag-outline" size={32} color={Palette.textMuted} />
                <Text style={styles.emptyText}>Chưa có lịch sử đua nào</Text>
              </View>
            ) : (
              profile.recentRaces.map((race, i) => (
                <View key={i}>
                  <View style={styles.raceRow}>
                    <View style={styles.raceBody}>
                      <Text style={styles.raceName} numberOfLines={1}>{race.race}</Text>
                      <Text style={styles.raceMeta} numberOfLines={1}>{race.horse} · {race.date}</Text>
                    </View>
                    <View style={styles.raceRight}>
                      <Text style={styles.racePosition}>{race.position}</Text>
                      {attendanceLabel(race.attendance) && (
                        <Text style={styles.raceAttendance}>{attendanceLabel(race.attendance)}</Text>
                      )}
                    </View>
                  </View>
                  {i < profile.recentRaces.length - 1 && <View style={styles.raceDivider} />}
                </View>
              ))
            )}
          </View>

          {/* ─── Account Settings ─── */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Cài đặt tài khoản</Text>

            <View style={styles.settingsRow}>
              <Ionicons name="globe-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.settingsLabel}>Ngôn ngữ</Text>
              <View style={styles.settingsRight}>
                <Text style={styles.settingsValue}>Tiếng Việt</Text>
              </View>
            </View>

            <View style={styles.settingsDivider} />

            <View style={styles.settingsRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.settingsLabel}>Đăng nhập sinh trắc học</Text>
              <Switch
                value={biometricOn}
                onValueChange={setBiometricOn}
                trackColor={{ false: Palette.cardBorder, true: Palette.red }}
                thumbColor={Palette.text}
              />
            </View>
          </View>

          {/* ─── Log out ─── */}
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={16} color={Palette.red} />
            <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
          </Pressable>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Palette.textMuted, textAlign: 'center' },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.red,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.red,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  headerLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#101011',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoImg: { width: 22, height: 22 },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: Palette.red,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Hero card
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 24,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E1E24',
    borderWidth: 2,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2A2010',
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 0.3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroRank: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.gold,
  },
  btnEditProfile: {
    height: 40,
    alignSelf: 'stretch',
    backgroundColor: Palette.red,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnEditProfileText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.text,
  },
  // Stats
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 4,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  statBig: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statSub: { fontSize: 11, color: Palette.textMuted },

  placementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  placementLeft: { flex: 1, gap: 6 },
  placementValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  placementBig: {
    fontSize: 32,
    fontWeight: '800',
    color: Palette.text,
  },
  placementEmpty: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  placementSub: { fontSize: 12, color: Palette.textMuted },

  bookingFeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  bookingFeeSub: { fontSize: 11, color: Palette.textMuted, marginTop: 2, maxWidth: 200 },
  bookingFeeValue: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    fontWeight: '800',
    color: Palette.gold,
  },

  // Recent races
  raceList: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
    marginBottom: 20,
  },
  raceEmpty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  raceBody: { flex: 1, gap: 2 },
  raceName: { fontSize: 14, fontWeight: '600', color: Palette.text },
  raceMeta: { fontSize: 12, color: Palette.textMuted },
  raceRight: { alignItems: 'flex-end', gap: 2 },
  racePosition: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    color: Palette.gold,
  },
  raceAttendance: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  raceDivider: { height: 1, backgroundColor: Palette.cardBorder, marginHorizontal: 14 },

  // Settings
  settingsCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    paddingVertical: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    color: Palette.text,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsValue: {
    fontSize: 14,
    color: Palette.textMuted,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Palette.cardBorder,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.red,
  },

  bottomPad: { height: 20 },
});
