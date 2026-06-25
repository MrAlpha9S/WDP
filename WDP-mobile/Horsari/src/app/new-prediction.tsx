import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createPrediction,
  CreatePredictionBody,
  getAvailablePredictionMethods,
  getRaceDetail,
  getRaceSchedule,
  getTournamentsForPrediction,
  PredictionMethod,
  PredictionMethodType,
  RaceDetailRegistration,
  RaceScheduleItem,
  TournamentForPrediction,
} from '../api/spectatorApi';
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

type TargetType = 'race' | 'tournament';
type Step = 'pick-type' | 'pick-race' | 'pick-tournament' | 'configure';

interface RaceTarget { type: 'race'; item: RaceScheduleItem }
interface TournamentTarget { type: 'tournament'; item: TournamentForPrediction }
type Target = RaceTarget | TournamentTarget;

const METHOD_ICON: Record<PredictionMethodType, string> = {
  race_winner:          'trophy-outline',
  race_rank:            'podium-outline',
  tournament_champion:  'ribbon-outline',
};

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} Th${String(dt.getMonth() + 1).padStart(2, '0')}, ${dt.getFullYear()}`;
}

function statusStyle(s: string): { label: string; color: string } {
  if (s === 'running' || s === 'ongoing') return { label: 'Đang diễn ra', color: Palette.red };
  if (s === 'scheduled') return { label: 'Sắp diễn ra', color: Palette.gold };
  return { label: s, color: Palette.textMuted };
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

// ─── Horse chip ───────────────────────────────────────────────────────────────

function HorseChip({
  horse,
  lane,
  active,
  onPress,
}: {
  horse: string;
  lane?: number | null;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.horseChip, active && styles.horseChipActive]} onPress={onPress}>
      {lane != null && (
        <Text style={[styles.horseLane, active && { color: Palette.background }]}>#{lane}</Text>
      )}
      <Text style={[styles.horseName, active && { color: Palette.background }]} numberOfLines={1}>
        {horse}
      </Text>
      {active && <Ionicons name="checkmark" size={14} color={Palette.background} />}
    </Pressable>
  );
}

// ─── Method card ──────────────────────────────────────────────────────────────

function MethodCard({
  method,
  active,
  onPress,
}: {
  method: PredictionMethod;
  active: boolean;
  onPress: () => void;
}) {
  const icon = METHOD_ICON[method.methodType] ?? 'bulb-outline';
  return (
    <Pressable style={[styles.methodCard, active && styles.methodCardActive]} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={active ? Palette.gold : Palette.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.methodName, active && { color: Palette.gold }]}>{method.methodName}</Text>
        <Text style={styles.methodDesc} numberOfLines={2}>{method.methodDescription}</Text>
      </View>
      <Ionicons
        name={active ? 'radio-button-on' : 'radio-button-off'}
        size={18}
        color={active ? Palette.gold : Palette.cardBorder}
      />
    </Pressable>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NewPredictionScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('pick-type');
  const [activeType, setActiveType] = useState<TargetType>('race');
  const [target, setTarget] = useState<Target | null>(null);

  // list data
  const [races, setRaces] = useState<RaceScheduleItem[]>([]);
  const [tournaments, setTournaments] = useState<TournamentForPrediction[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);

  // configure step
  const [methods, setMethods] = useState<PredictionMethod[]>([]);
  const [registrations, setRegistrations] = useState<RaceDetailRegistration[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [predictedRank, setPredictedRank] = useState('');
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedMethod = methods.find(m => m._id === selectedMethodId) ?? null;

  // Load list when user picks a type tab
  useEffect(() => {
    if (step !== 'pick-type') return;
    loadList();
  }, [activeType]);

  const loadList = async () => {
    setIsListLoading(true);
    if (activeType === 'race') {
      const [running, scheduled] = await Promise.all([
        getRaceSchedule('running', 1, 5),
        getRaceSchedule('scheduled', 1, 20),
      ]);
      setRaces([...running.raceRounds, ...scheduled.raceRounds]);
    } else {
      const data = await getTournamentsForPrediction();
      setTournaments(data);
    }
    setIsListLoading(false);
  };

  const handleSelectRace = async (item: RaceScheduleItem) => {
    setTarget({ type: 'race', item });
    setSelectedMethodId(null);
    setSelectedHorseId(null);
    setSelectedRegId(null);
    setPredictedRank('');
    setSubmitError(null);
    setIsConfigLoading(true);
    setStep('configure');
    const [methodsRes, raceRes] = await Promise.all([
      getAvailablePredictionMethods(item._id),
      getRaceDetail(item._id),
    ]);
    setMethods(methodsRes.filter(m => m.methodType === 'race_winner' || m.methodType === 'race_rank'));
    setRegistrations(raceRes?.registrations ?? []);
    setIsConfigLoading(false);
  };

  const handleSelectTournament = async (item: TournamentForPrediction) => {
    setTarget({ type: 'tournament', item });
    setSelectedHorseId(null);
    setSubmitError(null);
    setIsConfigLoading(true);
    setStep('configure');
    const methodsRes = await getAvailablePredictionMethods();
    const champion = methodsRes.find(m => m.methodType === 'tournament_champion');
    setMethods(champion ? [champion] : []);
    if (champion) setSelectedMethodId(champion._id);
    setIsConfigLoading(false);
  };

  const handleSelectHorse = (horseId: string) => {
    setSelectedHorseId(horseId);
    if (target?.type === 'race') {
      const reg = registrations.find(r => r.horse?._id === horseId);
      setSelectedRegId(reg?._id ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!target || !selectedMethod || !selectedMethodId) return;
    setSubmitError(null);
    setIsSubmitting(true);

    let body: CreatePredictionBody | null = null;

    if (selectedMethod.methodType === 'tournament_champion') {
      if (!selectedHorseId) { setSubmitError('Vui lòng chọn một con ngựa.'); setIsSubmitting(false); return; }
      body = {
        predictionMethodId: selectedMethodId,
        tournamentId: (target.item as TournamentForPrediction)._id,
        predictedHorseId: selectedHorseId,
      };
    } else if (selectedMethod.methodType === 'race_winner') {
      if (!selectedRegId) { setSubmitError('Vui lòng chọn một con ngựa.'); setIsSubmitting(false); return; }
      body = { predictionMethodId: selectedMethodId, registrationId: selectedRegId };
    } else if (selectedMethod.methodType === 'race_rank') {
      const rank = parseInt(predictedRank, 10);
      if (!selectedRegId) { setSubmitError('Vui lòng chọn một con ngựa.'); setIsSubmitting(false); return; }
      if (!rank || rank < 1) { setSubmitError('Vui lòng nhập thứ hạng hợp lệ (≥ 1).'); setIsSubmitting(false); return; }
      body = { predictionMethodId: selectedMethodId, registrationId: selectedRegId, predictedRank: rank };
    }

    if (!body) { setIsSubmitting(false); return; }

    const result = await createPrediction(body);
    setIsSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => router.back(), 1400);
    } else {
      setSubmitError(result.message);
    }
  };

  const horses =
    target?.type === 'race'
      ? registrations.filter(r => r.horse).map(r => ({ _id: r.horse!._id, horseName: r.horse!.horseName, laneNumber: r.laneNumber }))
      : (target?.item as TournamentForPrediction | undefined)?.horses ?? [];

  // ─── Header ──────────────────────────────────────────────────────────────────

  const stepTitle =
    step === 'pick-type' ? 'ĐẶT DỰ ĐOÁN MỚI' :
    step === 'configure' ? 'CẤU HÌNH DỰ ĐOÁN' : 'ĐẶT DỰ ĐOÁN MỚI';

  const handleBack = () => {
    if (step === 'configure') { setStep('pick-type'); setTarget(null); }
    else router.back();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={Palette.text} />
          </Pressable>
          <Text style={styles.topTitle}>{stepTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Step: pick-type ── */}
        {step === 'pick-type' && (
          <>
            {/* Type tabs */}
            <View style={styles.typeTabs}>
              {([
                { key: 'race' as TargetType, label: 'Cuộc đua', icon: 'flag-outline' },
                { key: 'tournament' as TargetType, label: 'Giải đấu', icon: 'ribbon-outline' },
              ] as const).map(({ key, label, icon }) => {
                const active = activeType === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.typeTab, active && styles.typeTabActive]}
                    onPress={() => { setActiveType(key); }}>
                    <Ionicons name={icon as any} size={16} color={active ? Palette.gold : Palette.textMuted} />
                    <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {isListLoading ? (
              <View style={styles.center}><ActivityIndicator color={Palette.gold} size="large" /></View>
            ) : (
              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {activeType === 'race' && (
                  races.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="flag-outline" size={40} color={Palette.textMuted} />
                      <Text style={styles.emptyText}>Không có cuộc đua nào đang mở dự đoán</Text>
                    </View>
                  ) : races.map(race => {
                    const { label, color } = statusStyle(race.status);
                    return (
                      <Pressable key={race._id} style={styles.listCard} onPress={() => handleSelectRace(race)}>
                        <View style={[styles.listCardIcon, { backgroundColor: `${color}18` }]}>
                          <Ionicons name="flag-outline" size={18} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listCardTitle} numberOfLines={1}>{race.roundName}</Text>
                          {race.tournament && (
                            <Text style={styles.listCardSub} numberOfLines={1}>{race.tournament.tournamentName}</Text>
                          )}
                          <Text style={styles.listCardMeta}>{formatDate(race.raceDate)}</Text>
                        </View>
                        <View style={[styles.statusPill, { borderColor: `${color}44`, backgroundColor: `${color}18` }]}>
                          <Text style={[styles.statusPillText, { color }]}>{label}</Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}

                {activeType === 'tournament' && (
                  tournaments.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="ribbon-outline" size={40} color={Palette.textMuted} />
                      <Text style={styles.emptyText}>Không có giải đấu nào đang mở dự đoán nhà vô địch</Text>
                    </View>
                  ) : tournaments.map(t => {
                    const { label, color } = statusStyle(t.status);
                    return (
                      <Pressable
                        key={t._id}
                        style={[styles.listCard, t.alreadyPredicted && styles.listCardDimmed]}
                        disabled={t.alreadyPredicted}
                        onPress={() => handleSelectTournament(t)}>
                        <View style={[styles.listCardIcon, { backgroundColor: `${color}18` }]}>
                          <Ionicons name="ribbon-outline" size={18} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listCardTitle} numberOfLines={1}>{t.tournamentName}</Text>
                          <Text style={styles.listCardSub}>{t.horses.length} ngựa tham dự</Text>
                          {t.prizePool != null && t.prizePool > 0 && (
                            <Text style={styles.listCardMeta}>Giải thưởng: ${t.prizePool.toLocaleString()}</Text>
                          )}
                        </View>
                        {t.alreadyPredicted ? (
                          <View style={[styles.statusPill, { borderColor: Palette.green + '44', backgroundColor: Palette.green + '18' }]}>
                            <Ionicons name="checkmark" size={10} color={Palette.green} />
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
                )}
                <View style={{ height: 32 }} />
              </ScrollView>
            )}
          </>
        )}

        {/* ── Step: configure ── */}
        {step === 'configure' && (
          isConfigLoading ? (
            <View style={styles.center}><ActivityIndicator color={Palette.gold} size="large" /></View>
          ) : success ? (
            <View style={styles.center}>
              <Ionicons name="checkmark-circle" size={64} color={Palette.green} />
              <Text style={styles.successTitle}>Đặt dự đoán thành công!</Text>
              <Text style={styles.successSub}>Đang quay lại...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.configScroll}
              contentContainerStyle={styles.configContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* Target info banner */}
              <View style={styles.targetBanner}>
                <Ionicons
                  name={target?.type === 'tournament' ? 'ribbon-outline' : 'flag-outline'}
                  size={16}
                  color={Palette.gold}
                />
                <Text style={styles.targetBannerText} numberOfLines={1}>
                  {target?.type === 'tournament'
                    ? (target.item as TournamentForPrediction).tournamentName
                    : (target?.item as RaceScheduleItem).roundName}
                </Text>
              </View>

              {/* Method picker — race only (tournament auto-selects champion) */}
              {target?.type === 'race' && (
                <View style={styles.section}>
                  <SectionLabel text="PHƯƠNG THỨC DỰ ĐOÁN" />
                  {methods.length === 0 ? (
                    <View style={styles.inlineEmpty}>
                      <Ionicons name="bulb-outline" size={20} color={Palette.textMuted} />
                      <Text style={styles.inlineEmptyText}>Không có phương thức dự đoán nào khả dụng</Text>
                    </View>
                  ) : (
                    <View style={styles.methodList}>
                      {methods.map(m => (
                        <MethodCard
                          key={m._id}
                          method={m}
                          active={selectedMethodId === m._id}
                          onPress={() => {
                            setSelectedMethodId(m._id);
                            setSelectedHorseId(null);
                            setSelectedRegId(null);
                            setPredictedRank('');
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Horse picker — always show once method selected */}
              {(selectedMethodId || target?.type === 'tournament') && (
                <View style={styles.section}>
                  <SectionLabel text={target?.type === 'tournament' ? 'CHỌN NGỰA VÔ ĐỊCH' : 'CHỌN NGỰA'} />
                  {horses.length === 0 ? (
                    <View style={styles.inlineEmpty}>
                      <Ionicons name="horse" size={20} color={Palette.textMuted} />
                      <Text style={styles.inlineEmptyText}>
                        {target?.type === 'race'
                          ? 'Chưa có ngựa đăng ký cho cuộc đua này'
                          : 'Chưa có ngựa nào trong giải đấu này'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.horseGrid}>
                      {horses.map(h => (
                        <HorseChip
                          key={h._id}
                          horse={h.horseName}
                          lane={(h as any).laneNumber}
                          active={selectedHorseId === h._id}
                          onPress={() => handleSelectHorse(h._id)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Rank input — race_rank only, after horse selected */}
              {selectedMethod?.methodType === 'race_rank' && selectedHorseId && (
                <View style={styles.section}>
                  <SectionLabel text="THỨ HẠNG DỰ ĐOÁN" />
                  <View style={styles.rankRow}>
                    <Text style={styles.rankLabel}>Hạng</Text>
                    <TextInput
                      style={styles.rankInput}
                      value={predictedRank}
                      onChangeText={setPredictedRank}
                      keyboardType="number-pad"
                      placeholder="?"
                      placeholderTextColor={Palette.textMuted}
                      maxLength={2}
                    />
                  </View>
                </View>
              )}

              {/* Error */}
              {submitError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Palette.red} />
                  <Text style={styles.errorText}>{submitError}</Text>
                </View>
              )}
            </ScrollView>
          )
        )}

        {/* Submit bar — fixed at bottom */}
        {step === 'configure' && !isConfigLoading && !success && (
          <SafeAreaView edges={['bottom']} style={styles.submitBar}>
            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting
                ? <ActivityIndicator color={Palette.background} size="small" />
                : <Text style={styles.submitBtnText}>ĐẶT DỰ ĐOÁN</Text>
              }
            </Pressable>
          </SafeAreaView>
        )}

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.gold,
  },

  // type tabs
  typeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  typeTabActive: { borderBottomColor: Palette.gold },
  typeTabText: { fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', color: Palette.textMuted, letterSpacing: 0.5 },
  typeTabTextActive: { color: Palette.gold },

  // list
  listContent: { padding: 16, gap: 10 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 14,
  },
  listCardDimmed: { opacity: 0.45 },
  listCardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listCardTitle: { fontSize: 14, fontWeight: '700', color: Palette.text, marginBottom: 2 },
  listCardSub: { fontSize: 12, color: Palette.textMuted, marginBottom: 2 },
  listCardMeta: { fontFamily: Fonts.mono, fontSize: 10, color: Palette.textMuted },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: { fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 13, color: Palette.textMuted, textAlign: 'center', lineHeight: 20 },

  // configure
  configScroll: { flex: 1 },
  configContent: { padding: 20, gap: 28, paddingBottom: 100 },
  inlineEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 14,
  },
  inlineEmptyText: { flex: 1, fontSize: 13, color: Palette.textMuted },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1608',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.gold + '44',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  targetBannerText: { flex: 1, fontSize: 14, fontWeight: '600', color: Palette.gold },

  section: { gap: 12 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Palette.textMuted },

  methodList: { gap: 8 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  methodCardActive: { borderColor: Palette.gold, backgroundColor: '#1A1608' },
  methodName: { fontSize: 14, fontWeight: '700', color: Palette.text, marginBottom: 3 },
  methodDesc: { fontSize: 12, color: Palette.textMuted, lineHeight: 17 },

  horseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  horseChipActive: { backgroundColor: Palette.gold, borderColor: Palette.gold },
  horseLane: { fontFamily: Fonts.mono, fontSize: 10, fontWeight: '700', color: Palette.textMuted },
  horseName: { fontSize: 13, fontWeight: '600', color: Palette.text },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rankLabel: { fontSize: 15, fontWeight: '600', color: Palette.textMuted },
  rankInput: { fontSize: 32, fontWeight: '800', color: Palette.gold, minWidth: 48, fontFamily: Fonts.mono },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A0608',
    borderWidth: 1,
    borderColor: '#3A1218',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: Palette.red, lineHeight: 18 },

  successTitle: { fontSize: 20, fontWeight: '800', color: Palette.green },
  successSub: { fontSize: 13, color: Palette.textMuted },

  submitBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorder,
    backgroundColor: Palette.background,
  },
  submitBtn: {
    backgroundColor: Palette.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: Fonts.mono, fontSize: 14, fontWeight: '800', letterSpacing: 1.5, color: Palette.background },
});
