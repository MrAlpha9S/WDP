import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  confirmPaymentReceived,
  getMyPayments,
  PaymentEntity,
  PaymentStatus,
} from '../../api/jockeyApi';
import { useSocket } from '../../socket/SocketContext';
import { Fonts, Palette } from '@/constants/theme';
import { RefetchButton } from '@/components/RefetchButton';
import { NoConnectionState } from '@/components/NoConnectionState';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} — ${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function paymentTypeLabel(type: PaymentEntity['paymentType']): string {
  switch (type) {
    case 'jockey_payout': return 'Jockey Payout';
    case 'race_prize':    return 'Race Prize';
    case 'referee_fee':   return 'Referee Fee';
    default:              return type;
  }
}

function paymentStatusTone(status: PaymentStatus): BadgeTone {
  if (status === 'paid') return 'green';
  if (status === 'processing') return 'amber';
  return 'muted';
}

function paymentStatusColor(status: PaymentStatus): string {
  if (status === 'paid') return Palette.green;
  if (status === 'processing') return Palette.amber;
  return Palette.textMuted;
}

function paymentStatusLabel(status: PaymentStatus): string {
  if (status === 'paid') return 'Received';
  if (status === 'processing') return 'Processing';
  return 'Unpaid';
}

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterKey = 'all' | PaymentStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'unpaid',     label: 'Unpaid' },
  { key: 'processing', label: 'Processing' },
  { key: 'paid',       label: 'Received' },
];

// ─── Payment Row ──────────────────────────────────────────────────────────────

function PaymentRow({
  item,
  onConfirm,
  busy,
}: {
  item: PaymentEntity;
  onConfirm: (paymentId: string) => void;
  busy: boolean;
}) {
  const color = paymentStatusColor(item.paymentStatus);
  const canConfirm = item.paymentStatus !== 'paid' && !item.payeeConfirmed;

  return (
    <View style={styles.row}>
      <View style={[styles.rowIconBg, { backgroundColor: `${color}18` }]}>
        <Ionicons name="cash-outline" size={20} color={color} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowType}>{paymentTypeLabel(item.paymentType)}</Text>
        <Text style={styles.rowDate}>{formatViDateTime(item.createdAt)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{item.amount.toLocaleString()} ₫</Text>
        <Badge label={paymentStatusLabel(item.paymentStatus)} tone={paymentStatusTone(item.paymentStatus)} />
        {canConfirm && (
          <Button
            label="CONFIRM RECEIVED"
            size="compact"
            accentColor={Palette.red}
            loading={busy}
            onPress={() => onConfirm(item._id)}
            style={styles.confirmBtn}
          />
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<PaymentEntity[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    if (!silent) setError(null);
    try {
      const status = activeFilter === 'all' ? undefined : activeFilter;
      const { items } = await getMyPayments(1, 20, status);
      setPayments(items);
    } catch {
      setError('Could not load payments. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLastUpdated(Date.now());
    }
  };

  useEffect(() => { load(); }, [activeFilter]);

  // Live refetch when a payment-related notification arrives.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { type?: string }) => {
      if (payload?.type?.startsWith('payment_')) load(true);
    };
    socket.on('notification_created', handler);
    return () => { socket.off('notification_created', handler); };
  }, [socket]);

  const onRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  const onConfirm = async (paymentId: string) => {
    setConfirmingId(paymentId);
    const result = await confirmPaymentReceived(paymentId);
    if (!result.ok) {
      setError(result.message);
    } else {
      load(true);
    }
    setConfirmingId(null);
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
          <Text style={styles.headerTitle}>PAYMENTS</Text>
          <RefetchButton onRefetch={() => load(true)} lastUpdated={lastUpdated} loading={isRefreshing} accentColor={Palette.red} />
        </View>

        {/* ─── Filter bar ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}>
          {FILTERS.map(({ key, label }) => (
            <Chip key={key} label={label} active={activeFilter === key} onPress={() => setActiveFilter(key)} />
          ))}
        </ScrollView>

        {/* ─── Body ─── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.red} size="large" />
          </View>
        ) : error && payments.length === 0 ? (
          <NoConnectionState
            onRetry={() => load()}
            message={error}
            accentColor={Palette.red}
            mutedColor={Palette.textMuted}
          />
        ) : (
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

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={14} color={Palette.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.list}>
              {payments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={36} color={Palette.textMuted} />
                  <Text style={styles.emptyText}>No payments yet</Text>
                </View>
              ) : (
                payments.map((item, idx) => (
                  <View key={item._id}>
                    <PaymentRow
                      item={item}
                      onConfirm={onConfirm}
                      busy={confirmingId === item._id}
                    />
                    {idx < payments.length - 1 && <View style={styles.divider} />}
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
    color: Palette.red,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.errorBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: Palette.red, lineHeight: 18 },

  // Filter bar
  // Horizontal ScrollView, not a plain row View — the filter set can exceed
  // screen width, and a non-scrolling row would just clip instead of reaching them.
  // flexGrow/flexShrink: 0 is required — ScrollView defaults to flexGrow: 1
  // (unlike View), so left alone it soaks up whatever vertical space the body
  // below doesn't use, stretching the bar's height into tall ovals.
  filterBar: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  filterBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },

  // Payment list
  list: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  rowIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowType: { fontSize: 14, fontWeight: '600', color: Palette.text },
  rowDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    letterSpacing: 0.2,
  },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowAmount: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Palette.gold,
  },
  confirmBtn: { marginTop: 4 },
  divider: { height: 1, backgroundColor: Palette.cardBorder, marginHorizontal: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
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
  bottomPad: { height: 20 },
});
