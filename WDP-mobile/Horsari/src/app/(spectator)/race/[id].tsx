import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getRaceDetail,
  PredictionItem,
  PredictionMethodType,
  RaceDetailRegistration,
} from '../../../api/spectatorApi';
import {
  FinishResult,
  LiveHorse,
  useSpectatorRaceSocket,
} from '../../../hooks/useSpectatorRaceSocket';
import { Fonts } from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const Palette = {
  bg: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  muted: '#9A9AA0',
  gold: '#C9A24B',
  red: '#C81E2E',
  green: '#22C55E',
} as const;

const HORSE_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#C0392B',
];

function horseColor(num: number) {
  return HORSE_COLORS[(num - 1) % HORSE_COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function rankSuffix(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}th`;
}

// Compute win/loss from finish positions — used before server settles predictions
function computeLocalOutcome(
  prediction: PredictionItem,
  results: FinishResult[],
): 'won' | 'lost' | null {
  const methodType = prediction.predictionMethod?.methodType as PredictionMethodType | undefined;
  const regId = prediction.registration?._id;
  if (!regId || !methodType) return null;
  const result = results.find(r => r.registrationId === regId);
  if (!result || result.finishPosition == null) return null;
  if (methodType === 'race_winner') return result.finishPosition === 1 ? 'won' : 'lost';
  if (methodType === 'race_rank')   return result.finishPosition === prediction.predictedRank ? 'won' : 'lost';
  return null; // tournament_champion — can't determine locally
}

// ─── Track Visualization ─────────────────────────────────────────────────────

const LANE_H = 34;
const MARKER = 26;
const PADDING_L = 32;
const PADDING_R = 8;

function TrackView({
  horses,
  trackLength,
}: {
  horses: LiveHorse[];
  trackLength: number;
}) {
  const [width, setWidth] = useState(0);

  // Dynamic window: zoom to where the pack actually is (1st → last horse).
  // Finished horses are treated as being at trackLength so leadDist never drops
  // back when the first horse crosses the line — the right edge stays locked.
  const allPositions = horses.map(h => h.isFinished ? trackLength : h.currentDistance);
  const runningPositions = allPositions.filter(d => d > 0);
  const leadDist  = Math.max(...allPositions);
  const trailDist = Math.min(...(runningPositions.length > 0 ? runningPositions : [leadDist]));
  const spread    = leadDist - trailDist;
  const pad       = Math.max(60, spread * 0.15);
  const windowStart = Math.max(0, trailDist - pad);
  const windowEnd   = Math.min(trackLength, leadDist + pad);
  const windowRange = Math.max(windowEnd - windowStart, 1);

  const toPct = (dist: number) =>
    Math.max(0, Math.min(1, (dist - windowStart) / windowRange));

  const usable     = Math.max(0, width - PADDING_L - PADDING_R - MARKER);
  const showFinish = windowEnd >= trackLength * 0.94;

  // Compute all 100m checkpoint marks that fall within the visible window.
  // Derived from horse positions so they're always accurate regardless of backend timing.
  const firstMark = Math.ceil(windowStart / 100) * 100;
  const checkpoints: number[] = [];
  for (let m = firstMark; m <= windowEnd && m < trackLength; m += 100) {
    checkpoints.push(m);
  }

  return (
    <View
      style={[styles.trackContainer, { height: horses.length * LANE_H + 40 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>

      {/* Lane guides + number labels */}
      {horses.map((h, i) => {
        const cy = 20 + i * LANE_H + LANE_H / 2;
        const color = horseColor(h.number);
        return (
          <View key={`lane-${h.registrationId}`}>
            <View style={[styles.trackGuide, { top: cy - 0.5, left: PADDING_L, right: PADDING_R, backgroundColor: `${color}15` }]} />
            <View style={[styles.laneLabel, { top: 20 + i * LANE_H + (LANE_H - 18) / 2, left: 6 }]}>
              <View style={[styles.laneCircle, { backgroundColor: `${color}30`, borderColor: `${color}60` }]}>
                <Text style={[styles.laneLabelText, { color }]}>{h.number}</Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* 100m checkpoint lines — computed from window, never flicker */}
      {width > 0 && checkpoints.map(m => (
        <View key={`cp-${m}`} style={[styles.lineMarkBar, { left: PADDING_L + toPct(m) * usable }]}>
          <Text style={styles.lineMarkLabel}>{m}m</Text>
        </View>
      ))}

      {/* Finish line — only when pack is near end */}
      {showFinish && (
        <>
          <View style={[styles.finishLine, { right: PADDING_R }]} />
          <Text style={[styles.finishLabel, { right: PADDING_R + 2 }]}>F</Text>
        </>
      )}

      {/* Horse markers — positioned relative to window */}
      {width > 0 && horses.map((h, i) => {
        const dist = h.isFinished ? trackLength : h.currentDistance;
        const left = PADDING_L + toPct(dist) * usable;
        const top  = 20 + i * LANE_H + (LANE_H - MARKER) / 2;
        const color = horseColor(h.number);
        return (
          <View
            key={h.registrationId}
            style={[styles.horseMarker, { left, top, backgroundColor: h.isFinished ? Palette.card : color, borderColor: color }]}>
            {h.isFinished
              ? <Ionicons name="checkmark" size={12} color={color} />
              : <Text style={styles.horseMarkerText}>{h.number}</Text>
            }
          </View>
        );
      })}

      {/* Window range — shows which section of the track is visible */}
      {width > 0 && (
        <View style={styles.windowRangeRow}>
          <Text style={styles.windowLabel}>{Math.round(windowStart)}m</Text>
          <Text style={styles.windowLabel}>{Math.round(windowEnd)}m</Text>
        </View>
      )}
    </View>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color = Palette.text,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Horse row in standings ───────────────────────────────────────────────────

function HorseRow({
  horse,
  rank,
  trackLength,
  isFinished,
}: {
  horse: LiveHorse;
  rank: number;
  trackLength: number;
  isFinished: boolean;
}) {
  const color = horseColor(horse.number);
  const pct = trackLength > 0 ? (horse.currentDistance / trackLength) * 100 : 0;

  return (
    <View style={styles.horseRow}>
      {/* Rank */}
      <Text style={styles.horseRowRank}>{rankSuffix(rank)}</Text>

      {/* Color circle + number */}
      <View style={[styles.horseRowCircle, { backgroundColor: `${color}25`, borderColor: color }]}>
        <Text style={[styles.horseRowNum, { color }]}>{horse.number}</Text>
      </View>

      {/* Name + progress */}
      <View style={styles.horseRowInfo}>
        <Text style={styles.horseRowName} numberOfLines={1}>{horse.horseName}</Text>
        {horse.jockeyName ? (
          <Text style={styles.horseRowJockey} numberOfLines={1}>{horse.jockeyName}</Text>
        ) : null}
        {!isFinished && !horse.isFinished && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%`, backgroundColor: color }]} />
          </View>
        )}
      </View>

      {/* Right side: finish time or speed */}
      <View style={styles.horseRowRight}>
        {horse.isFinished && horse.finishTime ? (
          <>
            <Text style={styles.finishTimeBadge}>{horse.finishTime}</Text>
            <Text style={styles.finishedLabel}>FINISHED</Text>
          </>
        ) : (
          <>
            <Text style={[styles.speedValue, { color }]}>
              {horse.currentSpeed > 0 ? `${horse.currentSpeed.toFixed(1)}` : '—'}
            </Text>
            <Text style={styles.speedUnit}>m/s</Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Prediction chip ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'ĐANG CHỜ', color: Palette.gold,  bg: '#1E1A0A' },
  correct:   { label: 'ĐÚNG',     color: Palette.green, bg: '#0A1A0F' },
  incorrect: { label: 'SAI',      color: Palette.red,   bg: '#1A0A0D' },
  cancelled: { label: 'HỦY',      color: Palette.muted, bg: '#111' },
  refunded:  { label: 'HOÀN TIỀN',color: '#8B5CF6',     bg: '#120A1A' },
};

