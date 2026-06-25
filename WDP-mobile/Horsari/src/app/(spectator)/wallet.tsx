import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  depositPoints,
  getTransactionHistory,
  getWalletInfo,
  getSpectatorProfile,
  TransactionItem,
  WalletInfo,
} from '../../api/spectatorApi';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  redDark: '#8C1620',
  gold: '#C9A24B',
  goldDark: '#1E1A0A',
  green: '#22C55E',
  sheet: '#1A1A1C',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    case 'reward':     return 'Thưởng dự đoán';
    case 'deposit':    return 'Nạp điểm';
    case 'withdrawal': return 'Rút điểm';
    case 'refund':     return 'Hoàn điểm';
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

function txSign(type: TransactionItem['transactionType']): '+' | '-' {
  return type === 'withdrawal' ? '-' : '+';
}

function txAmountColor(type: TransactionItem['transactionType']): string {
  if (type === 'withdrawal') return Palette.red;
  if (type === 'refund')     return Palette.gold;
  return Palette.green;
}

function txStatusColor(status: TransactionItem['status']): string {
  if (status === 'completed') return Palette.green;
  if (status === 'failed')    return Palette.red;
  return Palette.gold;
}

function txStatusLabel(status: TransactionItem['status']): string {
  if (status === 'completed') return 'Thành công';
  if (status === 'failed')    return 'Thất bại';
  return 'Đang xử lý';
}

function formatPoints(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ item }: { item: TransactionItem }) {
  const sign = txSign(item.transactionType);
  const amtColor = txAmountColor(item.transactionType);

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
          {sign}{item.amount.toLocaleString()}
        </Text>
        <View style={[styles.txStatusBadge, { borderColor: `${txStatusColor(item.status)}44` }]}>
          <Text style={[styles.txStatusText, { color: txStatusColor(item.status) }]}>
            {txStatusLabel(item.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Deposit/Withdraw Modal ───────────────────────────────────────────────────

type ModalMode = 'deposit' | 'withdraw';

function PointsModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: ModalMode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isDeposit = mode === 'deposit';
  const title = isDeposit ? 'NẠP ĐIỂM' : 'RÚT ĐIỂM';
  const accentColor = isDeposit ? Palette.gold : Palette.red;

  const handleSubmit = async () => {
    const num = parseInt(amount.replace(/\D/g, ''), 10);
    if (!num || num <= 0) { setErr('Số điểm phải lớn hơn 0'); return; }
    setBusy(true);
    setErr(null);
    const result = isDeposit
      ? await depositPoints(num)
      : await depositPoints(num); // withdrawPoints would go here if separated
    if (result.ok) {
      onSuccess();
      onClose();
    } else {
      setErr(result.message);
    }
    setBusy(false);
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.modal}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: accentColor }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={20} color={Palette.textMuted} />
          </Pressable>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.inputLabel}>Số điểm</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Nhập số điểm..."
              placeholderTextColor={Palette.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={styles.inputUnit}>POINT</Text>
          </View>

          {err && (
            <View style={styles.errRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Palette.red} />
              <Text style={styles.errText}>{err}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submitBtn, { backgroundColor: accentColor }, busy && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={busy}>
            {busy
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={styles.submitBtnText}>{title}</Text>
            }
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalMode | null>(null);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [w, txData, profile] = await Promise.all([
      getWalletInfo(),
      getTransactionHistory(1, 20),
      getSpectatorProfile(),
    ]);
    setWallet(w);
    setTransactions(txData.transactions);
    if (profile) setWinRate(profile.stats.winRate);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setIsRefreshing(true); load(true); };
  const onModalSuccess = () => load(true);

  const rewardPoints = wallet?.spectator.wallet ?? 0;
  const totalEarned = wallet?.stats.totalEarned ?? 0;

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
          <Text style={styles.headerTitle}>VÍ ĐIỂM THƯỞNG</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
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
            }>

            {/* ─── Balance Card ─── */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['#2A1820', '#161220', '#0E0E18']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.balanceLabel}>SỐ DƯ HIỆN TẠI</Text>
              <Text style={styles.balanceValue}>
                {rewardPoints.toLocaleString()} POINT
              </Text>
              <View style={styles.balanceActions}>
                <Pressable style={styles.btnDeposit} onPress={() => setModal('deposit')}>
                  <Ionicons name="add-circle-outline" size={16} color="#FFF" />
                  <Text style={styles.btnDepositText}>NẠP ĐIỂM</Text>
                </Pressable>
                <Pressable style={styles.btnWithdraw} onPress={() => setModal('withdraw')}>
                  <Ionicons name="arrow-up-circle-outline" size={16} color={Palette.textMuted} />
                  <Text style={styles.btnWithdrawText}>RÚT ĐIỂM</Text>
                </Pressable>
              </View>
            </View>

            {/* ─── Stats Row ─── */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="bar-chart-outline" size={20} color={Palette.gold} />
                <Text style={styles.statLabel}>TỔNG THU</Text>
                <Text style={[styles.statValue, { color: Palette.gold }]}>
                  {formatPoints(totalEarned)} POINT
                </Text>
              </View>
              {winRate !== null && (
                <View style={styles.statCard}>
                  <Ionicons name="star-outline" size={20} color={Palette.green} />
                  <Text style={styles.statLabel}>TỶ LỆ THẮNG</Text>
                  <Text style={[styles.statValue, { color: Palette.green }]}>
                    {winRate.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>

            {/* ─── Transaction History ─── */}
            <View style={styles.txHeader}>
              <View style={styles.txTitleRow}>
                <View style={styles.txAccent} />
                <Text style={styles.txTitle}>Lịch sử giao dịch</Text>
              </View>
              {transactions.length > 0 && (
                <Pressable hitSlop={8}>
                  <Text style={styles.txViewAll}>Xem tất cả</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.txList}>
              {transactions.length === 0 ? (
                <View style={styles.txEmpty}>
                  <Ionicons name="receipt-outline" size={36} color={Palette.textMuted} />
                  <Text style={styles.txEmptyText}>Chưa có giao dịch nào</Text>
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

            <View style={styles.bottomPad} />
          </ScrollView>
        )}
      </SafeAreaView>

      {modal && (
        <PointsModal
          mode={modal}
          onClose={() => setModal(null)}
          onSuccess={onModalSuccess}
        />
      )}
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
    color: Palette.gold,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Balance card
  balanceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A2030',
    padding: 24,
    marginBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Palette.textMuted,
  },
  balanceValue: {
    fontFamily: Fonts.mono,
    fontSize: 28,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  btnDeposit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    backgroundColor: Palette.red,
    borderRadius: 12,
  },
  btnDepositText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FFF',
  },
  btnWithdraw: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  btnWithdrawText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Palette.textMuted,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  statValue: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Transaction list
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txAccent: { width: 4, height: 20, borderRadius: 2, backgroundColor: Palette.gold },
  txTitle: { fontSize: 17, fontWeight: '700', color: Palette.text },
  txViewAll: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.gold,
  },

  txList: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
    marginBottom: 20,
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
  txStatusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  txStatusText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  txDivider: { height: 1, backgroundColor: Palette.cardBorder, marginHorizontal: 14 },
  txEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  txEmptyText: { fontSize: 14, color: Palette.textMuted },

  bottomPad: { height: 20 },

  // Modal
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Palette.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Palette.cardBorder,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3F',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262629',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  inputLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  inputUnit: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textMuted,
    paddingRight: 16,
  },
  errRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A1215',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5C1A1F',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errText: { flex: 1, fontSize: 13, color: '#FF6B6B' },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#FFF',
  },
  btnDisabled: { opacity: 0.5 },
});
