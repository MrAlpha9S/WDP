import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createPrediction,
  getAvailablePredictionMethods,
  getRaceDetail,
  PredictionMethod,
  PredictionMethodType,
  RaceDetailRegistration,
} from '../api/spectatorApi';
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface RacePredictionTarget {
  type: 'race';
  raceRoundId: string;
  raceName: string;
}

interface TournamentPredictionTarget {
  type: 'tournament';
  tournamentId: string;
  tournamentName: string;
  horses: { _id: string; horseName: string }[];
}

export type PredictionTarget = RacePredictionTarget | TournamentPredictionTarget;

interface Props {
  visible: boolean;
  target: PredictionTarget | null;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Horse Picker ─────────────────────────────────────────────────────────────

function HorsePicker({
  horses,
  selected,
  onSelect,
}: {
  horses: { _id: string; horseName: string; laneNumber?: number | null }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.horseList}>
      {horses.map(h => {
        const active = selected === h._id;
        return (
          <Pressable
            key={h._id}
            style={[styles.horseChip, active && styles.horseChipActive]}
            onPress={() => onSelect(h._id)}>
            {h.laneNumber != null && (
              <Text style={[styles.horseLane, active && { color: Palette.background }]}>
                #{h.laneNumber}
              </Text>
            )}
            <Text
              style={[styles.horseName, active && { color: Palette.background }]}
              numberOfLines={1}>
              {h.horseName}
            </Text>
            {active && <Ionicons name="checkmark" size={14} color={Palette.background} />}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Method Picker ────────────────────────────────────────────────────────────

const METHOD_ICON: Record<PredictionMethodType, string> = {
  race_winner: 'trophy-outline',
  race_rank: 'podium-outline',
  tournament_champion: 'ribbon-outline',
};

function MethodPicker({
  methods,
  selected,
  onSelect,
}: {
  methods: PredictionMethod[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.methodList}>
      {methods.map(m => {
        const active = selected === m._id;
        const icon = METHOD_ICON[m.methodType] ?? 'bulb-outline';
        return (
          <Pressable
            key={m._id}
            style={[styles.methodCard, active && styles.methodCardActive]}
            onPress={() => onSelect(m._id)}>
            <View style={styles.methodCardLeft}>
              <Ionicons
                name={icon as any}
                size={18}
                color={active ? Palette.gold : Palette.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodName, active && { color: Palette.gold }]}>
                  {m.methodName}
                </Text>
                <Text style={styles.methodDesc} numberOfLines={2}>
                  {m.methodDescription}
                </Text>
              </View>
            </View>
            {active && (
              <Ionicons name="radio-button-on" size={16} color={Palette.gold} />
            )}
            {!active && (
              <Ionicons name="radio-button-off" size={16} color={Palette.cardBorder} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PredictionModal({ visible, target, onClose, onSuccess }: Props) {
  const [methods, setMethods] = useState<PredictionMethod[]>([]);
  const [registrations, setRegistrations] = useState<RaceDetailRegistration[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [predictedRank, setPredictedRank] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedMethod = methods.find(m => m._id === selectedMethodId) ?? null;

  useEffect(() => {
    if (!visible || !target) return;
    setSelectedMethodId(null);
    setSelectedHorseId(null);
    setSelectedRegId(null);
    setPredictedRank('');
    setError(null);
    setSuccessMsg(null);
    loadData();
  }, [visible, target]);

  const loadData = async () => {
    if (!target) return;
    setIsLoading(true);
    try {
      if (target.type === 'race') {
        const [methodsRes, raceRes] = await Promise.all([
          getAvailablePredictionMethods(target.raceRoundId),
          getRaceDetail(target.raceRoundId),
        ]);
        // Filter to race-level methods only
        setMethods(methodsRes.filter(m =>
          m.methodType === 'race_winner' || m.methodType === 'race_rank'
        ));
        setRegistrations(raceRes?.registrations ?? []);
      } else {
        // Tournament champion — only show champion method
        const methodsRes = await getAvailablePredictionMethods();
        setMethods(methodsRes.filter(m => m.methodType === 'tournament_champion'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // When a horse chip is selected, find the matching registrationId
  const handleSelectHorse = (horseId: string) => {
    setSelectedHorseId(horseId);
    if (target?.type === 'race') {
      const reg = registrations.find(r => r.horse?._id === horseId);
      setSelectedRegId(reg?._id ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!target || !selectedMethodId || !selectedMethod) return;
    setError(null);
    setIsSubmitting(true);

    let body: Parameters<typeof createPrediction>[0] | null = null;

    if (selectedMethod.methodType === 'tournament_champion') {
      if (!selectedHorseId) { setError('Vui lòng chọn một con ngựa.'); setIsSubmitting(false); return; }
      body = {
        predictionMethodId: selectedMethodId,
        tournamentId: (target as TournamentPredictionTarget).tournamentId,
        predictedHorseId: selectedHorseId,
      };
    } else if (selectedMethod.methodType === 'race_winner') {
      if (!selectedRegId) { setError('Vui lòng chọn một con ngựa.'); setIsSubmitting(false); return; }
      body = { predictionMethodId: selectedMethodId, registrationId: selectedRegId };
    } else if (selectedMethod.methodType === 'race_rank') {
      const rank = parseInt(predictedRank, 10);
      if (!selectedRegId) { setError('Vui lòng chọn một con ngựa.'); setIsSubmitting(false); return; }
      if (!rank || rank < 1) { setError('Vui lòng nhập thứ hạng hợp lệ (≥ 1).'); setIsSubmitting(false); return; }
      body = { predictionMethodId: selectedMethodId, registrationId: selectedRegId, predictedRank: rank };
    }

    if (!body) { setIsSubmitting(false); return; }

    const result = await createPrediction(body);
    setIsSubmitting(false);

    if (result.ok) {
      setSuccessMsg('Đặt dự đoán thành công!');
      setTimeout(() => { onSuccess?.(); onClose(); }, 1200);
    } else {
      setError(result.message);
    }
  };

  const horses =
    target?.type === 'race'
      ? registrations
          .filter(r => r.horse)
          .map(r => ({ _id: r.horse!._id, horseName: r.horse!.horseName, laneNumber: r.laneNumber }))
      : (target as TournamentPredictionTarget | null)?.horses ?? [];

  const title = target?.type === 'race'
    ? target.raceName
    : (target as TournamentPredictionTarget | null)?.tournamentName ?? '';

  const subtitle = target?.type === 'race' ? 'Chọn phương thức dự đoán' : 'Đoán nhà vô địch giải';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle} numberOfLines={2}>{title}</Text>
                <Text style={styles.sheetSubtitle}>{subtitle}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color={Palette.textMuted} />
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Palette.gold} size="large" />
            </View>
          ) : successMsg ? (
            <View style={styles.center}>
              <Ionicons name="checkmark-circle" size={48} color={Palette.green} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>

              {/* Method picker (race only — tournament auto-selects champion) */}
              {target?.type === 'race' && methods.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>PHƯƠNG THỨC</Text>
                  <MethodPicker
                    methods={methods}
                    selected={selectedMethodId}
                    onSelect={id => { setSelectedMethodId(id); setSelectedHorseId(null); setSelectedRegId(null); setPredictedRank(''); }}
                  />
                </View>
              )}

              {/* Auto-select champion method for tournament target */}
              {target?.type === 'tournament' && methods.length > 0 && !selectedMethodId && (() => {
                setSelectedMethodId(methods[0]._id);
                return null;
              })()}

              {/* Horse picker */}
              {(selectedMethodId || target?.type === 'tournament') && horses.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    {target?.type === 'tournament' ? 'CHỌN NGỰA VÔ ĐỊCH' : 'CHỌN NGỰA'}
                  </Text>
                  <HorsePicker
                    horses={horses}
                    selected={target?.type === 'race' ? selectedHorseId : selectedHorseId}
                    onSelect={handleSelectHorse}
                  />
                </View>
              )}

              {/* Rank input — only for race_rank */}
              {selectedMethod?.methodType === 'race_rank' && selectedHorseId && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>THỨ HẠNG DỰ ĐOÁN</Text>
                  <View style={styles.rankInputRow}>
                    <Text style={styles.rankPrefix}>Hạng</Text>
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
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Palette.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit */}
              <Pressable
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting
                  ? <ActivityIndicator color={Palette.background} size="small" />
                  : <Text style={styles.submitText}>ĐẶT DỰ ĐOÁN</Text>
                }
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: Palette.cardBorder,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.cardBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, lineHeight: 22 },
  sheetSubtitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.gold,
    letterSpacing: 0.5,
    marginTop: 3,
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
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 16 },
  successText: { fontSize: 16, fontWeight: '700', color: Palette.green },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 40 },

  section: { gap: 10 },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Palette.textMuted,
  },

  // Method
  methodList: { gap: 8 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  methodCardActive: { borderColor: Palette.gold, backgroundColor: '#1A1608' },
  methodCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  methodName: { fontSize: 14, fontWeight: '700', color: Palette.text, marginBottom: 2 },
  methodDesc: { fontSize: 12, color: Palette.textMuted, lineHeight: 17 },

  // Horse
  horseList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  horseChipActive: { backgroundColor: Palette.gold, borderColor: Palette.gold },
  horseLane: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  horseName: { fontSize: 13, fontWeight: '600', color: Palette.text },

  // Rank input
  rankInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rankPrefix: { fontSize: 15, fontWeight: '600', color: Palette.textMuted },
  rankInput: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.gold,
    minWidth: 40,
    fontFamily: Fonts.mono,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A0608',
    borderWidth: 1,
    borderColor: '#3A1218',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: Palette.red, lineHeight: 18 },

  // Submit
  submitBtn: {
    backgroundColor: Palette.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.background,
  },
});
