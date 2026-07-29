import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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
import { isNetworkError } from '../api/axios';
import { Fonts, Palette } from '@/constants/theme';
import { NoConnectionState } from '@/components/NoConnectionState';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

type TargetType = 'race' | 'tournament';
type Step = 'pick-type' | 'pick-race' | 'pick-tournament' | 'configure';

interface RaceTarget { type: 'race'; item: RaceScheduleItem }
interface TournamentTarget { type: 'tournament'; item: TournamentForPrediction }
type Target = RaceTarget | TournamentTarget;

const isRealTournament = (t: { tournamentName: string } | null | undefined): boolean =>
  !!t && t.tournamentName !== 'Non-tournament';

const METHOD_ICON: Record<PredictionMethodType, string> = {
  race_winner:          'trophy-outline',
  race_rank:            'podium-outline',
  tournament_champion:  'ribbon-outline',
};

function formatDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} Th${String(dt.getMonth() + 1).padStart(2, '0')}, ${dt.getFullYear()}`;
}

function statusStyle(s: string): { label: string; tone: BadgeTone } {
  if (s === 'running' || s === 'ongoing') return { label: 'Live', tone: 'red' };
  if (s === 'scheduled') return { label: 'Upcoming', tone: 'gold' };
  return { label: s, tone: 'muted' };
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
  const [listError, setListError] = useState(false);

  // configure step
  const [methods, setMethods] = useState<PredictionMethod[]>([]);
  const [registrations, setRegistrations] = useState<RaceDetailRegistration[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [predictedRank, setPredictedRank] = useState('');
  const [stakeInput, setStakeInput] = useState('');
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingBody, setPendingBody] = useState<CreatePredictionBody | null>(null);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the post-success navigation timer if the screen unmounts before it fires.
  useEffect(() => {
    return () => {
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    };
  }, []);

  const selectedMethod = methods.find(m => m._id === selectedMethodId) ?? null;

  // Load list when user picks a type tab
  useEffect(() => {
    if (step !== 'pick-type') return;
    loadList();
  }, [activeType]);

  const loadList = async () => {
    setIsListLoading(true);
    setListError(false);
    try {
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
    } catch (err) {
      if (isNetworkError(err)) setListError(true);
    }
    setIsListLoading(false);
  };

  const handleSelectRace = async (item: RaceScheduleItem) => {
    setTarget({ type: 'race', item });
    setSelectedMethodId(null);
    setSelectedHorseId(null);
    setSelectedRegId(null);
    setPredictedRank('');
    setStakeInput('');
    setSubmitError(null);
    setIsConfigLoading(true);
    setConfigError(false);
    setStep('configure');
    try {
      const [methodsRes, raceRes] = await Promise.all([
        getAvailablePredictionMethods(item._id),
        getRaceDetail(item._id),
      ]);
      setMethods(methodsRes.filter(m => m.methodType === 'race_winner' || m.methodType === 'race_rank'));
      setRegistrations(raceRes?.registrations ?? []);
    } catch (err) {
      if (isNetworkError(err)) setConfigError(true);
    }
    setIsConfigLoading(false);
  };

  const handleSelectTournament = async (item: TournamentForPrediction) => {
    setTarget({ type: 'tournament', item });
    setSelectedHorseId(null);
    setStakeInput('');
    setSubmitError(null);
    setIsConfigLoading(true);
    setConfigError(false);
    setStep('configure');
    try {
      const methodsRes = await getAvailablePredictionMethods();
      const champion = methodsRes.find(m => m.methodType === 'tournament_champion');
      setMethods(champion ? [champion] : []);
      if (champion) setSelectedMethodId(champion._id);
    } catch (err) {
      if (isNetworkError(err)) setConfigError(true);
    }
    setIsConfigLoading(false);
  };

  const handleSelectHorse = (horseId: string) => {
    setSelectedHorseId(horseId);
    if (target?.type === 'race') {
      const reg = registrations.find(r => r.horse?._id === horseId);
      setSelectedRegId(reg?._id ?? null);
    }
  };

  // Validates the current selection and builds the request body, without submitting.
  // Used to gate opening the confirmation sheet — the actual API call only happens
  // from handleConfirm, once the user has reviewed the stake and target.
  const buildBody = (): CreatePredictionBody | null => {
    if (!target || !selectedMethod || !selectedMethodId) return null;
    setSubmitError(null);

    const rewardPoints = parseInt(stakeInput, 10);
    if (!rewardPoints || rewardPoints <= 0) {
      setSubmitError('Please enter a valid stake amount (> 0).');
      return null;
    }

    if (selectedMethod.methodType === 'tournament_champion') {
      if (!selectedHorseId) { setSubmitError('Please select a horse.'); return null; }
      return {
        predictionMethodId: selectedMethodId,
        tournamentId: (target.item as TournamentForPrediction)._id,
        predictedHorseId: selectedHorseId,
        rewardPoints,
      };
    }
    if (selectedMethod.methodType === 'race_winner') {
      if (!selectedRegId) { setSubmitError('Please select a horse.'); return null; }
      return { predictionMethodId: selectedMethodId, registrationId: selectedRegId, rewardPoints };
    }
    if (selectedMethod.methodType === 'race_rank') {
      const rank = parseInt(predictedRank, 10);
      if (!selectedRegId) { setSubmitError('Please select a horse.'); return null; }
      if (!rank || rank < 1) { setSubmitError('Please enter a valid rank (≥ 1).'); return null; }
      return { predictionMethodId: selectedMethodId, registrationId: selectedRegId, predictedRank: rank, rewardPoints };
    }
    return null;
  };

  const handleReview = () => {
    const body = buildBody();
    if (body) {
      setPendingBody(body);
      setConfirmVisible(true);
    }
  };

  const handleConfirm = async () => {
    if (!pendingBody) return;
    setIsSubmitting(true);
    const result = await createPrediction(pendingBody);
    setIsSubmitting(false);
    setConfirmVisible(false);

    if (result.ok) {
      setSuccess(true);
      backTimerRef.current = setTimeout(() => router.back(), 1400);
    } else {
      setSubmitError(result.message);
    }
  };

  const horses =
    target?.type === 'race'
      ? registrations.filter(r => r.horse).map(r => ({ _id: r.horse!._id, horseName: r.horse!.horseName, laneNumber: r.laneNumber }))
      : (target?.item as TournamentForPrediction | undefined)?.horses ?? [];

  const selectedHorseName = horses.find(h => h._id === selectedHorseId)?.horseName ?? null;
  const targetName =
    target?.type === 'tournament'
      ? (target.item as TournamentForPrediction).tournamentName
      : (target?.item as RaceScheduleItem | undefined)?.roundName ?? null;

  // ─── Header ──────────────────────────────────────────────────────────────────

  const stepTitle =
    step === 'pick-type' ? 'NEW PREDICTION' :
    step === 'configure' ? 'CONFIGURE PREDICTION' : 'NEW PREDICTION';

  const handleBack = () => {
    if (step === 'configure') { setStep('pick-type'); setTarget(null); setStakeInput(''); }
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
                { key: 'race' as TargetType, label: 'Race', icon: 'flag-outline' },
                { key: 'tournament' as TargetType, label: 'Tournament', icon: 'ribbon-outline' },
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
            ) : listError ? (
              <NoConnectionState
                onRetry={loadList}
                accentColor={Palette.gold}
                mutedColor={Palette.textMuted}
              />
            ) : (
              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {activeType === 'race' && (
                  races.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="flag-outline" size={40} color={Palette.textMuted} />
                      <Text style={styles.emptyText}>No races are currently open for predictions</Text>
                    </View>
                  ) : races.map(race => {
                    const { label, tone } = statusStyle(race.status);
                    const iconColor = tone === 'red' ? Palette.red : tone === 'gold' ? Palette.gold : Palette.textMuted;
                    return (
                      <Pressable key={race._id} style={styles.listCard} onPress={() => handleSelectRace(race)}>
                        <View style={[styles.listCardIcon, { backgroundColor: `${iconColor}18` }]}>
                          <Ionicons name="flag-outline" size={18} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listCardTitle} numberOfLines={1}>{race.roundName}</Text>
                          {isRealTournament(race.tournament) && (
                            <Text style={styles.listCardSub} numberOfLines={1}>{race.tournament!.tournamentName}</Text>
                          )}
                          <Text style={styles.listCardMeta}>{formatDate(race.raceDate)}</Text>
                        </View>
                        <Badge label={label} tone={tone} />
                      </Pressable>
                    );
                  })
                )}

                {activeType === 'tournament' && (
                  tournaments.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="ribbon-outline" size={40} color={Palette.textMuted} />
                      <Text style={styles.emptyText}>No tournaments are currently open for champion predictions</Text>
                    </View>
                  ) : tournaments.map(t => {
                    const { label, tone } = statusStyle(t.status);
                    const iconColor = tone === 'red' ? Palette.red : tone === 'gold' ? Palette.gold : Palette.textMuted;
                    return (
                      <Pressable
                        key={t._id}
                        style={[styles.listCard, t.alreadyPredicted && styles.listCardDimmed]}
                        disabled={t.alreadyPredicted}
                        onPress={() => handleSelectTournament(t)}>
                        <View style={[styles.listCardIcon, { backgroundColor: `${iconColor}18` }]}>
                          <Ionicons name="ribbon-outline" size={18} color={iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listCardTitle} numberOfLines={1}>{t.tournamentName}</Text>
                          <Text style={styles.listCardSub}>{t.horses.length} horses entered</Text>
                          {t.prizePool != null && t.prizePool > 0 && (
                            <Text style={styles.listCardMeta}>Prize Pool: ${t.prizePool.toLocaleString()}</Text>
                          )}
                        </View>
                        {t.alreadyPredicted ? (
                          <Badge label="Predicted" tone="green" icon="checkmark" />
                        ) : (
                          <Badge label={label} tone={tone} />
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
          ) : configError ? (
            <NoConnectionState
              onRetry={() => (target?.type === 'tournament'
                ? handleSelectTournament(target.item as TournamentForPrediction)
                : target
                  ? handleSelectRace(target.item as RaceScheduleItem)
                  : undefined)}
              accentColor={Palette.gold}
              mutedColor={Palette.textMuted}
            />
          ) : success ? (
            <View style={styles.center}>
              <Ionicons name="checkmark-circle" size={64} color={Palette.green} />
              <Text style={styles.successTitle}>Prediction placed successfully!</Text>
              <Text style={styles.successSub}>Going back...</Text>
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
                  <SectionLabel text="PREDICTION METHOD" />
                  {methods.length === 0 ? (
                    <View style={styles.inlineEmpty}>
                      <Ionicons name="bulb-outline" size={20} color={Palette.textMuted} />
                      <Text style={styles.inlineEmptyText}>No prediction methods available</Text>
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
                  <SectionLabel text={target?.type === 'tournament' ? 'SELECT CHAMPION HORSE' : 'SELECT HORSE'} />
                  {horses.length === 0 ? (
                    <View style={styles.inlineEmpty}>
                      <Ionicons name="ribbon-outline" size={20} color={Palette.textMuted} />
                      <Text style={styles.inlineEmptyText}>
                        {target?.type === 'race'
                          ? 'No horses registered for this race yet'
                          : 'No horses in this tournament yet'}
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
                  <SectionLabel text="PREDICTED RANK" />
                  <View style={styles.rankRow}>
                    <Text style={styles.rankLabel}>Rank</Text>
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

              {/* Stake amount — always visible in configure step */}
              <View style={styles.section}>
                <SectionLabel text="STAKE AMOUNT" />
                <View style={styles.rankRow}>
                  <Text style={styles.rankLabel}>Points</Text>
                  <TextInput
                    style={styles.rankInput}
                    value={stakeInput}
                    onChangeText={setStakeInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={Palette.textMuted}
                    maxLength={8}
                  />
                </View>
              </View>

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
            <Button label="PLACE PREDICTION" onPress={handleReview} disabled={isSubmitting} />
          </SafeAreaView>
        )}

      </SafeAreaView>

      {/* Bet confirmation — the one deliberate commit checkpoint before money moves */}
      <BottomSheet visible={confirmVisible} onClose={() => !isSubmitting && setConfirmVisible(false)}>
        <Text style={styles.confirmTitle}>Confirm prediction</Text>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Target</Text>
          <Text style={styles.confirmValue} numberOfLines={1}>{targetName}</Text>
        </View>
        {selectedMethod && (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Method</Text>
            <Text style={styles.confirmValue} numberOfLines={1}>{selectedMethod.methodName}</Text>
          </View>
        )}
        {selectedHorseName && (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Horse</Text>
            <Text style={styles.confirmValue} numberOfLines={1}>{selectedHorseName}</Text>
          </View>
        )}
        {selectedMethod?.methodType === 'race_rank' && predictedRank !== '' && (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Predicted rank</Text>
            <Text style={styles.confirmValue}>#{predictedRank}</Text>
          </View>
        )}
        <View style={styles.confirmStakeRow}>
          <Text style={styles.confirmLabel}>Stake</Text>
          <Text style={styles.confirmStakeValue}>{stakeInput} pts</Text>
        </View>

        <View style={styles.confirmActions}>
          <Button
            label="CANCEL"
            variant="secondary"
            onPress={() => setConfirmVisible(false)}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          />
          <Button
            label="CONFIRM"
            onPress={handleConfirm}
            loading={isSubmitting}
            style={{ flex: 1 }}
          />
        </View>
      </BottomSheet>
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
  confirmTitle: { fontSize: 18, fontWeight: '800', color: Palette.text, marginBottom: 16 },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
    gap: 12,
  },
  confirmLabel: { fontSize: 13, color: Palette.textMuted },
  confirmValue: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '600', color: Palette.text },
  confirmStakeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  confirmStakeValue: { fontFamily: Fonts.mono, fontSize: 22, fontWeight: '800', color: Palette.gold },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
});
