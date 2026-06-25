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
  getHomeFeed,
  HomeFeed,
  HomeFeedHorse,
  HomeFeedUpcomingRace,
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
  goldDark: '#1E1A0A',
  green: '#22C55E',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViDate(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} • ${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

// ─── Live Race Card ───────────────────────────────────────────────────────────

function LiveRaceCard({ liveRace }: { liveRace: NonNullable<HomeFeed['liveRace']> }) {
  return (
    <View style={styles.liveCard}>
      <LinearGradient
        colors={['#3A0A10', '#1C1015', '#0E0A12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.liveGradient}>

        {/* Live badge */}
        <View style={styles.liveBadgeRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>TRỰC TIẾP</Text>
          </View>
          {liveRace.tournament && (
            <Text style={styles.liveTournament} numberOfLines={1}>
              {liveRace.tournament.tournamentName}
            </Text>
          )}
        </View>

        {/* Race name */}
        <Text style={styles.liveRaceName} numberOfLines={2}>
          {liveRace.roundName}
        </Text>

        {/* Location */}
        <View style={styles.liveLocationRow}>
          <Ionicons name="location-outline" size={13} color={Palette.textMuted} />
          <Text style={styles.liveLocationText} numberOfLines={1}>
            {liveRace.location}
          </Text>
        </View>

        {/* Participants */}
        {liveRace.registrations.length > 0 && (
          <View style={styles.liveParticipantsRow}>
            {liveRace.registrations.slice(0, 3).map((reg, i) => (
              <View key={reg._id} style={[styles.liveParticipantChip, i > 0 && { marginLeft: -6 }]}>
                <Ionicons name="ribbon-outline" size={12} color={Palette.redLight} />
              </View>
            ))}
            <Text style={styles.liveParticipantsText}>
              {liveRace.registrations.length} ngựa đang thi đấu
            </Text>
          </View>
        )}

        {/* Watch button */}
        {liveRace.livestreamUrl ? (
          <Pressable style={styles.liveWatchBtn}>
            <Ionicons name="play-circle-outline" size={16} color={Palette.text} />
            <Text style={styles.liveWatchText}>XEM TRỰC TIẾP</Text>
          </Pressable>
        ) : (
          <View style={styles.liveNoStream}>
            <Ionicons name="eye-outline" size={14} color={Palette.textMuted} />
            <Text style={styles.liveNoStreamText}>Chưa có luồng phát sóng</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ─── Upcoming Race Card ───────────────────────────────────────────────────────

function UpcomingCard({ race }: { race: HomeFeedUpcomingRace }) {
  return (
    <View style={styles.upcomingCard}>
      <View style={styles.upcomingAccent} />
      <View style={styles.upcomingBody}>
        <View style={styles.upcomingTop}>
          <Text style={styles.upcomingName} numberOfLines={2}>
            {race.roundName}
          </Text>
          {race.tournament?.prizePool != null && race.tournament.prizePool > 0 && (
            <View style={styles.prizeChip}>
              <Text style={styles.prizeChipText}>
                ${race.tournament.prizePool.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        {race.tournament && (
          <Text style={styles.upcomingTournament} numberOfLines={1}>
            {race.tournament.tournamentName}
          </Text>
        )}
        <View style={styles.upcomingMeta}>
          <View style={styles.upcomingMetaItem}>
            <Ionicons name="calendar-outline" size={12} color={Palette.gold} />
            <Text style={styles.upcomingMetaText}>{formatShortDate(race.raceDate)}</Text>
          </View>
          <View style={styles.upcomingMetaItem}>
            <Ionicons name="location-outline" size={12} color={Palette.textMuted} />
            <Text style={styles.upcomingMetaText} numberOfLines={1}>{race.location}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Featured Horse Card ──────────────────────────────────────────────────────

function HorseCard({ horse }: { horse: HomeFeedHorse }) {
  return (
    <View style={styles.horseCard}>
      <View style={styles.horseIconBg}>
        <Ionicons name="ribbon-outline" size={28} color={Palette.gold} />
      </View>
      <Text style={styles.horseName} numberOfLines={2}>{horse.horseName}</Text>
      <View style={styles.horseWinRow}>
        <Text style={styles.horseWinRate}>{horse.winRate.toFixed(0)}%</Text>
        <Text style={styles.horseWinLabel}>thắng</Text>
      </View>
      <Text style={styles.horseRaces}>{horse.totalRaces} trận</Text>
      {horse.healthStatus && (
        <View style={[
          styles.horseHealthChip,
          horse.healthStatus === 'healthy' && styles.horseHealthGood,
        ]}>
          <Text style={[
            styles.horseHealthText,
            horse.healthStatus === 'healthy' && { color: Palette.green },
          ]}>
            {horse.healthStatus === 'healthy' ? 'Khoẻ mạnh' : horse.healthStatus}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SpectatorHomeScreen() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    const data = await getHomeFeed();
    if (!data) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } else {
      setFeed(data);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    load(true);
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
          <Text style={styles.headerTitle}>TRANG CHỦ</Text>
          {feed?.spectator != null && (
            <View style={styles.pointsBadge}>
              <Ionicons name="star-outline" size={12} color={Palette.gold} />
              <Text style={styles.pointsBadgeText}>
                {feed.spectator.wallet.toLocaleString()} điểm
              </Text>
            </View>
          )}
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
            <Pressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>THỬ LẠI</Text>
            </Pressable>
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

            {/* Welcome */}
            <Text style={styles.welcomeSub}>CHÀO MỪNG TRỞ LẠI,</Text>
            <Text style={styles.welcomeTitle}>Đường Đua Hôm Nay</Text>

            {/* ─── Live Race ─── */}
            {feed?.liveRace ? (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccentRed} />
                  <Text style={styles.sectionTitle}>Đang Diễn Ra</Text>
                </View>
                <LiveRaceCard liveRace={feed.liveRace} />
              </>
            ) : (
              <View style={styles.noLiveCard}>
                <Ionicons name="radio-outline" size={22} color={Palette.textMuted} />
                <Text style={styles.noLiveText}>Hiện không có cuộc đua nào đang diễn ra</Text>
              </View>
            )}

            {/* ─── Upcoming Races ─── */}
            {(feed?.upcomingRaces ?? []).length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccentGold} />
                  <Text style={styles.sectionTitle}>Sắp Diễn Ra</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{feed!.upcomingRaces.length}</Text>
                  </View>
                </View>
                {feed!.upcomingRaces.map((race) => (
                  <UpcomingCard key={race._id} race={race} />
                ))}
              </>
            )}

            {/* ─── Featured Horses ─── */}
            {(feed?.featuredHorses ?? []).length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccentGold} />
                  <Text style={styles.sectionTitle}>Ngựa Nổi Bật</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horsesRow}>
                  {feed!.featuredHorses.map((horse) => (
                    <HorseCard key={horse._id} horse={horse} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Empty state when no content */}
            {!feed?.liveRace &&
              (feed?.upcomingRaces ?? []).length === 0 &&
              (feed?.featuredHorses ?? []).length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color={Palette.textMuted} />
                  <Text style={styles.emptyText}>Chưa có dữ liệu cuộc đua</Text>
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.goldDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3010',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pointsBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.gold,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  welcomeSub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Palette.gold,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionAccentRed: { width: 4, height: 20, borderRadius: 2, backgroundColor: Palette.red },
  sectionAccentGold: { width: 4, height: 20, borderRadius: 2, backgroundColor: Palette.gold },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Palette.text },
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

  // Live race card
  liveCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#5C1A1F',
    marginBottom: 24,
  },
  liveGradient: { padding: 20, gap: 12 },
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.red,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9999',
  },
  liveBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.text,
  },
  liveTournament: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    letterSpacing: 0.3,
  },
  liveRaceName: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  liveLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveLocationText: { fontSize: 13, color: Palette.textMuted, flex: 1 },
  liveParticipantsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveParticipantChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A1215',
    borderWidth: 2,
    borderColor: '#3A1A1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveParticipantsText: { fontSize: 12, color: Palette.textMuted },
  liveWatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.red,
    borderRadius: 10,
    height: 44,
    marginTop: 4,
  },
  liveWatchText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.text,
  },
  liveNoStream: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginTop: 4,
  },
  liveNoStreamText: { fontSize: 12, color: Palette.textMuted },

  // No live state
  noLiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  noLiveText: { fontSize: 13, color: Palette.textMuted },

  // Upcoming race card
  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 12,
    overflow: 'hidden',
  },
  upcomingAccent: {
    width: 3,
    backgroundColor: Palette.gold,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  upcomingBody: { flex: 1, padding: 14, gap: 6 },
  upcomingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  upcomingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
    lineHeight: 20,
  },
  prizeChip: {
    backgroundColor: Palette.goldDark,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3010',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  prizeChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.gold,
  },
  upcomingTournament: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    letterSpacing: 0.3,
  },
  upcomingMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginTop: 2 },
  upcomingMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upcomingMetaText: { fontSize: 12, color: Palette.textMuted },

  // Horse card
  horsesRow: { gap: 12, paddingRight: 4, paddingBottom: 4, marginBottom: 20 },
  horseCard: {
    width: 130,
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  horseIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.goldDark,
    borderWidth: 1,
    borderColor: '#3A3010',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  horseName: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
    lineHeight: 17,
  },
  horseWinRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  horseWinRate: {
    fontFamily: Fonts.mono,
    fontSize: 20,
    fontWeight: '800',
    color: Palette.gold,
  },
  horseWinLabel: { fontSize: 11, color: Palette.textMuted },
  horseRaces: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    letterSpacing: 0.3,
  },
  horseHealthChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#1E1E22',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  horseHealthGood: {
    backgroundColor: '#0A2010',
    borderColor: '#1A4020',
  },
  horseHealthText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
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
