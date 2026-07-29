import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTransactionHistory, TransactionItem } from '../../api/spectatorApi';
import { isNetworkError } from '../../api/axios';
import { Fonts, Palette } from '@/constants/theme';
import { RefetchButton } from '@/components/RefetchButton';
import { NoConnectionState } from '@/components/NoConnectionState';
import { Badge, BadgeTone } from '@/components/ui/Badge';

// ─── Helpers (mirrors wallet.tsx) ─────────────────────────────────────────────

function formatViDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} Th${month}, ${d.getFullYear()} • ${hh}:${mm}`;
}

function txTypeLabel(type: TransactionItem['transactionType']): string {
  switch (type) {
    case 'reward':     return 'Prediction Reward';
    case 'deposit':    return 'Deposit';
    case 'withdrawal': return 'Withdrawal';
    case 'refund':     return 'Refund';
    default:           return type;
  }
}

function txIcon(type: TransactionItem['transactionType']): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'reward':     return 'trophy-outline';
    case 'deposit':    return 'arrow-down-circle-outline';
    case 'withdrawal': return 'arrow-up-circle-outline';
    case 'refund':     return 'refresh-circle-outline';
    default:           return 'swap-horizontal-outline';
  }
}

function txSign(item: TransactionItem): '+' | '-' {
  if (item.transactionType === 'withdrawal') return '-';
  return item.amount < 0 ? '-' : '+';
}

function txAmountColor(item: TransactionItem): string {
  if (item.transactionType === 'withdrawal') return Palette.red;
  if (item.transactionType === 'refund')     return Palette.gold;
  return item.amount < 0 ? Palette.red : Palette.green;
}

function txStatusTone(status: TransactionItem['status']): BadgeTone {
  if (status === 'completed') return 'green';
  if (status === 'failed')    return 'red';
  return 'amber';
}

function txStatusLabel(status: TransactionItem['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'failed')    return 'Failed';
  return 'Processing';
}

function TxRow({ item }: { item: TransactionItem }) {
  const sign = txSign(item);
  const amtColor = txAmountColor(item);

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconBg, { backgroundColor: `${amtColor}18` }]}>
        <Ionicons name={txIcon(item.transactionType)} size={20} color={amtColor} />
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txType}>{txTypeLabel(item.transactionType)}</Text>
        {item.description && (
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <Text style={styles.txDate}>{formatViDateTime(item.createdAt)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: amtColor }]}>
          {sign}{Math.abs(item.amount).toLocaleString()}
        </Text>
        <Badge label={txStatusLabel(item.status)} tone={txStatusTone(item.status)} />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await getTransactionHistory(1, PAGE_SIZE);
      setTransactions(result.transactions);
      setHasMore(result.meta.hasMore);
      setPage(1);
      setError(false);
    } catch (err) {
      if (isNetworkError(err)) setError(true);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    setLastUpdated(Date.now());
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setIsRefreshing(true); load(true); };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getTransactionHistory(nextPage, PAGE_SIZE);
      setTransactions((prev) => [...prev, ...result.transactions]);
      setHasMore(result.meta.hasMore);
      setPage(nextPage);
    } catch {
      // Silent — pagination failure just stops loading more; the user can
      // still retry via pull-to-refresh or the header retry button.
    }
    setIsLoadingMore(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={22} color={Palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>TRANSACTION HISTORY</Text>
          <RefetchButton onRefetch={() => load(true)} lastUpdated={lastUpdated} loading={isRefreshing} accentColor={Palette.gold} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : error ? (
          <NoConnectionState
            onRetry={() => load()}
            accentColor={Palette.gold}
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
                tintColor={Palette.gold}
              />
            }
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
                loadMore();
              }
            }}
            scrollEventThrottle={200}>

            <View style={styles.txList}>
              {transactions.length === 0 ? (
                <View style={styles.txEmpty}>
                  <Ionicons name="receipt-outline" size={36} color={Palette.textMuted} />
                  <Text style={styles.txEmptyText}>No transactions yet</Text>
                </View>
              ) : (
                transactions.map((item, idx) => (
                  <View key={item._id}>
                    <TxRow item={item} />
                    {idx < transactions.length - 1 && <View style={styles.txDivider} />}
                  </View>
                ))
              )}
            </View>

            {isLoadingMore && (
              <ActivityIndicator color={Palette.gold} size="small" style={styles.loadMoreSpinner} />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: Palette.gold,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  txList: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  txIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: { flex: 1, gap: 2 },
  txType: { fontSize: 14, fontWeight: '600', color: Palette.text },
  txDesc: { fontSize: 12, color: Palette.textMuted },
  txDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    letterSpacing: 0.2,
  },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  txDivider: { height: 1, backgroundColor: Palette.cardBorder, marginHorizontal: 14 },
  txEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  txEmptyText: { fontSize: 14, color: Palette.textMuted },

  loadMoreSpinner: { marginVertical: 12 },
  bottomPad: { height: 20 },
});
