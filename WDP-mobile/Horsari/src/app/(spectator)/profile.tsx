import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthContext';
import {
  getSpectatorProfile,
  getWalletInfo,
  SpectatorProfile,
  WalletInfo,
} from '../../api/spectatorApi';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  redDark: '#8C1620',
  gold: '#C9A24B',
  goldDark: '#1E1A0A',
  green: '#22C55E',
} as const;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon as any} size={18} color={Palette.textMuted} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <View style={styles.settingsRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color={Palette.textMuted} />}
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SpectatorProfileScreen() {
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState<SpectatorProfile | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [p, w] = await Promise.all([getSpectatorProfile(), getWalletInfo()]);
    setProfile(p);
    setWallet(w);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  const displayName =
    profile?.user.fullName ||
    session?.user.fullName ||
    profile?.user.username ||
    session?.user.username ||
    'Khán giả';

  const rewardPoints =
    wallet?.spectator.wallet ?? profile?.spectator.wallet ?? 0;

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
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={Palette.gold}
              />
            }>

            {/* ─── Hero card ─── */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={['#1A180A', '#121218', '#0A0A12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={44} color={Palette.textMuted} />
                  </View>
                  <View style={styles.avatarBadge}>
                    <Ionicons name="eye" size={10} color={Palette.gold} />
                  </View>
                </View>
                <Text style={styles.heroName}>{displayName}</Text>
                {profile?.user.email && (
                  <Text style={styles.heroEmail}>{profile.user.email}</Text>
                )}
                <View style={styles.heroPointsRow}>
                  <Ionicons name="star" size={14} color={Palette.gold} />
                  <Text style={styles.heroPoints}>
                    {rewardPoints.toLocaleString()} điểm thưởng
                  </Text>
                </View>
                <Pressable style={styles.btnEdit}>
                  <Text style={styles.btnEditText}>CHỈNH SỬA HỒ SƠ</Text>
                </Pressable>
              </View>
            </View>

            {/* ─── Prediction Stats ─── */}
            {profile?.stats && (
              <>
                <Text style={styles.sectionTitle}>Thống kê dự đoán</Text>
                <View style={styles.statsRow}>
                  <StatCard
                    label="TỔNG DỰ ĐOÁN"
                    value={String(profile.stats.totalPredictions)}
                    sub="tổng số lần"
                  />
                  <StatCard
                    label="DỰ ĐOÁN ĐÚNG"
                    value={String(profile.stats.totalCorrectPredictions)}
                    valueColor={Palette.green}
                    sub="kết quả đúng"
                  />
                </View>
                <View style={styles.winRateCard}>
                  <View style={styles.winRateLeft}>
                    <Text style={styles.statLabel}>TỶ LỆ CHÍNH XÁC</Text>
                    <View style={styles.winRateValueRow}>
                      <Text style={[styles.winRateBig, { color: Palette.gold }]}>
                        {profile.stats.winRate.toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={styles.statSub}>
                      {profile.stats.totalCorrectPredictions} đúng / {profile.stats.totalPredictions} tổng
                    </Text>
                  </View>
                  {/* Mini bar chart */}
                  <View style={styles.miniChart}>
                    <View style={[styles.miniChartFill, { flex: profile.stats.winRate / 100 }]} />
                    <View style={{ flex: 1 - profile.stats.winRate / 100 }} />
                  </View>
                </View>
              </>
            )}

            {/* ─── Wallet ─── */}
            {wallet && (
              <>
                <Text style={styles.sectionTitle}>Ví điểm thưởng</Text>
                <View style={styles.walletCard}>
                  <LinearGradient
                    colors={['#1E1A0A', '#161410', '#0E0E12']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.walletRow}>
                    <View style={styles.walletItem}>
                      <Text style={styles.walletLabel}>SỐ DƯ HIỆN TẠI</Text>
                      <Text style={[styles.walletValue, { color: Palette.gold }]}>
                        {wallet.spectator.wallet.toLocaleString()}
                      </Text>
                      <Text style={styles.walletUnit}>điểm</Text>
                    </View>
                    <View style={styles.walletDivider} />
                    <View style={styles.walletItem}>
                      <Text style={styles.walletLabel}>TỔNG ĐÃ KIẾM</Text>
                      <Text style={[styles.walletValue, { color: Palette.green }]}>
                        {wallet.stats.totalEarned.toLocaleString()}
                      </Text>
                      <Text style={styles.walletUnit}>điểm</Text>
                    </View>
                  </View>
                  <View style={styles.walletActions}>
                    <Pressable style={styles.walletBtnDeposit}>
                      <Ionicons name="add-circle-outline" size={15} color={Palette.gold} />
                      <Text style={styles.walletBtnDepositText}>NẠP ĐIỂM</Text>
                    </Pressable>
                    <Pressable style={styles.walletBtnWithdraw}>
                      <Ionicons name="arrow-down-circle-outline" size={15} color={Palette.textMuted} />
                      <Text style={styles.walletBtnWithdrawText}>RÚT ĐIỂM</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {/* ─── Account info ─── */}
            {profile?.user && (
              <>
                <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
                <View style={styles.infoCard}>
                  {profile.user.phoneNumber && (
                    <SettingsRow
                      icon="call-outline"
                      label="Số điện thoại"
                      value={profile.user.phoneNumber}
                    />
                  )}
                  {profile.user.address && (
                    <SettingsRow
                      icon="location-outline"
                      label="Địa chỉ"
                      value={profile.user.address}
                    />
                  )}
                  <SettingsRow
                    icon="shield-checkmark-outline"
                    label="Đổi mật khẩu"
                    onPress={() => {}}
                  />
                  <SettingsRow
                    icon="globe-outline"
                    label="Ngôn ngữ"
                    value="Tiếng Việt"
                  />
                </View>
              </>
            )}

            {/* ─── Logout ─── */}
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={16} color={Palette.red} />
              <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
            </Pressable>

            <View style={styles.bottomPad} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

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
    color: Palette.gold,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 12,
    marginTop: 4,
  },

  // Hero
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3010',
    marginBottom: 24,
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
    borderColor: '#3A3010',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.goldDark,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontSize: 20, fontWeight: '800', color: Palette.text, letterSpacing: 0.3 },
  heroEmail: { fontSize: 13, color: Palette.textMuted },
  heroPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.goldDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3010',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  heroPoints: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.gold,
  },
  btnEdit: {
    height: 40,
    alignSelf: 'stretch',
    backgroundColor: Palette.gold,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnEditText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#0A0A0B',
  },

  // Stats
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
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 0.3,
  },
  statSub: { fontSize: 11, color: Palette.textMuted },
  winRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  winRateLeft: { flex: 1, gap: 4 },
  winRateValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  winRateBig: { fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  miniChart: {
    width: 8,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#2A2A2D',
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  miniChartFill: {
    backgroundColor: Palette.gold,
    borderRadius: 4,
  },

  // Wallet
  walletCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3010',
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  walletItem: { flex: 1, alignItems: 'center', gap: 4 },
  walletLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Palette.textMuted,
  },
  walletValue: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  walletUnit: { fontSize: 11, color: Palette.textMuted },
  walletDivider: { width: 1, height: 60, backgroundColor: Palette.cardBorder },
  walletActions: { flexDirection: 'row', gap: 10 },
  walletBtnDeposit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    backgroundColor: Palette.goldDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3010',
  },
  walletBtnDepositText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Palette.gold,
  },
  walletBtnWithdraw: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  walletBtnWithdrawText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },

  // Info card
  infoCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  settingsLabel: { flex: 1, fontSize: 14, color: Palette.text },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingsValue: { fontSize: 13, color: Palette.textMuted },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 4,
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
