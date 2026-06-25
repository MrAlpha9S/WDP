import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getRaceSchedule,
  getTournamentsForPrediction,
  RaceScheduleItem,
  TournamentForPrediction,
} from '../api/spectatorApi';
import { PredictionTarget } from './PredictionModal';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  overlay: 'rgba(0,0,0,0.75)',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  gold: '#C9A24B',
  green: '#22C55E',
} as const;

type TabKey = 'race' | 'tournament';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (target: PredictionTarget) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function statusBadge(status: string): { label: string; color: string } {
  if (status === 'running' || status === 'ongoing') return { label: 'Đang diễn ra', color: Palette.red };
  if (status === 'scheduled') return { label: 'Sắp diễn ra', color: Palette.gold };
  return { label: status, color: Palette.textMuted };
}

export default function SelectPredictionTargetSheet({ visible, onClose, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('race');
  const [races, setRaces] = useState<RaceScheduleItem[]>([]);
  const [tournaments, setTournaments] = useState<TournamentForPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadData();
  }, [visible]);

  const loadData = async () => {
    setIsLoading(true);
    const [racesRes, tournamentsRes] = await Promise.all([
      getRaceSchedule('scheduled', 1, 20),
      getTournamentsForPrediction(),
    ]);
    // Include running races too
    const runningRes = await getRaceSchedule('running', 1, 5);
    setRaces([...runningRes.raceRounds, ...racesRes.raceRounds]);
    setTournaments(tournamentsRes);
    setIsLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>ĐẶT DỰ ĐOÁN MỚI</Text>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color={Palette.textMuted} />
              </Pressable>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
              {([
                { key: 'race' as TabKey, label: 'Cuộc đua', icon: 'flag-outline' },
                { key: 'tournament' as TabKey, label: 'Giải đấu', icon: 'ribbon-outline' },
              ] as const).map(({ key, label, icon }) => {
                const active = activeTab === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.tab, active && styles.tabActive]}
                    onPress={() => setActiveTab(key)}>
                    <Ionicons
                      name={icon as any}
                      size={14}
                      color={active ? Palette.gold : Palette.textMuted}
                    />
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Body */}
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>

              {activeTab === 'race' && (
                races.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="flag-outline" size={36} color={Palette.textMuted} />
                    <Text style={styles.emptyText}>Không có cuộc đua nào đang mở dự đoán</Text>
                  </View>
                ) : (
                  races.map(race => {
                    const { label, color } = statusBadge(race.status);
                    return (
                      <Pressable
                        key={race._id}
                        style={styles.itemCard}
                        onPress={() => {
                          onSelect({ type: 'race', raceRoundId: race._id, raceName: race.roundName });
                        }}>
                        <View style={styles.itemLeft}>
                          <View style={[styles.itemIcon, { backgroundColor: `${color}18` }]}>
                            <Ionicons name="flag-outline" size={16} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName} numberOfLines={1}>{race.roundName}</Text>
                            {race.tournament && (
                              <Text style={styles.itemSub} numberOfLines={1}>
                                {race.tournament.tournamentName}
                              </Text>
                            )}
                            <Text style={styles.itemDate}>{formatDate(race.raceDate)}</Text>
                          </View>
                        </View>
                        <View style={[styles.statusPill, { borderColor: `${color}44`, backgroundColor: `${color}18` }]}>
                          <Text style={[styles.statusPillText, { color }]}>{label}</Text>
                        </View>
                      </Pressable>
                    );
                  })
                )
              )}

              {activeTab === 'tournament' && (
                tournaments.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="ribbon-outline" size={36} color={Palette.textMuted} />
                    <Text style={styles.emptyText}>Không có giải đấu nào đang mở dự đoán nhà vô địch</Text>
                  </View>
                ) : (
                  tournaments.map(t => {
                    const { label, color } = statusBadge(t.status);
                    return (
                      <Pressable
                        key={t._id}
                        style={[styles.itemCard, t.alreadyPredicted && styles.itemCardDimmed]}
                        disabled={t.alreadyPredicted}
                        onPress={() => {
                          onSelect({
                            type: 'tournament',
                            tournamentId: t._id,
                            tournamentName: t.tournamentName,
                            horses: t.horses,
                          });
                        }}>
                        <View style={styles.itemLeft}>
                          <View style={[styles.itemIcon, { backgroundColor: `${color}18` }]}>
                            <Ionicons name="ribbon-outline" size={16} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName} numberOfLines={1}>{t.tournamentName}</Text>
                            <Text style={styles.itemSub}>
                              {t.horses.length} ngựa tham dự
                            </Text>
                            {t.prizePool != null && t.prizePool > 0 && (
                              <Text style={styles.itemDate}>
                                Giải thưởng: ${t.prizePool.toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>
                        {t.alreadyPredicted ? (
                          <View style={[styles.statusPill, { borderColor: Palette.green + '44', backgroundColor: Palette.green + '18' }]}>
                            <Ionicons name="checkmark" size={11} color={Palette.green} />
                            <Text style={[styles.statusPillText, { color: Palette.green }]}>Đã đoán</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusPill, { borderColor: `${color}44`, backgroundColor: `${color}18` }]}>
                            <Text style={[styles.statusPillText, { color }]}>{label}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })
                )
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: Palette.cardBorder,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.cardBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.gold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: { flexDirection: 'row', gap: 4, marginBottom: 0 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Palette.gold },
  tabText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  tabTextActive: { color: Palette.gold },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 13, color: Palette.textMuted, textAlign: 'center', lineHeight: 20 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 14,
  },
  itemCardDimmed: { opacity: 0.5 },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '700', color: Palette.text, marginBottom: 2 },
  itemSub: { fontSize: 12, color: Palette.textMuted, marginBottom: 2 },
  itemDate: { fontFamily: Fonts.mono, fontSize: 10, color: Palette.textMuted },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: { fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
