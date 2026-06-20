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

import { getMyRaceSchedule, ScheduleItem } from '../../api/jockeyApi';
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatDateLabel(d: Date): string {
  return `${d.getDate()} THÁNG ${d.getMonth() + 1}`;
}

function buildDateLabel(d: Date): string {
  const today = dayStart(new Date());
  const ds = dayStart(d);
  if (ds === today) return `HÔM NAY, ${formatDateLabel(d)}`;
  if (ds === today + 86_400_000) return `NGÀY MAI, ${formatDateLabel(d)}`;
  return `${formatDateLabel(d)}, ${d.getFullYear()}`;
}

function parseTime(dateStr: string): { time: string; period: 'AM' | 'PM' } {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  return {
    time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    period: h >= 12 ? 'PM' : 'AM',
  };
}

interface DateGroup {
  label: string;
  sortKey: number;
  items: ScheduleItem[];
}

function groupByDate(items: ScheduleItem[]): DateGroup[] {
  const map = new Map<number, DateGroup>();

  for (const item of items) {
    if (!item.raceRound?.raceDate) continue;
    const d = new Date(item.raceRound.raceDate);
    const key = dayStart(d);
    if (!map.has(key)) {
      map.set(key, { label: buildDateLabel(d), sortKey: key, items: [] });
    }
    map.get(key)!.items.push(item);
  }

  return Array.from(map.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) =>
          new Date(a.raceRound!.raceDate).getTime() -
          new Date(b.raceRound!.raceDate).getTime()
      ),
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await getMyRaceSchedule();
      setGroups(groupByDate(data));
    } catch {
      setError('Không thể tải lịch đua. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
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
          <Text style={styles.headerTitle}>LỊCH TRÌNH ĐUA</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        {/* ─── Body ─── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.red} size="large" />
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
            contentContainerStyle={[styles.scroll, groups.length === 0 && styles.scrollEmpty]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={Palette.red}
              />
            }>

            {/* ─── Section header ─── */}
            {groups.length > 0 && (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>Lịch thi đấu</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {groups.reduce((s, g) => s + g.items.length, 0)} TRẬN
                  </Text>
                </View>
              </View>
            )}

            {/* ─── Race groups ─── */}
            {groups.map((group) => (
              <View key={group.sortKey}>
                <View style={styles.dateChip}>
                  <Text style={styles.dateChipText}>{group.label}</Text>
                </View>

                {group.items.map((item) => {
                  const { time, period } = parseTime(item.raceRound!.raceDate);
                  const title =
                    item.tournament?.tournamentName ??
                    item.raceRound?.roundName ??
                    'Vòng đua';
                  const location = item.raceRound?.location ?? '—';
                  const horse = item.horse?.horseName ?? '—';

                  return (
                    <View key={item.invitationId} style={styles.raceCard}>
                      <View style={styles.raceTimeCol}>
                        <Text style={styles.raceTime}>{time}</Text>
                        <Text style={styles.racePeriod}>{period}</Text>
                      </View>
                      <View style={styles.raceInfo}>
                        <Text style={styles.raceTitle} numberOfLines={1}>{title}</Text>
                        <View style={styles.raceLocationRow}>
                          <Ionicons name="location-outline" size={12} color={Palette.textMuted} />
                          <Text style={styles.raceLocation} numberOfLines={1}>
                            {location}
                          </Text>
                        </View>
                        <View style={styles.raceTags}>
                          <View style={styles.tagHorse}>
                            <Text style={styles.tagHorseText} numberOfLines={1}>
                              {horse.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.tagConfirmed}>
                            <Text style={styles.tagConfirmedText}>ĐÃ XÁC NHẬN</Text>
                          </View>
                          {item.isBackup && (
                            <View style={styles.tagBackup}>
                              <Text style={styles.tagBackupText}>DỰ PHÒNG</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* ─── Empty state ─── */}
            {groups.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={40} color={Palette.textMuted} />
                <Text style={styles.emptyText}>Chưa có lịch đua nào</Text>
              </View>
            )}

            {/* ─── Info notice ─── */}
            {groups.length > 0 && (
              <View style={styles.infoNotice}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={Palette.redLight}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  Hãy đảm bảo bạn có mặt tại trường đua ít nhất 2 tiếng trước khi bắt đầu để kiểm tra
                  sức khỏe và thiết bị.
                </Text>
              </View>
            )}

            <View style={styles.bottomPad} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

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
    color: Palette.red,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  scrollEmpty: { flexGrow: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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

  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  dateChipText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },

  raceCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: Palette.red,
    padding: 16,
    gap: 16,
    marginBottom: 12,
  },
  raceTimeCol: { alignItems: 'center', minWidth: 52 },
  raceTime: {
    fontFamily: Fonts.mono,
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  racePeriod: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    letterSpacing: 0.5,
  },
  raceInfo: { flex: 1, gap: 6 },
  raceTitle: { fontSize: 15, fontWeight: '700', color: Palette.text },
  raceLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  raceLocation: { fontSize: 12, color: Palette.textMuted, flex: 1 },

  raceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagHorse: {
    backgroundColor: '#2A2020',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 160,
  },
  tagHorseText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.redLight,
  },
  tagConfirmed: {
    backgroundColor: '#1A2A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A4A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagConfirmedText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#6CBA7A',
  },
  tagBackup: {
    backgroundColor: '#1A1A2A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagBackupText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#8888CC',
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

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: '#1A1214',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A1A1C',
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  infoIcon: { marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, color: Palette.textMuted },

  bottomPad: { height: 20 },
});
