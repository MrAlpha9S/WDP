import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  getRaceSchedule,
  RaceScheduleItem,
  ScheduleFilter,
} from '../../api/spectatorApi';
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
  green: '#22C55E',
  amber: '#E07B3A',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} • ${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function statusLabel(s: string): { label: string; color: string } {
  if (s === 'running')              return { label: 'Đang chạy',      color: Palette.red };
  if (s === 'prepared')             return { label: 'Chuẩn bị',       color: Palette.amber };
  if (s === 'scheduled')            return { label: 'Sắp diễn ra',    color: Palette.gold };
  if (s === 'completed')            return { label: 'Đã kết thúc',    color: Palette.textMuted };
  if (s === 'awaitingConfirmation') return { label: 'Chờ xác nhận',   color: Palette.amber };
  return { label: s, color: Palette.textMuted };
}

// ─── Race Card ────────────────────────────────────────────────────────────────

function RaceCard({ item, onPress }: { item: RaceScheduleItem; onPress?: () => void }) {
  const { label, color } = statusLabel(item.status);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
    <View style={[
      styles.raceCard,
      item.status === 'running'              && styles.raceCardLive,
      item.status === 'prepared'             && styles.raceCardPrepared,
      item.status === 'awaitingConfirmation' && styles.raceCardPrepared,
    ]}>
      {/* Top row: name + status */}
      <View style={styles.raceCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.raceName} numberOfLines={2}>{item.roundName}</Text>
          {item.tournament && (
            <Text style={styles.raceTournament} numberOfLines={1}>
              {item.tournament.tournamentName}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
          {(item.status === 'running' || item.status === 'prepared' || item.status === 'awaitingConfirmation') && (
            <View style={[styles.runningDot, { backgroundColor: color }]} />
          )}
          <Text style={[styles.statusBadgeText, { color }]}>{label.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Meta grid */}
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={Palette.gold} />
          <Text style={styles.metaText}>{formatViDateTime(item.raceDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={Palette.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
        </View>
        {item.trackLength != null && (
          <View style={styles.metaItem}>
            <Ionicons name="speedometer-outline" size={13} color={Palette.textMuted} />
            <Text style={styles.metaText}>{item.trackLength} m</Text>
          </View>
        )}
        {item.raceGround && (
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={13} color={Palette.textMuted} />
            <Text style={styles.metaText}>{item.raceGround}</Text>
          </View>
        )}
      </View>

      {/* Participants + prize footer */}
      <View style={styles.raceCardFooter}>
        <View style={styles.participantsChip}>
          <Ionicons name="people-outline" size={12} color={Palette.textMuted} />
          <Text style={styles.participantsText}>
            {item.currentParticipants}/{item.maxParticipants ?? '?'} tham gia
          </Text>
        </View>
        {item.tournament?.prizePool != null && item.tournament.prizePool > 0 && (
          <View style={styles.prizeChip}>
            <Ionicons name="trophy-outline" size={12} color={Palette.gold} />
            <Text style={styles.prizeText}>
              ${item.tournament.prizePool.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

    </View>
    </Pressable>
  );
}

// ─── Filter definition ────────────────────────────────────────────────────────

const FILTERS: { key: ScheduleFilter; label: string; color: string }[] = [
  { key: 'running',   label: 'Đang diễn ra', color: Palette.red   },
  { key: 'prepared',  label: 'Chuẩn bị',     color: Palette.amber },
  { key: 'scheduled', label: 'Sắp diễn ra',  color: Palette.gold  },
  { key: 'completed', label: 'Đã kết thúc',  color: Palette.textMuted },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ScheduleFilter>('scheduled');
  const [races, setRaces] = useState<RaceScheduleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (filter: ScheduleFilter, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    const result = await getRaceSchedule(filter);
    setRaces(result.raceRounds);
    setTotal(result.meta.total);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(activeFilter); }, [activeFilter]);

  const onFilterChange = (f: ScheduleFilter) => {
    setActiveFilter(f);
    setRaces([]);
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
          <Text style={styles.headerTitle}>LỊCH ĐUA</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
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
            contentContainerStyle={[styles.scroll, races.length === 0 && styles.scrollEmpty]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={Palette.gold}
              />
            }>

            {races.length > 0 && (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>
                  {FILTERS.find(f => f.key === activeFilter)?.label}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{total} vòng đua</Text>
                </View>
              </View>
            )}

            {races.map((item) => (
              <RaceCard
                key={item._id}
                item={item}
                onPress={() => router.push(`/(spectator)/race/${item._id}` as any)}
              />
            ))}

            {races.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={40} color={Palette.textMuted} />
                <Text style={styles.emptyText}>Không có cuộc đua nào</Text>
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

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Race card
  raceCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  raceCardLive: {
    borderColor: '#5C1A1F',
  },
  raceCardPrepared: {
    borderColor: '#6B3A1A',
  },
  raceCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  raceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    lineHeight: 21,
    marginBottom: 3,
  },
  raceTournament: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    letterSpacing: 0.3,
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
  runningDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: Palette.cardBorder },
  metaGrid: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: Palette.textMuted, flex: 1 },
  raceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  participantsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  participantsText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  prizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3010',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  prizeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.gold,
  },

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
