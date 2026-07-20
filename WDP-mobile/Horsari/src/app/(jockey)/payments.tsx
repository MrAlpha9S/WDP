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

import {
  confirmPaymentReceived,
  getMyPayments,
  PaymentEntity,
  PaymentStatus,
} from '../../api/jockeyApi';
import { useSocket } from '../../socket/SocketContext';
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

function paymentStatusColor(status: PaymentStatus): string {
  if (status === 'paid') return Palette.green;
  if (status === 'processing') return Palette.gold;
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
        <View style={[styles.statusBadge, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
          <Text style={[styles.statusText, { color }]}>{paymentStatusLabel(item.paymentStatus)}</Text>
        </View>
        {canConfirm && (
          <Pressable
            style={[styles.confirmBtn, busy && styles.btnDisabled]}
            disabled={busy}
            onPress={() => onConfirm(item._id)}>
            {busy ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>CONFIRM RECEIVED</Text>
            )}
          </Pressable>
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
        </View>

        {/* ─── Filter bar ─── */}
        <View style={styles.filterBar}>
          {FILTERS.map(({ key, label }) => {
            const active = activeFilter === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.filterPill,
                  active && { borderColor: Palette.gold, backgroundColor: `${Palette.gold}1A` },
                ]}
                onPress={() => setActiveFilter(key)}>
                <Text style={[styles.filterPillText, active && { color: Palette.gold }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ─── Body ─── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.red} size="large" />
          </View>
        ) : error && payments.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={40} color={Palette.textMuted} />
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>RETRY</Text>
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
                tintColor={Palette.red}
              />
            }>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={14} color="#FF6B6B" />
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
    backgroundColor: '#2A1215',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5C1A1F',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#FF6B6B', lineHeight: 18 },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: 'transparent',
  },
  filterPillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Palette.textMuted,
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
  statusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confirmBtn: {
    marginTop: 4,
    backgroundColor: Palette.red,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFF',
  },
  btnDisabled: { opacity: 0.5 },
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
