import { Ionicons } from '@expo/vector-icons';
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

import {
  getMyPredictions,
  PredictionItem,
  PredictionStatus,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function predStatusStyle(s: PredictionStatus): { color: string; label: string; icon: string } {
  switch (s) {
    case 'correct':   return { color: Palette.green, label: 'Đúng',       icon: 'checkmark-circle' };
    case 'incorrect': return { color: Palette.red,   label: 'Sai',        icon: 'close-circle' };
    case 'cancelled': return { color: Palette.textMuted, label: 'Đã hủy', icon: 'ban-outline' };
    case 'refunded':  return { color: Palette.gold,  label: 'Hoàn điểm',  icon: 'refresh-circle' };
    default:          return { color: Palette.gold,  label: 'Đang chờ',   icon: 'time-outline' };
  }
}

// ─── Prediction Card ──────────────────────────────────────────────────────────

function PredictionCard({ item }: { item: PredictionItem }) {
  const { color, label, icon } = predStatusStyle(item.predictionStatus);
  const horse = item.registration?.horse?.horseName ?? '—';
  const raceName = item.registration?.raceRound?.roundName ?? '—';
  const tournament = item.registration?.raceRound?.tournament?.tournamentName;
  const raceDate = item.registration?.raceRound?.raceDate
    ? formatViDate(item.registration.raceRound.raceDate)
    : null;
  const laneNumber = item.registration?.laneNumber;
  const method = item.predictionMethod?.methodName;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      {/* Top: race info + status */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardRaceName} numberOfLines={2}>{raceName}</Text>
          {tournament && (
            <Text style={styles.cardTournament} numberOfLines={1}>{tournament}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
          <Ionicons name={icon as any} size={12} color={color} />
          <Text style={[styles.statusText, { color }]}>{label.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Middle: prediction details */}
      <View style={styles.cardMid}>
        <View style={styles.midItem}>
          <Text style={styles.midLabel}>NGỰA ĐUA</Text>
          <Text style={styles.midValue} numberOfLines={1}>{horse}</Text>
        </View>
        {laneNumber != null && (
          <View style={styles.midItem}>
            <Text style={styles.midLabel}>Ô XUẤT PHÁT</Text>
            <Text style={styles.midValue}>#{laneNumber}</Text>
          </View>
        )}
        <View style={styles.midItem}>
          <Text style={styles.midLabel}>DỰ ĐOÁN XẾP HẠNG</Text>
          <Text style={[styles.midValue, { color: Palette.gold }]}>
            Hạng {item.predictedRank}
          </Text>
        </View>
        {item.rewardPoints > 0 && (
          <View style={styles.midItem}>
            <Text style={styles.midLabel}>ĐIỂM THƯỞNG</Text>
            <Text style={[styles.midValue, { color: Palette.green }]}>
              +{item.rewardPoints}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: method + date */}
      <View style={styles.cardFooter}>
        {method && (
          <View style={styles.methodChip}>
            <Ionicons name="bulb-outline" size={11} color={Palette.textMuted} />
            <Text style={styles.methodChipText} numberOfLines={1}>{method}</Text>
          </View>
        )}
        {raceDate && (
          <Text style={styles.cardDate}>{raceDate}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Filter config ────────────────────────────────────────────────────────────

type FilterKey = 'all' | PredictionStatus;

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all',       label: 'Tất cả',    color: Palette.textMuted },
  { key: 'pending',   label: 'Chờ',       color: Palette.gold },
  { key: 'correct',   label: 'Đúng',      color: Palette.green },
  { key: 'incorrect', label: 'Sai',       color: Palette.red },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PredictionsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (filter: FilterKey, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    const result = await getMyPredictions(filter);
    setPredictions(result.predictions);
    setTotal(result.meta.total);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(activeFilter); }, [activeFilter]);

  const onFilterChange = (f: FilterKey) => {
    setActiveFilter(f);
    setPredictions([]);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    load(activeFilter, true);
  };

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
          <Text style={styles.headerTitle}>DỰ ĐOÁN</Text>
          {total > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{total}</Text>
            </View>
          )}
        </View>

        {/* ─── Filter bar ─── */}
        <View style={styles.filterBar}>
          {FILTERS.map(({ key, label, color }) => {
            const active = activeFilter === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.filterPill,
                  active && { borderColor: color, backgroundColor: `${color}1A` },
                ]}
                onPress={() => onFilterChange(key)}>
                <Text style={[styles.filterPillText, active && { color }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Body ─── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={40} color={Palette.textMuted} />
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load(activeFilter)}>
              <Text style={styles.retryText}>THỬ LẠI</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, predictions.length === 0 && styles.scrollEmpty]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={Palette.gold}
              />
            }>

            {predictions.length > 0 && (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Lịch sử dự đoán</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{total} lần</Text>
                </View>
              </View>
            )}

            {predictions.map((item) => (
              <PredictionCard key={item._id} item={item} />
            ))}

            {predictions.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="stats-chart-outline" size={40} color={Palette.textMuted} />
                <Text style={styles.emptyText}>Chưa có dự đoán nào</Text>
              </View>
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
  totalBadge: {
    backgroundColor: Palette.red,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.text,
  },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  filterPillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Palette.textMuted,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  scrollEmpty: { flexGrow: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  sectionAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: Palette.gold },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Palette.text },
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
    color: Palette.textMuted,
  },

  // Card
  card: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: Palette.gold,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardRaceName: { fontSize: 15, fontWeight: '700', color: Palette.text, lineHeight: 20 },
  cardTournament: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: Palette.cardBorder },
  cardMid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  midItem: { minWidth: '40%', flex: 1 },
  midLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Palette.textMuted,
    marginBottom: 3,
  },
  midValue: { fontSize: 14, fontWeight: '700', color: Palette.text },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1E22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
  },
  methodChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    flex: 1,
  },
  cardDate: { fontSize: 11, color: Palette.textMuted },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, color: Palette.textMuted, textAlign: 'center' },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.gold,
  },
  bottomPad: { height: 20 },
});
