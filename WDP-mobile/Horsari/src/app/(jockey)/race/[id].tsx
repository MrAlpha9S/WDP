import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getRaceRoundDetail,
  RaceRoundDetail,
  RaceRoundDetailRegistration,
} from '../../../api/jockeyApi';
import { isNetworkError } from '../../../api/axios';
import { Fonts, Palette } from '@/constants/theme';
import { NoConnectionState } from '@/components/NoConnectionState';
import { Badge, BadgeTone } from '@/components/ui/Badge';

// ─── Status → badge tone ──────────────────────────────────────────────────────

function statusBadge(status: string): { label: string; tone: BadgeTone } {
  switch (status) {
    case 'running': return { label: 'LIVE', tone: 'red' };
    case 'completed': return { label: 'COMPLETED', tone: 'muted' };
    case 'cancelled': return { label: 'CANCELLED', tone: 'muted' };
    case 'awaitingConfirmation': return { label: 'AWAITING RESULTS', tone: 'amber' };
    case 'prepared': return { label: 'PREPARED', tone: 'gold' };
    default: return { label: 'UPCOMING', tone: 'gold' };
  }
}

// Same escalation scale as (jockey)/profile.tsx — kept local since these
// helpers aren't exported from there (both are ~10 lines, not worth a shared
// module for this alone).
function stewardActionTone(action: string): BadgeTone {
  switch (action) {
    case 'disqualified':
    case 'permanent-ban':
      return 'red';
    case 'fine':
    case 'suspended':
    case 'demoted':
      return 'amber';
    case 'investigation':
      return 'gold';
    default:
      return 'muted';
  }
}

function violationStatusStyle(v: RaceRoundDetail['myViolations'][number]): { tone: BadgeTone; label: string } {
  if (v.violationStatus === 'dismissed') return { tone: 'muted', label: 'Dismissed' };
  if (v.violationStatus === 'pending') return { tone: 'amber', label: 'Pending Review' };
  return { tone: stewardActionTone(v.stewardAction), label: 'Confirmed' };
}

