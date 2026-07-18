import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getJockeyStatistics,
  getEarningsSeries,
  JockeyStatistics,
  EarningsSeries,
} from '../../api/jockeyApi';
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

type GroupBy = 'day' | 'week' | 'month' | 'year';
const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'day', label: 'NGÀY' },
  { value: 'week', label: 'TUẦN' },
  { value: 'month', label: 'THÁNG' },
  { value: 'year', label: 'NĂM' },
];

function formatPoints(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
}

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

// ─── Payouts bar chart (no charting library in this app — flex-View bars,
// same primitive already used for spectator statistics) ───────────────────────

function PayoutsBarChart({ series }: { series: EarningsSeries['series'] }) {
  const max = Math.max(...series.map((s) => s.payoutsEarned), 1);
  return (
    <View style={styles.barChart}>
      {series.map((s, i) => (
        <View key={i} style={styles.barCol}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { height: `${Math.max((s.payoutsEarned / max) * 100, s.payoutsEarned > 0 ? 4 : 0)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JockeyStatisticsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<JockeyStatistics | null>(null);
  const [series, setSeries] = useState<EarningsSeries | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [s, es] = await Promise.all([
      getJockeyStatistics(),
      getEarningsSeries(groupBy),
    ]);
    setStats(s);
    setSeries(es);
    setIsLoading(false);
    setIsSeriesLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setIsSeriesLoading(true);
    getEarningsSeries(groupBy).then((es) => {
      setSeries(es);
      setIsSeriesLoading(false);
    });
  }, [groupBy]);

  const onRefresh = () => { setIsRefreshing(true); load(true); };

  const totalRoleCount = (stats?.byRole.main.count ?? 0) + (stats?.byRole.backup.count ?? 0);
  const mainPct = totalRoleCount > 0 ? Math.round(((stats?.byRole.main.count ?? 0) / totalRoleCount) * 100) : 0;
  const backupPct = totalRoleCount > 0 ? Math.round(((stats?.byRole.backup.count ?? 0) / totalRoleCount) * 100) : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>THỐNG KÊ</Text>
          <View style={{ width: 22 }} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.red} size="large" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Palette.red} />
            }>

            {/* ─── Win rate / rank ─── */}
            <View style={styles.winRateCard}>
              <View style={styles.winRateLeft}>
                <Text style={styles.statLabel}>TỶ LỆ THẮNG</Text>
                <Text style={[styles.winRateBig, { color: Palette.redLight }]}>
                  {((stats?.winRate ?? 0) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.statSub}>
                  {stats?.rank != null ? `HẠNG #${stats.rank} / ${stats.totalJockeys}` : 'CHƯA XẾP HẠNG'}
                </Text>
              </View>
              <View style={styles.miniChart}>
                <View style={[styles.miniChartFill, { flex: stats?.winRate ?? 0 }]} />
                <View style={{ flex: 1 - (stats?.winRate ?? 0) }} />
              </View>
            </View>

            {/* ─── Stat cards ─── */}
            <View style={styles.statsRow}>
              <StatCard
                label="ĐÃ NHẬN"
                value={`${formatPoints(stats?.totalPayoutsEarned ?? 0)}`}
                valueColor={Palette.gold}
              />
              <StatCard
                label="ĐANG CHỜ"
                value={`${formatPoints(stats?.pendingPayoutsAmount ?? 0)}`}
                valueColor={Palette.textMuted}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="TRẬN ĐÃ ĐUA"
                value={String(stats?.matchesRaced ?? 0)}
                sub={`${stats?.totalWins ?? 0} chiến thắng`}
              />
              <StatCard
                label="LỜI MỜI ĐÃ NHẬN"
                value={String(stats?.invitations.accepted ?? 0)}
                sub={`${stats?.invitations.noShow ?? 0} vắng mặt`}
              />
            </View>

            {/* ─── Payouts over time ─── */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.txAccent} />
              <Text style={styles.sectionTitle}>Thu nhập theo thời gian</Text>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.groupByRow}>
                {GROUP_BY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setGroupBy(opt.value)}
                    style={[styles.groupByBtn, groupBy === opt.value && styles.groupByBtnActive]}>
                    <Text style={[styles.groupByBtnText, groupBy === opt.value && styles.groupByBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isSeriesLoading ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator color={Palette.red} size="small" />
                </View>
              ) : series && series.series.length > 0 ? (
                <>
                  <PayoutsBarChart series={series.series} />
                  <Text style={styles.chartTotal}>
                    Tổng: {series.totalPayoutsEarned.toLocaleString()} ₫
                  </Text>
                </>
              ) : (
                <View style={styles.chartLoading}>
                  <Text style={styles.statSub}>Chưa có dữ liệu</Text>
                </View>
              )}
            </View>

            {/* ─── Main vs backup breakdown ─── */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.txAccent} />
              <Text style={styles.sectionTitle}>Theo vai trò</Text>
            </View>
            <View style={styles.methodList}>
              <View style={styles.methodRow}>
                <View style={styles.methodHeaderRow}>
                  <Text style={styles.methodName}>Vai chính thức</Text>
                  <Text style={styles.methodCount}>
                    {stats?.byRole.main.count ?? 0} · {formatPoints(stats?.byRole.main.earnings ?? 0)} ({mainPct}%)
                  </Text>
                </View>
                <View style={styles.methodBarTrack}>
                  <View style={[styles.methodBarFill, { width: `${mainPct}%` }]} />
                </View>
              </View>
              <View style={styles.methodRow}>
                <View style={styles.methodHeaderRow}>
                  <Text style={styles.methodName}>Vai dự phòng</Text>
                  <Text style={styles.methodCount}>
                    {stats?.byRole.backup.count ?? 0} · {formatPoints(stats?.byRole.backup.earnings ?? 0)} ({backupPct}%)
                  </Text>
                </View>
                <View style={styles.methodBarTrack}>
                  <View style={[styles.methodBarFill, { width: `${backupPct}%` }]} />
                </View>
              </View>
            </View>

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: Palette.red,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Win rate
  winRateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  winRateLeft: { flex: 1, gap: 4 },
  winRateBig: { fontFamily: Fonts.mono, fontSize: 28, fontWeight: '900' },
  miniChart: {
    flexDirection: 'row',
    height: 10,
    width: 80,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#262629',
  },
  miniChartFill: { backgroundColor: Palette.red },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 6,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  statValue: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Palette.text,
  },
  statSub: { fontSize: 11, color: Palette.textMuted },

  // Section title
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 12 },
  txAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: Palette.red },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Palette.text },

  // Chart card
  chartCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 8,
  },
  groupByRow: {
    flexDirection: 'row',
    backgroundColor: '#0E0E12',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  groupByBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  groupByBtnActive: { backgroundColor: 'rgba(200,30,46,0.18)' },
  groupByBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  groupByBtnTextActive: { color: Palette.redLight },
  chartLoading: { height: 120, alignItems: 'center', justifyContent: 'center' },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 4,
  },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { flex: 1, justifyContent: 'flex-end' },
  barFill: {
    width: '100%',
    borderRadius: 3,
    backgroundColor: Palette.red,
    minHeight: 2,
  },
  chartTotal: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 12,
    textAlign: 'right',
  },

  // Role breakdown
  methodList: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 16,
  },
  methodRow: { gap: 6 },
  methodHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  methodName: { fontSize: 13, fontWeight: '600', color: Palette.text },
  methodCount: { fontFamily: Fonts.mono, fontSize: 11, color: Palette.textMuted },
  methodBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#262629',
    overflow: 'hidden',
  },
  methodBarFill: { height: '100%', borderRadius: 3, backgroundColor: Palette.red },

  bottomPad: { height: 20 },
});
