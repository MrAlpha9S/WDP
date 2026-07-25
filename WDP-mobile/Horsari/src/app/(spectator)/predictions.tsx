import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMyPredictions,
  getPredictionDetail,
  PredictionDetail,
  PredictionItem,
  PredictionPayoutInfo,
  PredictionStatus,
} from '../../api/spectatorApi';
import { isNetworkError } from '../../api/axios';
import { useSocket } from '../../socket/SocketContext';
import { Fonts } from '@/constants/theme';
import { RefetchButton } from '@/components/RefetchButton';
import { NoConnectionState } from '@/components/NoConnectionState';

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

const isRealTournament = (t: { tournamentName: string } | null | undefined): boolean =>
  !!t && t.tournamentName !== 'Non-tournament';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function predStatusStyle(s: PredictionStatus): { color: string; label: string; icon: string } {
  switch (s) {
    case 'correct':   return { color: Palette.green,    label: 'Correct',   icon: 'checkmark-circle' };
    case 'incorrect': return { color: Palette.red,      label: 'Incorrect', icon: 'close-circle' };
    case 'cancelled': return { color: Palette.textMuted, label: 'Cancelled', icon: 'ban-outline' };
    case 'refunded':  return { color: Palette.gold,     label: 'Refunded',  icon: 'refresh-circle' };
    default:          return { color: Palette.gold,     label: 'Pending',   icon: 'time-outline' };
  }
}

function methodIcon(type?: string): string {
  if (type === 'tournament_champion') return 'trophy-outline';
  if (type === 'race_winner') return 'medal-outline';
  return 'podium-outline';
}

// ─── Detail Row helper ────────────────────────────────────────────────────────

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Payout Section ───────────────────────────────────────────────────────────