function PredictionChip({
  prediction,
  horses,
  localOutcome,
  settled,
}: {
  prediction: PredictionItem;
  horses: LiveHorse[];
  localOutcome?: 'won' | 'lost' | null;
  settled?: boolean;
}) {
  const methodType = prediction.predictionMethod?.methodType;

  // Priority: server status (if settled) > local optimistic > raw status
  let displayStatus = prediction.predictionStatus;
  if (prediction.predictionStatus === 'pending' && localOutcome === 'won')  displayStatus = 'correct';
  if (prediction.predictionStatus === 'pending' && localOutcome === 'lost') displayStatus = 'incorrect';

  const st = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.pending;
  const isOptimistic = prediction.predictionStatus === 'pending' && localOutcome != null && !settled;

  const horseName =
    prediction.registration?.horse?.horseName ??
    horses.find(h => h.registrationId === prediction.registration?._id)?.horseName ??
    '—';

  const methodLabel = methodType === 'race_winner'
    ? 'Thắng'
    : methodType === 'race_rank'
    ? `Hạng #${prediction.predictedRank ?? '?'}`
    : 'Vô địch';

  return (
    <View style={styles.predChip}>
      <View style={[styles.methodBadge, { backgroundColor: `${Palette.gold}20`, borderColor: `${Palette.gold}40` }]}>
        <Text style={[styles.methodBadgeText, { color: Palette.gold }]}>{methodLabel.toUpperCase()}</Text>
      </View>

      <View style={styles.predChipMiddle}>
        <Text style={styles.predHorseName} numberOfLines={1}>{horseName}</Text>
        <Text style={styles.predPoints}>{prediction.rewardPoints} pts</Text>
      </View>

      <View style={[styles.predStatusBadge, { backgroundColor: st.bg, borderColor: `${st.color}50` }]}>
        <Text style={[styles.predStatusText, { color: st.color }]}>{st.label}</Text>
        {isOptimistic && (
          <Text style={[styles.predStatusText, { color: st.color, fontSize: 7, opacity: 0.7 }]}>~</Text>
        )}
      </View>
    </View>
  );
}

