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

import { getMyRaceSchedule, ScheduleItem } from '../../api/jockeyApi';
import { useAuth } from '../../auth/AuthContext';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  redLight: '#E8828A',
  gold: '#C9A24B',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildCountdown(dateStr: string): string {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diff = target - now;
  if (diff <= 0) return 'Đang diễn ra';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}n ${hours}g`;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} — ${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = dayStart(new Date());
  const ds = dayStart(d);
  if (ds === today) return 'Hôm nay';
  if (ds === today + 86_400_000) return 'Ngày mai';
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Next Race Card ───────────────────────────────────────────────────────────

function NextRaceCard({ item }: { item: ScheduleItem }) {
  const [countdown, setCountdown] = useState(
    item.raceRound?.raceDate ? buildCountdown(item.raceRound.raceDate) : '—'
  );

  useEffect(() => {
    if (!item.raceRound?.raceDate) return;
    const id = setInterval(() => {
      setCountdown(buildCountdown(item.raceRound!.raceDate));
    }, 30_000);
    return () => clearInterval(id);
  }, [item.raceRound?.raceDate]);

  const title =
    item.tournament?.tournamentName ?? item.raceRound?.roundName ?? 'Vòng đua tiếp theo';
  const horse = item.horse?.horseName ?? '—';
  const location = item.raceRound?.location ?? '—';

  return (
    <View style={styles.nextRaceCard}>
      <LinearGradient
        colors={['#2A1215', '#1C1A10', '#0E1018']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.nextRaceGradient}>
        <View style={styles.nextRaceBadge}>
          <Text style={styles.nextRaceBadgeText}>TRẬN ĐẤU TIẾP THEO</Text>
        </View>
        <View style={styles.nextRaceBody}>
          <View style={styles.nextRaceLeft}>
            <Text style={styles.nextRaceTitle} numberOfLines={2}>{title}</Text>
            <View style={styles.nextRaceHorseRow}>
              <Ionicons name="ribbon-outline" size={12} color={Palette.redLight} />
              <Text style={styles.nextRaceHorse} numberOfLines={1}>{horse}</Text>
              {item.isBackup && (
                <View style={styles.backupTag}>
                  <Text style={styles.backupTagText}>DỰ PHÒNG</Text>
                </View>
              )}
            </View>
            <View style={styles.nextRaceLocationRow}>
              <Ionicons name="location-outline" size={12} color={Palette.textMuted} />
              <Text style={styles.nextRaceLocation} numberOfLines={1}>{location}</Text>
            </View>
          </View>
          <View style={styles.nextRaceRight}>
            <Text style={styles.countdownLabel}>KHỞI TRANH TRONG</Text>
            <Text style={styles.countdown}>{countdown}</Text>
            {item.raceRound?.raceDate && (
              <Text style={styles.nextRaceDate}>
                {formatShortDate(item.raceRound.raceDate)}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Upcoming Race Row ────────────────────────────────────────────────────────

function UpcomingRow({ item }: { item: ScheduleItem }) {
  const title =
    item.tournament?.tournamentName ?? item.raceRound?.roundName ?? 'Vòng đua';
  const date = item.raceRound?.raceDate ? formatDateTime(item.raceRound.raceDate) : '—';
  const horse = item.horse?.horseName ?? '—';

  return (
    <View style={styles.upcomingRow}>
      <View style={styles.upcomingTimeCol}>
        <Text style={styles.upcomingDate}>
          {item.raceRound?.raceDate ? formatShortDate(item.raceRound.raceDate) : '—'}
        </Text>
      </View>
      <View style={styles.upcomingInfo}>
        <Text style={styles.upcomingTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.upcomingMeta} numberOfLines={1}>
          {horse} · {item.raceRound?.location ?? '—'}
        </Text>
      </View>
      {item.isBackup && (
        <View style={styles.backupTag}>
          <Text style={styles.backupTagText}>DỰ PHÒNG</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { session } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const data = await getMyRaceSchedule();
    const sorted = [...data].sort((a, b) => {
      const ta = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate).getTime() : Infinity;
      const tb = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate).getTime() : Infinity;
      return ta - tb;
    });
    setSchedule(sorted);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  const nextRace = schedule[0] ?? null;
  const upcomingRest = schedule.slice(1, 4);

  const confirmedCount = schedule.length;
  const officialCount = schedule.filter((i) => !i.isBackup).length;
  const backupCount = schedule.filter((i) => i.isBackup).length;

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
          <Text style={styles.headerTitle}>TRANG CHỦ</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Palette.red}
            />
          }>

          {/* ─── Welcome ─── */}
          <Text style={styles.welcomeSub}>CHÀO MỪNG TRỞ LẠI,</Text>
          <Text style={styles.welcomeTitle}>
            {session?.user.fullName || session?.user.username || 'Tay đua'}
          </Text>

          {/* ─── Stats Grid ─── */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statAccentRed]}>
                <Text style={styles.statLabel}>TỔNG TRẬN ĐÃ XÁC NHẬN</Text>
                <Text style={[styles.statValue, { color: Palette.redLight }]}>
                  {isLoading ? '—' : confirmedCount}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>VAI CHÍNH THỨC</Text>
                <Text style={styles.statValue}>
                  {isLoading ? '—' : officialCount}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>VAI DỰ PHÒNG</Text>
                <Text style={[styles.statValue, { color: Palette.gold }]}>
                  {isLoading ? '—' : backupCount}
                </Text>
              </View>
              <View style={[styles.statCard, styles.statAccentGold]}>
                <Text style={styles.statLabel}>TRẬN TIẾP THEO</Text>
                <Text style={[styles.statValue, { color: Palette.gold, fontSize: 14 }]}>
                  {isLoading
                    ? '—'
                    : nextRace?.raceRound?.raceDate
                      ? formatShortDate(nextRace.raceRound.raceDate)
                      : 'Chưa có'}
                </Text>
              </View>
            </View>
          </View>

          {/* ─── Next Race ─── */}
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={Palette.red} />
            </View>
          ) : nextRace ? (
            <NextRaceCard item={nextRace} />
          ) : (
            <View style={styles.noRaceCard}>
              <LinearGradient
                colors={['#1A1215', '#0E100C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="calendar-outline" size={28} color={Palette.textMuted} />
              <Text style={styles.noRaceText}>Chưa có lịch thi đấu nào được xác nhận</Text>
              <Text style={styles.noRaceSubText}>
                Kiểm tra lại trang Lời mời để nhận thêm lịch thi đấu
              </Text>
            </View>
          )}

          {/* ─── Upcoming races ─── */}
          {upcomingRest.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>Lịch sắp tới</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {confirmedCount} TRẬN
                  </Text>
                </View>
              </View>

              <View style={styles.upcomingList}>
                {upcomingRest.map((item) => (
                  <UpcomingRow key={item.invitationId} item={item} />
                ))}
                {confirmedCount > 4 && (
                  <View style={styles.moreRow}>
                    <Text style={styles.moreText}>
                      +{confirmedCount - 4} trận khác · Xem tất cả ở tab SCHEDULE
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* ─── Info notice ─── */}
          {schedule.length > 0 && (
            <View style={styles.infoNotice}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Palette.redLight}
              />
              <Text style={styles.infoText}>
                Hãy đảm bảo bạn có mặt tại trường đua ít nhất 2 tiếng trước khi bắt đầu
                để kiểm tra sức khỏe và thiết bị.
              </Text>
            </View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },

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

  welcomeSub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Palette.red,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 20,
  },

  // Stats Grid
  statsGrid: { gap: 12, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 6,
  },
  statAccentRed: { borderLeftWidth: 3, borderLeftColor: Palette.red },
  statAccentGold: { borderColor: Palette.gold },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: Palette.text, letterSpacing: 0.5 },

  // Next Race Card
  nextRaceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 20,
  },
  nextRaceGradient: { padding: 20 },
  nextRaceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.redLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  nextRaceBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#1A0608',
  },
  nextRaceBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  nextRaceLeft: { flex: 1, gap: 8 },
  nextRaceTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: 0.5,
    lineHeight: 25,
  },
  nextRaceHorseRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextRaceHorse: { fontSize: 13, color: Palette.redLight, fontWeight: '600', flex: 1 },
  nextRaceLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nextRaceLocation: { fontSize: 11, color: Palette.textMuted, flex: 1 },
  nextRaceRight: { alignItems: 'flex-end', gap: 4 },
  countdownLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  countdown: {
    fontFamily: Fonts.mono,
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 1,
  },
  nextRaceDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.gold,
    letterSpacing: 0.5,
  },

  // No race / loading placeholders
  loadingCard: {
    height: 120,
    backgroundColor: Palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noRaceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  noRaceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
  },
  noRaceSubText: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Upcoming list
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Palette.gold,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  countBadge: {
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },

  upcomingList: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
    marginBottom: 20,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
    gap: 12,
  },
  upcomingTimeCol: { minWidth: 56 },
  upcomingDate: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.gold,
    letterSpacing: 0.3,
  },
  upcomingInfo: { flex: 1, gap: 3 },
  upcomingTitle: { fontSize: 14, fontWeight: '700', color: Palette.text },
  upcomingMeta: { fontSize: 12, color: Palette.textMuted },
  moreRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    letterSpacing: 0.3,
  },

  backupTag: {
    backgroundColor: '#1A1A2A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  backupTagText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#8888CC',
  },

  // Info notice
  infoNotice: {
    flexDirection: 'row',
    backgroundColor: '#1A1214',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A1A1C',
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, color: Palette.textMuted },

  bottomPad: { height: 20 },
});
