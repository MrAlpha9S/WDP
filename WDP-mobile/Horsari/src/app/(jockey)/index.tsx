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

import {
  getAllRaces,
  getMyRaceSchedule,
  RaceScheduleItem,
  ScheduleFilter,
  ScheduleItem,
} from '../../api/jockeyApi';
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
  amber: '#E07B3A',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildCountdown(dateStr: string): string {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diff = target - now;
  if (diff <= 0) return 'In progress';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}n ${hours}g`;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = dayStart(new Date());
  const ds = dayStart(d);
  if (ds === today) return 'Today';
  if (ds === today + 86_400_000) return 'Tomorrow';
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatViDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} • ${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

const isRealTournament = (t: { tournamentName: string } | null | undefined): boolean =>
  !!t && t.tournamentName !== 'Non-tournament';

// ─── Next Race Card ───────────────────────────────────────────────────────────

type RaceVariant = 'live' | 'prepared' | 'scheduled';

function variantForStatus(status: string | undefined): RaceVariant {
  if (status === 'running') return 'live';
  if (status === 'prepared') return 'prepared';
  return 'scheduled';
}

const VARIANT_BADGE: Record<RaceVariant, { text: string; bg: string; textColor: string }> = {
  live: { text: 'LIVE NOW', bg: '#C81E2E', textColor: '#FFFFFF' },
  prepared: { text: 'READY TO START', bg: '#C9A24B', textColor: '#1A1408' },
  scheduled: { text: 'NEXT RACE', bg: '#E8828A', textColor: '#1A0608' },
};

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
    item.tournament?.tournamentName ?? item.raceRound?.roundName ?? 'Next race round';
  const horse = item.horse?.horseName ?? '—';
  const location = item.raceRound?.location ?? '—';
  const variant = variantForStatus(item.raceRound?.status);
  const badge = VARIANT_BADGE[variant];

  return (
    <View style={styles.nextRaceCard}>
      <LinearGradient
        colors={['#2A1215', '#1C1A10', '#0E1018']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.nextRaceGradient}>
        <View style={[styles.nextRaceBadge, { backgroundColor: badge.bg }]}>
          {variant === 'live' && <View style={styles.liveDot} />}
          <Text style={[styles.nextRaceBadgeText, { color: badge.textColor }]}>{badge.text}</Text>
        </View>
        <View style={styles.nextRaceBody}>
          <View style={styles.nextRaceLeft}>
            <Text style={styles.nextRaceTitle} numberOfLines={2}>{title}</Text>
            <View style={styles.nextRaceHorseRow}>
              <Ionicons name="ribbon-outline" size={12} color={Palette.redLight} />
              <Text style={styles.nextRaceHorse} numberOfLines={1}>{horse}</Text>
              {item.isBackup && (
                <View style={styles.backupTag}>
                  <Text style={styles.backupTagText}>BACKUP</Text>
                </View>
              )}
            </View>
            <View style={styles.nextRaceLocationRow}>
              <Ionicons name="location-outline" size={12} color={Palette.textMuted} />
              <Text style={styles.nextRaceLocation} numberOfLines={1}>{location}</Text>
            </View>
          </View>
          <View style={styles.nextRaceRight}>
            <Text style={styles.countdownLabel}>STARTS IN</Text>
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

// ─── All-Races Card (read-only browse — jockeys don't drill into a race) ─────

function statusLabel(s: string): { label: string; color: string } {
  if (s === 'running')              return { label: 'Running',              color: Palette.red };
  if (s === 'prepared')             return { label: 'Preparing',            color: Palette.amber };
  if (s === 'scheduled')            return { label: 'Upcoming',             color: Palette.gold };
  if (s === 'completed')            return { label: 'Completed',            color: Palette.textMuted };
  if (s === 'awaitingConfirmation') return { label: 'Awaiting Confirmation', color: Palette.amber };
  return { label: s, color: Palette.textMuted };
}

function AllRaceCard({ item }: { item: RaceScheduleItem }) {
  const { label, color } = statusLabel(item.status);

  return (
    <View style={[
      styles.raceCard,
      item.status === 'running'              && styles.raceCardLive,
      item.status === 'prepared'             && styles.raceCardPrepared,
      item.status === 'awaitingConfirmation' && styles.raceCardPrepared,
    ]}>
      <View style={styles.raceCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.raceName} numberOfLines={2}>{item.roundName}</Text>
          {isRealTournament(item.tournament) && (
            <Text style={styles.raceTournament} numberOfLines={1}>
              {item.tournament!.tournamentName}
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

      <View style={styles.raceCardDivider} />

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
              {item.tournament.prizePool.toLocaleString()} ₫
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const ALL_RACES_FILTERS: { key: ScheduleFilter; label: string; color: string }[] = [
  { key: 'running',   label: 'Live',      color: Palette.red   },
  { key: 'prepared',  label: 'Preparing', color: Palette.amber },
  { key: 'scheduled', label: 'Upcoming',  color: Palette.gold  },
  { key: 'completed', label: 'Completed', color: Palette.textMuted },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { session } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [allRacesFilter, setAllRacesFilter] = useState<ScheduleFilter>('scheduled');
  const [allRaces, setAllRaces] = useState<RaceScheduleItem[]>([]);
  const [allRacesTotal, setAllRacesTotal] = useState(0);
  const [isLoadingAllRaces, setIsLoadingAllRaces] = useState(true);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const data = await getMyRaceSchedule();
    setSchedule(data);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const loadAllRaces = async (filter: ScheduleFilter, silent = false) => {
    if (!silent) setIsLoadingAllRaces(true);
    const result = await getAllRaces(filter);
    setAllRaces(result.raceRounds);
    setAllRacesTotal(result.meta.total);
    setIsLoadingAllRaces(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadAllRaces(allRacesFilter); }, [allRacesFilter]);

  const onRefresh = () => {
    setIsRefreshing(true);
    Promise.all([load(true), loadAllRaces(allRacesFilter, true)]);
  };

  const onAllRacesFilterChange = (f: ScheduleFilter) => {
    setAllRacesFilter(f);
    setAllRaces([]);
  };

  // A jockey can hold at most one overlapping accepted race at a time
  // (enforced server-side by JockeyScheduleConflict), so live/prepared are
  // effectively singular — priority: live > prepared > earliest upcoming.
  const liveItem = schedule.find((i) => i.raceRound?.status === 'running') ?? null;
  const preparedItem = liveItem
    ? null
    : schedule.find((i) => i.raceRound?.status === 'prepared') ?? null;

  const upcoming = [...schedule]
    .filter((i) => !['completed', 'cancelled'].includes(i.raceRound?.status ?? ''))
    .sort((a, b) => {
      const ta = a.raceRound?.raceDate ? new Date(a.raceRound.raceDate).getTime() : Infinity;
      const tb = b.raceRound?.raceDate ? new Date(b.raceRound.raceDate).getTime() : Infinity;
      return ta - tb;
    });

  const nextRace = liveItem ?? preparedItem ?? upcoming[0] ?? null;

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
          <Text style={styles.headerTitle}>HOME</Text>
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
          <Text style={styles.welcomeSub}>WELCOME BACK,</Text>
          <Text style={styles.welcomeTitle}>
            {session?.user.fullName || session?.user.username || 'Jockey'}
          </Text>

          {/* ─── Stats Grid ─── */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statAccentRed]}>
                <Text style={styles.statLabel}>CONFIRMED RACES</Text>
                <Text style={[styles.statValue, { color: Palette.redLight }]}>
                  {isLoading ? '—' : confirmedCount}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>OFFICIAL ROLE</Text>
                <Text style={styles.statValue}>
                  {isLoading ? '—' : officialCount}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>BACKUP ROLE</Text>
                <Text style={[styles.statValue, { color: Palette.gold }]}>
                  {isLoading ? '—' : backupCount}
                </Text>
              </View>
              <View style={[styles.statCard, styles.statAccentGold]}>
                <Text style={styles.statLabel}>NEXT RACE</Text>
                <Text style={[styles.statValue, { color: Palette.gold, fontSize: 14 }]}>
                  {isLoading
                    ? '—'
                    : nextRace?.raceRound?.raceDate
                      ? formatShortDate(nextRace.raceRound.raceDate)
                      : 'None yet'}
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
              <Text style={styles.noRaceText}>No confirmed races on your schedule yet</Text>
              <Text style={styles.noRaceSubText}>
                Check the Invites tab for new race invitations
              </Text>
            </View>
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
                Make sure to arrive at the track at least 2 hours before the race
                for a health and equipment check.
              </Text>
            </View>
          )}

          {/* ─── All Races ─── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>All Races</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{allRacesTotal} RACES</Text>
            </View>
          </View>

          <View style={styles.filterBar}>
            {ALL_RACES_FILTERS.map(({ key, label, color }) => {
              const active = allRacesFilter === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.filterPill,
                    active && { borderColor: color, backgroundColor: `${color}1A` },
                  ]}
                  onPress={() => onAllRacesFilterChange(key)}>
                  <Text style={[styles.filterPillText, active && { color }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isLoadingAllRaces ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={Palette.red} />
            </View>
          ) : allRaces.length === 0 ? (
            <View style={styles.allRacesEmpty}>
              <Ionicons name="calendar-outline" size={32} color={Palette.textMuted} />
              <Text style={styles.noRaceSubText}>No races found</Text>
            </View>
          ) : (
            allRaces.map((item) => <AllRaceCard key={item._id} item={item} />)
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Palette.redLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9999',
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
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, color: Palette.textMuted },

  // All Races section
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

  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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

  allRacesEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
    marginBottom: 20,
  },

  // Race card (All Races section)
  raceCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  raceCardLive: { borderColor: '#5C1A1F' },
  raceCardPrepared: { borderColor: '#6B3A1A' },
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
  raceCardDivider: { height: 1, backgroundColor: Palette.cardBorder },
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

  bottomPad: { height: 20 },
});