function ordinal(pos: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${pos}${suffixes[pos] ?? 'th'}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Info stat cell ───────────────────────────────────────────────────────────

function InfoCell({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Ionicons name={icon} size={13} color={Palette.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Field / standings row ────────────────────────────────────────────────────

function FieldRow({ reg, isMine }: { reg: RaceRoundDetailRegistration; isMine: boolean }) {
  const pos = reg.raceResult?.finishPosition ?? null;
  return (
    <View style={[styles.fieldRow, isMine && styles.fieldRowMine]}>
      <View style={styles.fieldPosCol}>
        <Text style={styles.fieldPos}>{pos != null ? ordinal(pos) : (reg.laneNumber != null ? `#${reg.laneNumber}` : '—')}</Text>
      </View>
      <View style={styles.fieldBody}>
        <View style={styles.fieldNameRow}>
          <Text style={styles.fieldHorse} numberOfLines={1}>{reg.horse?.horseName ?? 'Unknown horse'}</Text>
          {isMine && <Badge label="YOU" tone="gold" />}
        </View>
        <Text style={styles.fieldJockey} numberOfLines={1}>{reg.jockey?.fullName ?? 'No jockey'}</Text>
      </View>
      {reg.raceResult?.prizeMoney != null && reg.raceResult.prizeMoney > 0 && (
        <Text style={styles.fieldPrize}>{reg.raceResult.prizeMoney.toLocaleString()} ₫</Text>
      )}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function JockeyRaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<RaceRoundDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRaceRoundDetail(id);
      if (!data) {
        setError('Could not load this race.');
      } else {
        setDetail(data);
      }
    } catch (err) {
      setError(isNetworkError(err) ? 'Could not reach the server.' : 'Could not load this race.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const raceRound = detail?.raceRound ?? null;
  const badge = raceRound ? statusBadge(raceRound.status) : null;
  const isCompleted = raceRound?.status === 'completed';
  const isRunning = raceRound?.status === 'running';

  const sortedField = detail
    ? [...detail.registrations].sort((a, b) => {
        const pa = a.raceResult?.finishPosition;
        const pb = b.raceResult?.finishPosition;
        if (pa != null && pb != null) return pa - pb;
        if (pa != null) return -1;
        if (pb != null) return 1;
        return (a.laneNumber ?? 99) - (b.laneNumber ?? 99);
      })
    : [];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={Palette.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {raceRound?.roundName ?? 'Race Round'}
            </Text>
            {raceRound?.tournamentId && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {raceRound.tournamentId.tournamentName}
              </Text>
            )}
          </View>
          {badge && <Badge label={badge.label} tone={badge.tone} dot={isRunning} />}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.red} size="large" />
          </View>
        ) : error || !detail || !raceRound ? (
          <NoConnectionState
            onRetry={load}
            message={error ?? 'Race not found.'}
            accentColor={Palette.red}
            mutedColor={Palette.textMuted}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Race info ── */}
            <View style={styles.infoGrid}>
              <InfoCell icon="calendar-outline" label="Date" value={raceRound.raceDate ? formatDate(raceRound.raceDate) : 'TBA'} />
              <InfoCell icon="location-outline" label="Venue" value={raceRound.location || 'TBA'} />
              <InfoCell icon="resize-outline" label="Track" value={raceRound.trackLength != null ? `${raceRound.trackLength} m` : '—'} />
              <InfoCell icon="ribbon-outline" label="Race Type" value={raceRound.raceType ?? '—'} />
            </View>

            {isRunning && (
              <View style={styles.liveBanner}>
                <Ionicons name="flag-outline" size={16} color={Palette.red} />
                <Text style={styles.liveBannerText}>Race in progress — results will appear here once it's confirmed.</Text>
              </View>
            )}

            {/* ── Your result (post-race, only if you actually rode this one) ── */}
            {isCompleted && detail.myRegistrationId != null && (
              <>
                <Text style={styles.sectionTitle}>Your Result</Text>
                <View style={styles.resultCard}>
                  <View style={styles.resultPosCol}>
                    <Text style={styles.resultPos}>
                      {detail.myResult?.finishPosition != null ? ordinal(detail.myResult.finishPosition) : 'DNF'}
                    </Text>
                    <Text style={styles.resultPosLabel}>POSITION</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultStatCol}>
                    <Text style={styles.resultStatValue}>{detail.myResult?.finishTime ?? '—'}</Text>
                    <Text style={styles.resultStatLabel}>TIME</Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultStatCol}>
                    <Text style={[styles.resultStatValue, { color: Palette.gold }]}>
                      {detail.myResult?.prizeMoney ? `${detail.myResult.prizeMoney.toLocaleString()} ₫` : '—'}
                    </Text>
                    <Text style={styles.resultStatLabel}>PRIZE</Text>
                  </View>
                </View>
              </>
            )}

            {/* ── Violations (post-race only) ── */}
            {isCompleted && detail.myViolations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Violations</Text>
                <View style={styles.raceList}>
                  {detail.myViolations.map((v, i, arr) => {
                    const status = violationStatusStyle(v);
                    return (
                      <View key={v._id}>
                        <View style={styles.violationRow}>
                          <View style={styles.fieldBody}>
                            <Text style={styles.fieldHorse} numberOfLines={1}>
                              {v.violationType?.violationName ?? 'Violation'}
                            </Text>
                            {!!v.description && (
                              <Text style={styles.fieldJockey} numberOfLines={2}>{v.description}</Text>
                            )}
                            {!!v.actualPenalty && (
                              <Text style={styles.violationPenalty} numberOfLines={2}>{v.actualPenalty}</Text>
                            )}
                          </View>
                          <View style={styles.violationBadges}>
                            <Badge label={status.label.toUpperCase()} tone={status.tone} />
                          </View>
                        </View>
                        {i < arr.length - 1 && <View style={styles.raceDivider} />}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── Field ── */}
            <Text style={styles.sectionTitle}>Field ({sortedField.length})</Text>
            <View style={styles.raceList}>
              {sortedField.length === 0 ? (
                <View style={styles.emptyField}>
                  <Text style={styles.emptyText}>No confirmed participants yet.</Text>
                </View>
              ) : (
                sortedField.map((reg, i) => (
                  <View key={reg._id}>
                    <FieldRow reg={reg} isMine={reg._id === detail.myRegistrationId} />
                    {i < sortedField.length - 1 && <View style={styles.raceDivider} />}
                  </View>
                ))
              )}
            </View>

            <View style={styles.bottomPad} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.cardRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Palette.text },
  headerSub: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    marginTop: 1,
    letterSpacing: 0.3,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  infoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: { fontSize: 13, fontWeight: '600', color: Palette.text, marginTop: 2 },

  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${Palette.red}18`,
    borderWidth: 1,
    borderColor: `${Palette.red}44`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  liveBannerText: { flex: 1, fontSize: 12, color: Palette.text, lineHeight: 18 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Palette.text, marginBottom: 10 },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  resultPosCol: { alignItems: 'center', minWidth: 64 },
  resultPos: { fontSize: 24, fontWeight: '800', color: Palette.gold },
  resultPosLabel: {
    fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700',
    letterSpacing: 0.5, color: Palette.textMuted, marginTop: 2,
  },
  resultDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Palette.cardBorder, marginHorizontal: 12 },
  resultStatCol: { flex: 1, alignItems: 'center' },
  resultStatValue: { fontFamily: Fonts.mono, fontSize: 14, fontWeight: '700', color: Palette.text },
  resultStatLabel: {
    fontFamily: Fonts.mono, fontSize: 9, fontWeight: '700',
    letterSpacing: 0.5, color: Palette.textMuted, marginTop: 4,
  },

  raceList: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
    marginBottom: 20,
  },
  raceDivider: { height: 1, backgroundColor: Palette.cardBorder, marginHorizontal: 14 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  fieldRowMine: { backgroundColor: `${Palette.gold}0F` },
  fieldPosCol: { minWidth: 40, alignItems: 'center' },
  fieldPos: { fontFamily: Fonts.mono, fontSize: 13, fontWeight: '800', color: Palette.text },
  fieldBody: { flex: 1, gap: 2 },
  fieldNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldHorse: { fontSize: 14, fontWeight: '600', color: Palette.text },
  fieldJockey: { fontSize: 12, color: Palette.textMuted },
  fieldPrize: { fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', color: Palette.gold },

  violationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  violationBadges: { alignItems: 'flex-end', gap: 4 },
  violationPenalty: { fontSize: 11, color: Palette.textMuted, opacity: 0.7, marginTop: 4 },

  emptyField: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Palette.textMuted },

  bottomPad: { height: 24 },
});
