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
  getSpectatorStatistics,
  getRewardsEarningsSeries,
  SpectatorStatistics,
  RewardsEarningsSeries,
  PredictionMethodType,
} from '../../api/spectatorApi';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  gold: '#C9A24B',
  green: '#22C55E',
} as const;

type GroupBy = 'day' | 'week' | 'month' | 'year';
const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'day', label: 'DAY' },
  { value: 'week', label: 'WEEK' },
  { value: 'month', label: 'MONTH' },
  { value: 'year', label: 'YEAR' },
];

const METHOD_TYPE_LABELS: Record<PredictionMethodType, string> = {
  race_winner: 'Race Winner',
  race_rank: 'Race Rank',
  tournament_champion: 'Tournament Champion',
};

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

// ─── Rewards bar chart (no charting library in this app — flex-View bars,
// same primitive already used for the win-rate mini bar on profile.tsx) ───────

function RewardsBarChart({ series }: { series: RewardsEarningsSeries['series'] }) {
  const max = Math.max(...series.map((s) => s.rewardsEarned), 1);
  return (
    <View style={styles.barChart}>
      {series.map((s, i) => (
        <View key={i} style={styles.barCol}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { height: `${Math.max((s.rewardsEarned / max) * 100, s.rewardsEarned > 0 ? 4 : 0)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StatisticsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<SpectatorStatistics | null>(null);
  const [series, setSeries] = useState<RewardsEarningsSeries | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [isSeriesLoading, setIsSeriesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [s, rs] = await Promise.all([
      getSpectatorStatistics(),
      getRewardsEarningsSeries(groupBy),
    ]);
    setStats(s);
    setSeries(rs);
    setIsLoading(false);
    setIsSeriesLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setIsSeriesLoading(true);
    getRewardsEarningsSeries(groupBy).then((rs) => {
      setSeries(rs);
      setIsSeriesLoading(false);
    });
  }, [groupBy]);

  const onRefresh = () => { setIsRefreshing(true); load(true); };

  const methodEntries = stats
    ? (Object.entries(stats.predictionsByMethodType) as [PredictionMethodType, { count: number; pct: number }][])
    : [];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>STATISTICS</Text>
          <View style={{ width: 22 }} />
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
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Palette.gold} />
            }>

            {/* ─── Win rate ─── */}
            <View style={styles.winRateCard}>
              {stats && stats.totalPredictions === 0 ? (
                <View style={styles.winRateLeft}>
                  <Text style={styles.statLabel}>WIN RATE</Text>
                  <Text style={styles.winRateEmpty}>NO PREDICTIONS YET</Text>
                  <Text style={styles.statSub}>Place your first prediction</Text>
                </View>
              ) : (
                <>
                  <View style={styles.winRateLeft}>
                    <Text style={styles.statLabel}>WIN RATE</Text>
                    <Text style={[styles.winRateBig, { color: Palette.gold }]}>
                      {(stats?.winRate ?? 0).toFixed(1)}%
                    </Text>
                    <Text style={styles.statSub}>
                      {stats?.correct ?? 0} correct / {(stats?.correct ?? 0) + (stats?.incorrect ?? 0)} settled
                    </Text>
                  </View>
                  <View style={styles.miniChart}>
                    <View style={[styles.miniChartFill, { flex: (stats?.winRate ?? 0) / 100 }]} />
                    <View style={{ flex: 1 - (stats?.winRate ?? 0) / 100 }} />
                  </View>
                </>
              )}
            </View>

            {/* ─── Stat cards ─── */}
            <View style={styles.statsRow}>
              <StatCard
                label="TOTAL PREDICTIONS"
                value={String(stats?.totalPredictions ?? 0)}
                sub={`${stats?.pending ?? 0} pending`}
              />
              <StatCard
                label="REWARDS EARNED"
                value={`${formatPoints(stats?.totalRewardsEarned ?? 0)}`}
                valueColor={Palette.green}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="TOTAL STAKED"
                value={`${formatPoints(stats?.totalStaked ?? 0)}`}
                valueColor={Palette.red}
              />
              <StatCard
                label="NET PROFIT"
                value={`${(stats?.netProfit ?? 0) >= 0 ? '+' : ''}${formatPoints(stats?.netProfit ?? 0)}`}
                valueColor={(stats?.netProfit ?? 0) >= 0 ? Palette.green : Palette.red}
              />
            </View>

            {/* ─── Rewards over time ─── */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.txAccent} />
              <Text style={styles.sectionTitle}>Rewards Over Time</Text>
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
                  <ActivityIndicator color={Palette.gold} size="small" />
                </View>
              ) : series && series.totalRewardsEarned > 0 ? (
                <>
                  <RewardsBarChart series={series.series} />
                  <Text style={styles.chartTotal}>
                    Total: {series.totalRewardsEarned.toLocaleString()} points
                  </Text>
                </>
              ) : (
                <View style={styles.chartLoading}>
                  <Text style={styles.statSub}>No data yet</Text>
                </View>
              )}
            </View>

            {/* ─── Breakdown by method type ─── */}
            {methodEntries.length > 0 && (
              <>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.txAccent} />
                  <Text style={styles.sectionTitle}>By Prediction Method</Text>
                </View>
                <View style={styles.methodList}>
                  {methodEntries.map(([type, info]) => (
                    <View key={type} style={styles.methodRow}>
                      <View style={styles.methodHeaderRow}>
                        <Text style={styles.methodName}>{METHOD_TYPE_LABELS[type] ?? type}</Text>
                        <Text style={styles.methodCount}>{info.count} ({info.pct}%)</Text>
                      </View>
                      <View style={styles.methodBarTrack}>
                        <View style={[styles.methodBarFill, { width: `${info.pct}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

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
    color: Palette.gold,
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
  winRateEmpty: { fontSize: 16, fontWeight: '700', color: Palette.textMuted, letterSpacing: 0.5 },
  miniChart: {
    flexDirection: 'row',
    height: 10,
    width: 80,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#262629',
  },
  miniChartFill: { backgroundColor: Palette.gold },

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
  txAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: Palette.gold },
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
  groupByBtnActive: { backgroundColor: 'rgba(201,162,75,0.18)' },
  groupByBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  groupByBtnTextActive: { color: Palette.gold },
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
    backgroundColor: Palette.gold,
    minHeight: 2,
  },
  chartTotal: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 12,
    textAlign: 'right',
  },

  // Method breakdown
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
  methodBarFill: { height: '100%', borderRadius: 3, backgroundColor: Palette.gold },

  bottomPad: { height: 20 },
});