function PayoutSection({
  item,
  detail,
  loading,
}: {
  item: PredictionItem;
  detail: PredictionDetail | null;
  loading: boolean;
}) {
  const payout: PredictionPayoutInfo | null = detail?.payoutInfo ?? null;

  if (loading) {
    return (
      <View style={styles.payoutBox}>
        <ActivityIndicator size="small" color={Palette.gold} />
      </View>
    );
  }

  if (!payout) return null;

  const { predictionStatus } = item;

  if (predictionStatus === 'pending') {
    const stake = item.rewardPoints;
    const odds = payout.odds ?? 0;
    const est = payout.estimatedCollect ?? 0;
    return (
      <View style={styles.payoutBox}>
        <Text style={styles.payoutBoxTitle}>CURRENT ODDS</Text>
        <View style={styles.payoutGrid}>
          <View style={styles.payoutCell}>
            <Text style={styles.payoutCellLabel}>STAKE</Text>
            <Text style={styles.payoutCellValue}>{stake.toLocaleString()}</Text>
          </View>
          <View style={[styles.payoutCell, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#2A2A30' }]}>
            <Text style={styles.payoutCellLabel}>ODDS</Text>
            <Text style={[styles.payoutCellValue, { color: Palette.gold }]}>{odds.toFixed(2)}×</Text>
          </View>
          <View style={styles.payoutCell}>
            <Text style={styles.payoutCellLabel}>EST. PAYOUT</Text>
            <Text style={[styles.payoutCellValue, { color: Palette.green }]}>~{Math.round(est).toLocaleString()}</Text>
          </View>
        </View>
        {payout.grossPool != null && (
          <View style={styles.payoutMeta}>
            <Ionicons name="people-outline" size={11} color={Palette.textMuted} />
            <Text style={styles.payoutMetaText}>
              {payout.totalBettors ?? 0} bettors · Pool: {(payout.grossPool ?? 0).toLocaleString()} pts · Fee: {(((payout.takeoutRate ?? 0.17)) * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (predictionStatus === 'correct') {
    return (
      <View style={[styles.payoutBox, { borderColor: `${Palette.green}44` }]}>
        <View style={styles.payoutResultRow}>
          <Ionicons name="checkmark-circle" size={18} color={Palette.green} />
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutResultLabel}>POINTS EARNED</Text>
            <Text style={[styles.payoutResultValue, { color: Palette.green }]}>
              +{(payout.actualPayout ?? item.rewardPoints).toLocaleString()} pts
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (predictionStatus === 'incorrect') {
    return (
      <View style={[styles.payoutBox, { borderColor: `${Palette.red}44` }]}>
        <View style={styles.payoutResultRow}>
          <Ionicons name="close-circle" size={18} color={Palette.red} />
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutResultLabel}>RESULT</Text>
            <Text style={[styles.payoutResultValue, { color: Palette.red }]}>Lost · 0 pts</Text>
          </View>
        </View>
      </View>
    );
  }

  if (predictionStatus === 'refunded') {
    return (
      <View style={[styles.payoutBox, { borderColor: `${Palette.gold}44` }]}>
        <View style={styles.payoutResultRow}>
          <Ionicons name="refresh-circle" size={18} color={Palette.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutResultLabel}>REFUNDED</Text>
            <Text style={[styles.payoutResultValue, { color: Palette.gold }]}>Stake refunded</Text>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function PredictionDetailModal({
  item,
  detail,
  detailLoading,
  visible,
  onClose,
}: {
  item: PredictionItem | null;
  detail: PredictionDetail | null;
  detailLoading: boolean;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  if (!item) return null;

  const { color, label, icon } = predStatusStyle(item.predictionStatus);
  const isChampion = item.predictionMethod?.methodType === 'tournament_champion';
  const isRaceWinner = item.predictionMethod?.methodType === 'race_winner';

  const title = isChampion
    ? (item.tournament?.tournamentName ?? '—')
    : (item.registration?.raceRound?.roundName ?? '—');

  const horseName = isChampion
    ? (item.predictedHorse?.horseName ?? '—')
    : (item.registration?.horse?.horseName ?? '—');

  const tournamentName = isChampion
    ? undefined
    : isRealTournament(item.registration?.raceRound?.tournament)
      ? item.registration?.raceRound?.tournament?.tournamentName
      : undefined;

  const raceDate = item.registration?.raceRound?.raceDate
    ? formatDate(item.registration.raceRound.raceDate)
    : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={[styles.sheetIconCircle, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
            <Ionicons name={icon as any} size={22} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle} numberOfLines={2}>{title}</Text>
            <View style={[styles.statusBadge, { borderColor: `${color}55`, backgroundColor: `${color}18`, alignSelf: 'flex-start', marginTop: 4 }]}>
              <Ionicons name={icon as any} size={11} color={color} />
              <Text style={[styles.statusText, { color }]}>{label.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Detail rows */}
        <View style={styles.detailList}>
          <DetailRow label="Prediction Type" value={item.predictionMethod?.methodName ?? '—'} />
          <DetailRow label="Predicted Horse" value={horseName} valueColor={Palette.gold} />
          {tournamentName && <DetailRow label="Tournament" value={tournamentName} />}
          {!isChampion && item.registration?.laneNumber != null && (
            <DetailRow label="Starting Lane" value={`#${item.registration.laneNumber}`} />
          )}
          {!isChampion && !isRaceWinner && item.predictedRank != null && (
            <DetailRow label="Predicted Rank" value={`Rank ${item.predictedRank}`} valueColor={Palette.gold} />
          )}
          {raceDate && <DetailRow label="Race Date" value={raceDate} />}
          {item.created_at && (
            <DetailRow label="Placed On" value={formatDate(item.created_at)} />
          )}
        </View>

        {/* Payout section */}
        <PayoutSection item={item} detail={detail} loading={detailLoading} />

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>CLOSE</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────

function PredictionCard({ item, onPress }: { item: PredictionItem; onPress: () => void }) {
  const { color, label, icon } = predStatusStyle(item.predictionStatus);
  const isChampion = item.predictionMethod?.methodType === 'tournament_champion';
  const isRaceWinner = item.predictionMethod?.methodType === 'race_winner';

  const horseName = isChampion
    ? (item.predictedHorse?.horseName ?? '—')
    : (item.registration?.horse?.horseName ?? '—');

  const titleText = isChampion
    ? (item.tournament?.tournamentName ?? '—')
    : (item.registration?.raceRound?.roundName ?? '—');

  const subtitleText = isChampion
    ? 'Tournament Champion'
    : isRealTournament(item.registration?.raceRound?.tournament)
      ? (item.registration?.raceRound?.tournament?.tournamentName ?? null)
      : null;

  const laneNumber = item.registration?.laneNumber;
  const methodName = item.predictionMethod?.methodName;

  return (
    <Pressable style={({ pressed }) => [styles.card, { borderLeftColor: color, opacity: pressed ? 0.85 : 1 }]} onPress={onPress}>
      {/* Top */}
      <View style={styles.cardTop}>
        <View style={[styles.cardIconBox, { backgroundColor: `${color}18` }]}>
          <Ionicons name={methodIcon(item.predictionMethod?.methodType) as any} size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardRaceName} numberOfLines={1}>{titleText}</Text>
          {subtitleText && <Text style={styles.cardTournament} numberOfLines={1}>{subtitleText}</Text>}
        </View>
        <View style={[styles.statusBadge, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
          <Ionicons name={icon as any} size={11} color={color} />
          <Text style={[styles.statusText, { color }]}>{label.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Info grid — always 2 columns */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>PREDICTED HORSE</Text>
          <Text style={[styles.infoValue, { color: Palette.gold }]} numberOfLines={1}>{horseName}</Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>
            {isChampion ? 'METHOD' : (!isRaceWinner && item.predictedRank != null ? 'PREDICTED RANK' : 'STARTING LANE')}
          </Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {isChampion
              ? (methodName ?? '—')
              : (!isRaceWinner && item.predictedRank != null
                  ? `Rank ${item.predictedRank}`
                  : (laneNumber != null ? `#${laneNumber}` : '—'))}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        {methodName && (
          <View style={styles.methodChip}>
            <Ionicons name={methodIcon(item.predictionMethod?.methodType) as any} size={10} color={Palette.textMuted} />
            <Text style={styles.methodChipText} numberOfLines={1}>{methodName}</Text>
          </View>
        )}
        {item.rewardPoints > 0 ? (
          <View style={styles.pointsChip}>
            <Ionicons name="star" size={10} color={Palette.green} />
            <Text style={styles.pointsChipText}>+{item.rewardPoints} pts</Text>
          </View>
        ) : (
          <View style={styles.chevronBox}>
            <Ionicons name="chevron-forward" size={14} color={Palette.textMuted} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Filter config ────────────────────────────────────────────────────────────

type FilterKey = 'all' | PredictionStatus;

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all',       label: 'All',       color: Palette.textMuted },
  { key: 'pending',   label: 'Pending',   color: Palette.gold },
  { key: 'correct',   label: 'Correct',   color: Palette.green },
  { key: 'incorrect', label: 'Incorrect', color: Palette.red },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PredictionsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PredictionItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<PredictionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = async (filter: FilterKey, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await getMyPredictions(filter);
      setPredictions(result.predictions);
      setTotal(result.meta.total);
    } catch (err) {
      if (isNetworkError(err)) setError('network');
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setLastUpdated(Date.now());
  };

  useEffect(() => { load(activeFilter); }, [activeFilter]);

  // Live refetch when a tournament's status changes or a champion is decided.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = () => load(activeFilter, true);
    socket.on('tournament:status_changed', handler);
    socket.on('tournament_champion', handler);
    return () => {
      socket.off('tournament:status_changed', handler);
      socket.off('tournament_champion', handler);
    };
  }, [socket, activeFilter]);

  const onFilterChange = (f: FilterKey) => {
    setActiveFilter(f);
    setPredictions([]);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    load(activeFilter, true);
  };

  const openDetail = async (item: PredictionItem) => {
    setSelectedItem(item);
    setSelectedDetail(null);
    setDetailLoading(true);
    setModalVisible(true);
    const detail = await getPredictionDetail(item._id);
    setSelectedDetail(detail);
    setDetailLoading(false);
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
          <Text style={styles.headerTitle}>PREDICTIONS</Text>
          {total > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{total}</Text>
            </View>
          )}
          <RefetchButton onRefetch={() => load(activeFilter, true)} lastUpdated={lastUpdated} loading={isRefreshing} accentColor={Palette.gold} />
          <Pressable style={styles.addBtn} onPress={() => router.push('/new-prediction' as any)}>
            <Ionicons name="add" size={20} color={Palette.background} />
          </Pressable>
        </View>

        {/* ─── Filter bar ─── */}
        <View style={styles.filterBar}>
          {FILTERS.map(({ key, label, color }) => {
            const active = activeFilter === key;
            return (
              <Pressable
                key={key}
                style={[styles.filterPill, active && { borderColor: color, backgroundColor: `${color}1A` }]}
                onPress={() => onFilterChange(key)}>
                <Text style={[styles.filterPillText, active && { color }]}>{label}</Text>
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
          <NoConnectionState
            onRetry={() => load(activeFilter)}
            accentColor={Palette.gold}
            mutedColor={Palette.textMuted}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, predictions.length === 0 && styles.scrollEmpty]}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Palette.gold} />
            }>

            {predictions.length > 0 && (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Prediction History</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{total} total</Text>
                </View>
              </View>
            )}

            {predictions.map(item => (
              <PredictionCard key={item._id} item={item} onPress={() => openDetail(item)} />
            ))}

            {predictions.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="stats-chart-outline" size={40} color={Palette.textMuted} />
                <Text style={styles.emptyText}>No predictions yet</Text>
              </View>
            )}

            <View style={styles.bottomPad} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ─── Detail Modal ─── */}
      <PredictionDetailModal
        item={selectedItem}
        detail={selectedDetail}
        detailLoading={detailLoading}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
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
  totalBadgeText: { fontFamily: Fonts.mono, fontSize: 11, fontWeight: '700', color: Palette.text },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 14,
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

  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  scrollEmpty: { flexGrow: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: Palette.gold },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Palette.text },
  countBadge: {
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700', color: Palette.textMuted },

  // ── Card ──
  card: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRaceName: { fontSize: 14, fontWeight: '700', color: Palette.text },
  cardTournament: { fontFamily: Fonts.mono, fontSize: 10, color: Palette.textMuted, letterSpacing: 0.2, marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: Palette.cardBorder },

  // Info grid — always 2 equal columns
  infoGrid: { flexDirection: 'row', gap: 8 },
  infoCell: {
    flex: 1,
    backgroundColor: '#111113',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 10,
  },
  infoLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  infoValue: { fontSize: 13, fontWeight: '700', color: Palette.text },

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
    flex: 1,
  },
  methodChipText: { fontFamily: Fonts.mono, fontSize: 10, color: Palette.textMuted },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Palette.green}18`,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${Palette.green}44`,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointsChipText: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700', color: Palette.green },
  chevronBox: { padding: 2 },

  // ── Modal / Sheet ──
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#18181A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A40',
    marginBottom: 18,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  sheetIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: Palette.text, lineHeight: 22 },

  detailList: { gap: 0 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#22222A',
  },
  detailLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Palette.textMuted, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '700', color: Palette.text, flex: 1, textAlign: 'right' },

  closeBtn: {
    marginTop: 20,
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMuted,
  },

  // ── Payout Section ──
  payoutBox: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A30',
    backgroundColor: '#111113',
    overflow: 'hidden',
  },
  payoutBoxTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.textMuted,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  payoutGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#2A2A30',
  },
  payoutCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  payoutCellLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Palette.textMuted,
  },
  payoutCellValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.text,
  },
  payoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#2A2A30',
  },
  payoutMetaText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    flex: 1,
  },
  payoutResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  payoutResultLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Palette.textMuted,
    marginBottom: 2,
  },
  payoutResultValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
  },

  // Empty / error states
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Palette.textMuted, textAlign: 'center' },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', letterSpacing: 1, color: Palette.gold },
  bottomPad: { height: 20 },
});