// ─── Bet Outcome Banner ───────────────────────────────────────────────────────

function BetOutcomeBanner({
  predictions,
  results,
  settled,
}: {
  predictions: PredictionItem[];
  results: FinishResult[];
  settled: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
  }, []);

  if (predictions.length === 0) return null;

  // Resolve each prediction's outcome
  const outcomes = predictions.map(p => {
    let outcome: 'won' | 'lost' | 'pending';
    if (p.predictionStatus === 'correct')   outcome = 'won';
    else if (p.predictionStatus === 'incorrect') outcome = 'lost';
    else {
      const local = computeLocalOutcome(p, results);
      outcome = local ?? 'pending';
    }
    const horseName =
      p.registration?.horse?.horseName ?? '—';
    const methodType = p.predictionMethod?.methodType;
    const methodLabel = methodType === 'race_winner'
      ? 'Thắng'
      : methodType === 'race_rank'
      ? `Hạng #${p.predictedRank ?? '?'}`
      : 'Vô địch';
    return { prediction: p, outcome, horseName, methodLabel };
  });

  const wonCount  = outcomes.filter(o => o.outcome === 'won').length;
  const lostCount = outcomes.filter(o => o.outcome === 'lost').length;
  const allWon    = wonCount > 0 && wonCount === predictions.length;
  const allLost   = lostCount === predictions.length;

  const totalPts = outcomes
    .filter(o => o.outcome === 'won')
    .reduce((sum, o) => sum + (o.prediction.rewardPoints ?? 0), 0);

  const accent   = allWon ? Palette.green : allLost ? Palette.red : Palette.gold;
  const bg       = allWon ? '#081A0F' : allLost ? '#1A0808' : '#1A1508';
  const border   = allWon ? '#1D4A2A' : allLost ? '#4A1A1A' : '#3A3010';
  const headline = allWon
    ? 'BẠN THẮNG! 🎉'
    : allLost
    ? 'CHÚC THẮNG LẦN SAU 😔'
    : `${wonCount}/${predictions.length} CỐC ĐÚNG 🎲`;

  return (
    <Animated.View
      style={[
        styles.betBanner,
        { backgroundColor: bg, borderColor: border },
        { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] },
      ]}
    >
      {/* Headline */}
      <Text style={[styles.betBannerHeadline, { color: accent }]}>{headline}</Text>
      {wonCount > 0 && (
        <Text style={[styles.betBannerPts, { color: accent }]}>+{totalPts} pts</Text>
      )}
      {!settled && (
        <Text style={styles.betBannerNote}>Chờ xác nhận chính thức</Text>
      )}

      {/* Divider */}
      <View style={[styles.betBannerDivider, { backgroundColor: border }]} />

      {/* Individual rows */}
      {outcomes.map(({ prediction, outcome, horseName, methodLabel }) => {
        const rowColor = outcome === 'won' ? Palette.green : outcome === 'lost' ? Palette.red : Palette.muted;
        const icon     = outcome === 'won' ? 'checkmark-circle' : outcome === 'lost' ? 'close-circle' : 'time';
        return (
          <View key={prediction._id} style={styles.betBannerRow}>
            <Ionicons name={icon as any} size={15} color={rowColor} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.betBannerRowHorse, { color: outcome === 'pending' ? Palette.muted : Palette.text }]} numberOfLines={1}>
                {horseName}
              </Text>
              <Text style={styles.betBannerRowMeta}>{methodLabel}</Text>
            </View>
            <Text style={[styles.betBannerRowPts, { color: rowColor }]}>
              {outcome === 'won' ? `+${prediction.rewardPoints}` : `${prediction.rewardPoints}`} pts
            </Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

// ─── Race Finished Banner ────────────────────────────────────────────────────

function FinishedBanner({
  results,
  isPendingConfirmation,
  distUnit,
  onToggleUnit,
}: {
  results: FinishResult[];
  isPendingConfirmation?: boolean;
  distUnit: 'metres' | 'lengths';
  onToggleUnit: () => void;
}) {
  const top3 = results.slice(0, 3);
  const fmtLength = (l: number | null | undefined): string | null => {
    if (l == null || l === 0) return null;
    if (distUnit === 'metres') return `+${(l * 2.4).toFixed(1)} m`;
    if (l <= 0.1)  return 'Nse';
    if (l <= 0.2)  return 'Hd';
    if (l <= 0.35) return 'Nk';
    const whole = Math.floor(l);
    const frac  = Math.round((l - whole) * 4) / 4;
    const f     = frac === 0 ? '' : frac === 0.25 ? '¼' : frac === 0.5 ? '½' : '¾';
    return whole === 0 ? `${f}L` : `${whole}${f}L`;
  };
  return (
    <View style={styles.finishedBanner}>
      <Ionicons name="trophy" size={28} color={Palette.gold} />
      <Text style={styles.finishedTitle}>ĐUA KẾT THÚC</Text>
      {top3.map((r, i) => (
        <View key={r.registrationId} style={styles.finishedRow}>
          <Text style={styles.finishedRowRank}>{rankSuffix(i + 1)}</Text>
          <Text style={styles.finishedRowName} numberOfLines={1}>{r.horseName}</Text>
          {r.finishTime && <Text style={styles.finishedRowTime}>{r.finishTime}</Text>}
          {fmtLength(r.distance) != null && (
            <Text style={styles.finishedRowDist}>{fmtLength(r.distance)}</Text>
          )}
        </View>
      ))}
      <Pressable onPress={onToggleUnit} style={styles.distUnitToggle}>
        <Text style={styles.distUnitToggleText}>
          {distUnit === 'metres' ? 'Đổi sang độ dài (L)' : 'Đổi sang mét (m)'}
        </Text>
      </Pressable>
      {isPendingConfirmation && (
        <Text style={styles.pendingNote}>Kết quả chờ xác nhận chính thức</Text>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LiveRaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [raceRound, setRaceRound] = useState<any>(null);
  const [registrations, setRegistrations] = useState<RaceDetailRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const { connected, liveUpdate, finishResults, confirmedResults } = useSpectatorRaceSocket(id ?? null);
  const [distUnit, setDistUnit] = useState<'lengths' | 'metres'>('lengths');
  // settled = admin has officially confirmed; optimistic = race_finished fired but not yet confirmed
  const settled = confirmedResults != null;

  useEffect(() => {
    if (!id) return;
    getRaceDetail(id).then((data) => {
      if (data) {
        setRaceRound(data.raceRound);
        setRegistrations(data.registrations);
      }
      setLoading(false);
    });
  }, [id]);

  const restFinishResults = registrations.some(r => r.raceResult)
    ? registrations.filter(r => r.raceResult).map(r => ({
        registrationId: r._id,
        horseName: r.horse?.horseName ?? '',
        jockeyName: r.jockey?.fullName ?? '',
        finishPosition: r.raceResult!.finishPosition,
        finishTime: r.raceResult!.finishTime,
        distance: r.raceResult!.distance ?? null,
      })).sort((a,b) => (a.finishPosition || 99) - (b.finishPosition || 99))
    : null;

  const activeFinishResults = finishResults || restFinishResults;

  // Build display horses: use live socket data if available, else fall back to registrations
  const displayHorses: LiveHorse[] = liveUpdate?.horses ??
    registrations.map((reg, i) => {
      const res = reg.raceResult;
      return {
        registrationId: reg._id,
        number: reg.laneNumber ?? i + 1,
        horseName: reg.horse?.horseName ?? `Horse ${i + 1}`,
        jockeyName: reg.jockey?.fullName ?? '',
        raceStyle: 'Pace',
        currentDistance: 0,
        currentSpeed: 0,
        isFinished: !!res,
        finishPosition: res?.finishPosition ?? null,
        finishTime: res?.finishTime ?? null,
      };
    });

  const trackLength = liveUpdate?.trackLength ?? raceRound?.trackLength ?? 2000;
  const elapsed = liveUpdate ? formatElapsed(liveUpdate.elapsedSeconds) : '--:--';

  // Sort standings: finished horses by finishPosition, then running by distance
  const sortedHorses = activeFinishResults
    ? (activeFinishResults
        .map((r) => displayHorses.find((h) => h.registrationId === r.registrationId))
        .filter(Boolean) as LiveHorse[])
    : [...displayHorses].sort((a, b) => {
        if (a.isFinished !== b.isFinished) return a.isFinished ? -1 : 1;
        if (a.isFinished && b.isFinished) return (a.finishPosition ?? 99) - (b.finishPosition ?? 99);
        return b.currentDistance - a.currentDistance;
      });

  const leader = sortedHorses[0];
  const myPredictions = registrations
    .filter((r) => r.userPrediction !== null)
    .map((r) => r.userPrediction as PredictionItem);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Palette.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={Palette.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {raceRound?.roundName ?? 'Vòng đua'}
            </Text>
            {raceRound?.tournament?.tournamentName ? (
              <Text style={styles.headerSub} numberOfLines={1}>
                {raceRound.tournament.tournamentName}
              </Text>
            ) : null}
          </View>
          <View style={[
            styles.wsBadge,
            connected
              ? { borderColor: '#22533A', backgroundColor: '#0D2B1A' }
              : { borderColor: '#5C1A1F', backgroundColor: '#1A0A0D' },
          ]}>
            <View style={[styles.wsDot, { backgroundColor: connected ? Palette.green : Palette.red }]} />
            <Text style={[styles.wsBadgeText, { color: connected ? Palette.green : Palette.red }]}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        {/* ── Stats strip — locked above scroll, hidden when race finished ── */}
        {!activeFinishResults && (
          <View style={styles.statsStrip}>
            <StatChip label="THỜI GIAN" value={elapsed} color={Palette.gold} />
            <View style={styles.statsDivider} />
            <StatChip
              label="DẪN ĐẦU"
              value={leader ? `#${leader.number} ${leader.horseName.split(' ')[0]}` : '—'}
              color="#f9a8d4"
            />
            <View style={styles.statsDivider} />
            <StatChip
              label="TỐC ĐỘ"
              value={leader && leader.currentSpeed > 0 ? `${leader.currentSpeed.toFixed(1)} m/s` : '—'}
              color="#6ee7b7"
            />
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Finished banner (shown when race is done) ── */}
          {activeFinishResults && (
            <FinishedBanner
              results={activeFinishResults}
              isPendingConfirmation={raceRound?.status === 'awaitingConfirmation'}
              distUnit={distUnit}
              onToggleUnit={() => setDistUnit(u => u === 'metres' ? 'lengths' : 'metres')}
            />
          )}

          {/* ── Video ── */}
          {!activeFinishResults && (
            <View style={[styles.videoPlaceholder, { overflow: 'hidden' }]}>
              {Platform.OS === 'web' ? (
                // @ts-ignore — iframe is valid in react-native-web
                <iframe
                  src="https://www.youtube.com/embed/2rKE4YIrDRk?autoplay=1&mute=1&loop=1&playlist=2rKE4YIrDRk&controls=0&showinfo=0&playsinline=1"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <WebView
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  source={{ uri: 'https://www.youtube.com/embed/2rKE4YIrDRk?autoplay=1&mute=1&loop=1&playlist=2rKE4YIrDRk&controls=0&showinfo=0&playsinline=1' }}
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback
                  scrollEnabled={false}
                  pointerEvents="none"
                />
              )}
            </View>
          )}

          {/* ── Track visualization ── */}
          {!activeFinishResults && (
            <Section title="VỊ TRÍ TRÊN ĐUA TRƯỜNG">
              {displayHorses.length > 0
                ? <TrackView horses={displayHorses} trackLength={trackLength} />
                : <Text style={styles.emptyText}>Chưa có ngựa tham gia</Text>
              }
              <Text style={styles.trackNote}>Đường đua: {trackLength.toLocaleString()} m</Text>
            </Section>
          )}

          {/* ── Standings ── */}
          <Section title="BẢNG XẾP HẠNG">
            {sortedHorses.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            ) : sortedHorses.map((h, idx) => (
              <HorseRow
                key={h.registrationId}
                horse={h}
                rank={idx + 1}
                trackLength={trackLength}
                isFinished={activeFinishResults !== null}
              />
            ))}
          </Section>

          {/* ── My predictions ── */}
          {myPredictions.length > 0 && (
            <Section title="CƯỢC CỦA BẠN">
              {/* Outcome banner — shown once race finishes (optimistic) or confirmed (official) */}
              {activeFinishResults && (
                <BetOutcomeBanner
                  predictions={myPredictions}
                  results={confirmedResults ?? activeFinishResults}
                  settled={settled}
                />
              )}
              {myPredictions.map((p) => {
                const localOutcome = activeFinishResults
                  ? computeLocalOutcome(p, confirmedResults ?? activeFinishResults)
                  : null;
                return (
                  <PredictionChip
                    key={p._id}
                    prediction={p}
                    horses={displayHorses}
                    localOutcome={localOutcome}
                    settled={settled}
                  />
                );
              })}
            </Section>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: Palette.bg, alignItems: 'center', justifyContent: 'center' },

  // Header
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
    backgroundColor: '#1a1a1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  headerSub: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.muted,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  wsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  wsDot: { width: 6, height: 6, borderRadius: 3 },
  wsBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  scroll: { paddingHorizontal: 16 },

  // Finished banner
  finishedBanner: {
    alignItems: 'center',
    backgroundColor: '#1A160A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A3010',
    padding: 20,
    marginTop: 16,
    gap: 6,
  },
  finishedTitle: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    color: Palette.gold,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 8,
  },
  finishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  finishedRowRank: { fontSize: 18, width: 36, textAlign: 'center' },
  finishedRowName: { flex: 1, fontSize: 14, fontWeight: '600', color: Palette.text },
  finishedRowTime: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Palette.muted,
  },
  finishedRowDist: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.muted,
  },
  distUnitToggle: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3010',
    backgroundColor: '#1A160A',
  },
  distUnitToggleText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700' as const,
    color: Palette.gold,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },

  // Video placeholder
  videoPlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: '#0d0d0e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  videoText: { fontSize: 13, color: '#333' },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1a0a0d',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5c1a1f',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.red,
  },
  liveTagText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.red,
    letterSpacing: 0.5,
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
    overflow: 'hidden',
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Palette.muted,
    letterSpacing: 0.8,
  },
  statValue: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
  },
  statsDivider: { width: 1, backgroundColor: Palette.cardBorder, marginVertical: 8 },

  // Section
  section: {
    marginTop: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Palette.gold,
  },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    color: Palette.gold,
    letterSpacing: 1.5,
  },

  // Track
  trackContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  trackGuide: {
    position: 'absolute',
    height: 1,
  },
  finishLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ffffff15',
  },
  finishLabel: {
    position: 'absolute',
    top: 2,
    fontFamily: Fonts.mono,
    fontSize: 7,
    fontWeight: '800',
    color: '#2a2a2a',
  },
  startLabel: {
    position: 'absolute',
    top: 2,
    fontFamily: Fonts.mono,
    fontSize: 7,
    fontWeight: '800',
    color: '#2a2a2a',
  },
  laneLabel: { position: 'absolute' },
  laneCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laneLabelText: {
    fontSize: 8,
    fontWeight: '900',
  },
  horseMarker: {
    position: 'absolute',
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horseMarkerText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  trackNote: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.muted,
    textAlign: 'right',
    marginTop: 2,
  },

  // Horse row
  horseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  horseRowRank: { fontSize: 18, width: 32, textAlign: 'center' },
  horseRowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horseRowNum: { fontSize: 13, fontWeight: '900' },
  horseRowInfo: { flex: 1, gap: 3 },
  horseRowName: { fontSize: 14, fontWeight: '700', color: Palette.text },
  horseRowJockey: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.muted,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  horseRowRight: { alignItems: 'flex-end', minWidth: 52 },
  finishTimeBadge: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.gold,
  },
  finishedLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Palette.green,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  speedValue: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
  },
  speedUnit: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Palette.muted,
  },

  // Prediction chip
  predChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  methodBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  methodBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  predChipMiddle: { flex: 1 },
  predHorseName: { fontSize: 14, fontWeight: '700', color: Palette.text },
  predPoints: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.muted,
    marginTop: 1,
  },
  predStatusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  predStatusText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  emptyText: { fontSize: 13, color: Palette.muted, textAlign: 'center', paddingVertical: 12 },
  bottomPad: { height: 40 },
  pendingNote: { fontSize: 11, color: '#C9A24B', marginTop: 8, letterSpacing: 0.3, textAlign: 'center' },

  lineMarkBar: {
    position: 'absolute',
    top: 16,
    bottom: 14,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  lineMarkLabel: {
    position: 'absolute',
    top: -14,
    left: -18,
    width: 38,
    textAlign: 'center',
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.mono,
  },
  windowRangeRow: {
    position: 'absolute',
    bottom: 2,
    left: PADDING_L,
    right: PADDING_R,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  windowLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.28)',
    fontFamily: Fonts.mono,
  },

  // Bet outcome banner
  betBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  betBannerHeadline: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 2,
  },
  betBannerPts: {
    fontFamily: Fonts.mono,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 2,
  },
  betBannerNote: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Palette.muted,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  betBannerDivider: {
    height: 1,
    marginVertical: 8,
  },
  betBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 5,
  },
  betBannerRowHorse: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  betBannerRowMeta: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Palette.muted,
    letterSpacing: 0.3,
  },
  betBannerRowPts: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
});
