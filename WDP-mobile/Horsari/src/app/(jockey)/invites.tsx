import { Ionicons } from '@expo/vector-icons';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMyInvitations,
  InvitationItem,
  respondToInvitation,
} from '../../api/jockeyApi';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  red: '#C81E2E',
  redDark: '#8C1620',
  redLight: '#E8828A',
  gold: '#C9A24B',
  green: '#22C55E',
  sheet: '#1A1A1C',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function formatViDateTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} — ${d.getDate()} Th${String(d.getMonth() + 1).padStart(2, '0')}, ${d.getFullYear()}`;
}

function formatFee(minFee: number | undefined, pct: number | undefined): string | null {
  if (minFee && minFee > 0) return `$${minFee.toLocaleString()}`;
  if (pct && pct > 0) return `${pct}%`;
  return null;
}

// ─── Status colour helper (shared by card + sheet) ───────────────────────────

function getStatusStyle(inv: InvitationItem): { color: string; label: string } {
  if (inv.invitationStatus === 'declined')  return { color: Palette.red,     label: 'Đã từ chối'   };
  if (inv.invitationStatus === 'accepted')  return { color: '#22C55E',        label: 'Đã chấp nhận' };
  if (inv.invitationStatus === 'cancelled') return { color: Palette.textMuted, label: 'Đã hủy'      };
  // pending
  if (inv.jockeyConfirmation) return { color: '#22C55E', label: 'Đã đồng ý'    };
  return                               { color: Palette.gold, label: 'Chờ phản hồi' };
}

// ─── Detail sheet row ─────────────────────────────────────────────────────────

function SheetRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.sheetRow}>
      <Text style={styles.sheetRowLabel}>{label}</Text>
      <Text style={[styles.sheetRowValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sheetSection}>
      <View style={styles.sheetSectionHeader}>
        <View style={styles.sheetSectionAccent} />
        <Text style={styles.sheetSectionTitle}>{title}</Text>
      </View>
      <View style={styles.sheetSectionBody}>{children}</View>
    </View>
  );
}

// ─── Detail bottom sheet ──────────────────────────────────────────────────────

function InviteDetailSheet({
  invite,
  respondingId,
  onClose,
  onRespond,
}: {
  invite: InvitationItem;
  respondingId: string | null;
  onClose: () => void;
  onRespond: (id: string, action: 'accepted' | 'rejected') => void;
}) {
  const busy = respondingId === invite.invitationId;
  const statusStyle = getStatusStyle(invite);

  const registrationStatusLabel: Record<string, string> = {
    pending: 'Đang chờ',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.sheetHandle} />

        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {invite.horse?.horseName ?? 'Chi tiết lời mời'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {invite.tournament?.tournamentName ?? ''}
            </Text>
          </View>
          <Pressable style={styles.sheetCloseBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={Palette.textMuted} />
          </Pressable>
        </View>

        {/* Status badge row */}
        <View style={styles.sheetStatusRow}>
          <View style={[styles.pendingBadge, { borderColor: `${statusStyle.color}66`, backgroundColor: `${statusStyle.color}18` }]}>
            <Text style={[styles.pendingBadgeText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
          {/* <View style={[
            styles.confirmBadge,
            invite.ownerConfirmation ? styles.confirmBadgeGreen : styles.confirmBadgeGray,
          ]}>
            <Ionicons
              name={invite.ownerConfirmation ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={invite.ownerConfirmation ? '#22C55E' : Palette.textMuted}
            />
            <Text style={[
              styles.confirmBadgeText,
              invite.ownerConfirmation ? { color: '#22C55E' } : { color: Palette.textMuted },
            ]}>
              {invite.ownerConfirmation ? 'Chủ ngựa đã xác nhận' : 'Chờ chủ ngựa'}
            </Text>
          </View> */}
        </View>

        <ScrollView
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}>

          {/* ── Ngựa ── */}
          {invite.horse && (
            <SheetSection title="THÔNG TIN NGỰA">
              <SheetRow label="Tên ngựa" value={invite.horse.horseName} />
              <SheetRow label="Giống" value={invite.horse.breed ?? '—'} />
              <SheetRow label="Giới tính" value={invite.horse.gender === 'male' ? 'Đực' : invite.horse.gender === 'female' ? 'Cái' : '—'} />
            </SheetSection>
          )}

          {/* ── Vòng đua ── */}
          {invite.raceRound && (
            <SheetSection title="VÒNG ĐUA">
              <SheetRow label="Tên vòng" value={invite.raceRound.roundName} />
              <SheetRow
                label="Ngày đua"
                value={formatViDateTime(invite.raceRound.raceDate) ?? '—'}
              />
              <SheetRow label="Địa điểm" value={invite.raceRound.location ?? '—'} />
              <SheetRow label="Mặt đường" value={invite.raceRound.raceGround ?? '—'} />
              <SheetRow
                label="Cự ly"
                value={invite.raceRound.trackLength ? `${invite.raceRound.trackLength} m` : '—'}
              />
              <SheetRow label="Trạng thái" value={invite.raceRound.status === 'draft' ? 'Nháp' : invite.raceRound.status === 'scheduled' ? 'Đã lên lịch' : invite.raceRound.status === 'running' ? 'Đang diễn ra' : invite.raceRound.status === 'completed' ? 'Đã hoàn thành' : invite.raceRound.status === 'cancelled' ? 'Đã hủy' : '—'} />
              {(invite.raceRound.minimalRidingFees ?? 0) > 0 && (
                <SheetRow
                  label="Phí tối thiểu"
                  value={`$${invite.raceRound.minimalRidingFees!.toLocaleString()}`}
                  valueColor={Palette.gold}
                />
              )}
            </SheetSection>
          )}

          {/* ── Giải đấu ── */}
          {invite.tournament && (
            <SheetSection title="GIẢI ĐẤU">
              <SheetRow label="Tên giải" value={invite.tournament.tournamentName} />
              {/* {invite.tournament.tournamentId && (
                <SheetRow label="ID giải" value={String(invite.tournament.tournamentId)} />
              )} */}
            </SheetSection>
          )}

          {/* ── Chủ ngựa ── */}
          {invite.horseOwner && (
            <SheetSection title="CHỦ NGỰA">
              <SheetRow label="Họ tên" value={invite.horseOwner.user?.fullName ?? '—'} />
              <SheetRow label="Số điện thoại" value={invite.horseOwner.user?.phoneNumber ?? '—'} />
            </SheetSection>
          )}

          {/* ── Đăng ký ── */}
          <SheetSection title="ĐĂNG KÝ">
            <SheetRow
              label="Vai trò"
              value={invite.isBackup ? 'Dự phòng' : 'Chính thức'}
            //   valueColor={invite.isBackup ? Palette.gold : Palette.green}
            />
            {invite.registration && (
              <>
                <SheetRow
                  label="Trạng thái đăng ký"
                  value={registrationStatusLabel[invite.registration.registrationStatus] ?? invite.registration.registrationStatus ?? '—'}
                />
                <SheetRow
                  label="Ngày đăng ký"
                  value={formatViDateTime(invite.registration.registeredAt) ?? '—'}
                />
              </>
            )}
          </SheetSection>

          {/* ── Thù lao ── */}
          <SheetSection title="QUYỀN LỢI">
            {(invite.percentagePayout ?? 0) > 0 && (
              <SheetRow
                label="Tỷ lệ thưởng"
                value={`${invite.percentagePayout}%`}
                valueColor={Palette.gold}
              />
            )}
            {/* {(invite.raceRound?.minimalRidingFees ?? 0) > 0 && (
              <SheetRow
                label="Phí cưỡi tối thiểu"
                value={`$${invite.raceRound!.minimalRidingFees!.toLocaleString()}`}
                valueColor={Palette.gold}
              />
            )} */}
            {(invite.percentagePayout ?? 0) === 0 && (invite.raceRound?.minimalRidingFees ?? 0) === 0 && (
              <SheetRow label="Thù lao" value="Chưa xác định" />
            )}
          </SheetSection>

        </ScrollView>

        {/* Action buttons — only for actionable (pending, not yet responded) invitations */}
        {invite.invitationStatus === 'pending' && !invite.jockeyConfirmation && (
          <View style={styles.sheetActions}>
            <Pressable
              style={[styles.sheetBtnDecline, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => onRespond(invite.invitationId, 'rejected')}>
              <Text style={styles.sheetBtnDeclineText}>TỪ CHỐI</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetBtnAccept, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => onRespond(invite.invitationId, 'accepted')}>
              {busy ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.sheetBtnAcceptText}>CHẤP NHẬN</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterKey = 'pending' | 'confirmed' | 'declined';

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'pending',   label: 'Chờ phản hồi', color: Palette.gold },
  { key: 'confirmed', label: 'Đã đồng ý',    color: Palette.green },
  { key: 'declined',  label: 'Đã từ chối',   color: Palette.red  },
];

function applyFilter(all: InvitationItem[], filter: FilterKey): InvitationItem[] {
  switch (filter) {
    case 'pending':
      return all.filter((i) => i.invitationStatus === 'pending' && !i.jockeyConfirmation);
    case 'confirmed':
      return all.filter((i) => i.jockeyConfirmation === true);
    case 'declined':
      return all.filter((i) => i.invitationStatus === 'declined');
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InvitesScreen() {
  const [allInvites, setAllInvites] = useState<InvitationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<InvitationItem | null>(null);

  const invites = applyFilter(allInvites, activeFilter);

  const countFor = (key: FilterKey) => applyFilter(allInvites, key).length;

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await getMyInvitations();
      setAllInvites(data);
    } catch {
      setError('Không thể tải lời mời. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    load(true);
  };

  const respond = async (id: string, action: 'accepted' | 'rejected') => {
    setRespondingId(id);
    // Optimistic: update local state so item moves to the right tab immediately
    setAllInvites((prev: InvitationItem[]) =>
      prev.map((i: InvitationItem) =>
        i.invitationId !== id
          ? i
          : action === 'accepted'
            ? { ...i, jockeyConfirmation: true }
            : { ...i, invitationStatus: 'declined' as const }
      )
    );

    const result = await respondToInvitation(id, action);

    if (!result.ok) {
      setError(result.message);
      load(true); // rollback
    } else {
      setSelectedInvite((cur) => (cur?.invitationId === id ? null : cur));
      // Switch to the relevant tab so the user sees the result
      setActiveFilter(action === 'accepted' ? 'confirmed' : 'declined');
    }
    setRespondingId(null);
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
          <Text style={styles.headerTitle}>LỜI MỜI</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        {/* ─── Filter bar ─── */}
        <View style={styles.filterBar}>
          {FILTERS.map(({ key, label, color }) => {
            const count = countFor(key);
            const active = activeFilter === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.filterPill,
                  active && { borderColor: color, backgroundColor: `${color}1A` },
                ]}
                onPress={() => setActiveFilter(key)}>
                <Text style={[styles.filterPillText, active && { color }]}>
                  {label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterCount, active && { backgroundColor: color }]}>
                    <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ─── Body ─── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.red} size="large" />
          </View>
        ) : error && invites.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={40} color={Palette.textMuted} />
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>THỬ LẠI</Text>
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

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>
                  {FILTERS.find((f) => f.key === activeFilter)?.label ?? ''}
                </Text>
              </View>
              {invites.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{invites.length}</Text>
                </View>
              )}
            </View>

            {invites.map((invite) => {
              const horse = invite.horse?.horseName ?? 'Ngựa không xác định';
              const owner = invite.horseOwner?.user?.fullName ?? '—';
              const tournament = invite.tournament?.tournamentName ?? '—';
              const raceDate = formatViDate(invite.raceRound?.raceDate);
              const fee = formatFee(invite.raceRound?.minimalRidingFees, invite.percentagePayout);
              const isResponding = respondingId === invite.invitationId;

              const { color: statusColor, label: statusText } = getStatusStyle(invite);

              return (
                <View key={invite.invitationId} style={[
                  styles.inviteCard,
                  invite.isBackup ? styles.inviteCardBackup : styles.inviteCardOfficial,
                ]}>
                  {/* Left accent stripe — gold for backup, green for official */}
                  <View style={invite.isBackup ? styles.backupStripe : styles.officialStripe} />

                  {/* Tappable area → opens detail sheet */}
                  <Pressable
                    onPress={() => setSelectedInvite(invite)}
                    style={styles.inviteCardTouchable}>

                    <View style={styles.inviteTopRow}>
                      <View style={[
                        styles.horseThumbnail,
                        invite.isBackup ? styles.horseThumbnailBackup : styles.horseThumbnailOfficial,
                      ]}>
                        <Ionicons
                          name={invite.isBackup ? 'shield-half-outline' : 'ribbon-outline'}
                          size={22}
                          color={invite.isBackup ? Palette.gold : Palette.green}
                        />
                      </View>
                      <View style={styles.inviteHorseInfo}>
                        <View style={styles.horseLabelRow}>
                          <Text style={styles.inviteHorseLabel}>NGỰA ĐUA</Text>
                          {invite.isBackup ? (
                            <View style={styles.backupChip}>
                              <Ionicons name="shield-outline" size={9} color={'#6B7280'} />
                              <Text style={styles.backupChipText}>DỰ PHÒNG</Text>
                            </View>
                          ) : (
                            <View style={styles.officialChip}>
                              <Ionicons name="checkmark-circle-outline" size={9} color={'#0D9488'} />
                              <Text style={styles.officialChipText}>CHÍNH THỨC</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.inviteHorseName} numberOfLines={1}>{horse}</Text>
                      </View>
                      <View style={[styles.pendingBadge, {
                        borderColor: `${statusColor}66`,
                        backgroundColor: `${statusColor}18`,
                      }]}>
                        <Text style={[styles.pendingBadgeText, { color: statusColor }]}>
                          {statusText.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.inviteDivider} />

                    <View style={styles.inviteDetails}>
                      <View style={styles.inviteDetailRow}>
                        <View style={styles.inviteDetailCell}>
                          <Text style={styles.detailLabel}>Chủ ngựa</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>{owner}</Text>
                        </View>
                        <View style={styles.inviteDetailCell}>
                          <Text style={styles.detailLabel}>Giải đấu</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>{tournament}</Text>
                        </View>
                      </View>
                      {(raceDate || fee) && (
                        <View style={styles.inviteDetailRow}>
                          {raceDate && (
                            <View style={styles.inviteDetailCell}>
                              <Text style={styles.detailLabel}>Ngày đua</Text>
                              <Text style={styles.detailValue}>{raceDate}</Text>
                            </View>
                          )}
                          {fee && (
                            <View style={styles.inviteDetailCell}>
                              <Text style={styles.detailLabel}>Phí / Thưởng</Text>
                              <Text style={[styles.detailValue, { color: Palette.gold }]}>{fee}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Detail hint */}
                    <View style={styles.detailHint}>
                      <Text style={styles.detailHintText}>Xem chi tiết</Text>
                      <Ionicons name="chevron-forward" size={13} color={Palette.textMuted} />
                    </View>
                  </Pressable>

                  {/* Action buttons — only shown on the pending tab */}
                  {activeFilter === 'pending' && (
                    <View style={styles.inviteActions}>
                      <Pressable
                        style={[styles.btnAccept, isResponding && styles.btnDisabled]}
                        disabled={isResponding}
                        onPress={() => respond(invite.invitationId, 'accepted')}>
                        {isResponding ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.btnAcceptText}>CHẤP NHẬN</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={[styles.btnDecline, isResponding && styles.btnDisabled]}
                        disabled={isResponding}
                        onPress={() => respond(invite.invitationId, 'rejected')}>
                        <Text style={styles.btnDeclineText}>TỪ CHỐI</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}

            {invites.length === 0 && !error && (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={36} color={Palette.textMuted} />
                <Text style={styles.emptyText}>Không có lời mời mới</Text>
              </View>
            )}

            <View style={styles.bottomPad} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ─── Detail sheet ─── */}
      {selectedInvite && (
        <InviteDetailSheet
          invite={selectedInvite}
          respondingId={respondingId}
          onClose={() => setSelectedInvite(null)}
          onRespond={respond}
        />
      )}
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

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccent: { width: 4, height: 22, borderRadius: 2, backgroundColor: Palette.gold },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  countBadge: {
    backgroundColor: Palette.red,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.text,
  },

  inviteCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 16,
    overflow: 'hidden',
  },
  inviteCardBackup: {
    borderColor: `${'#6B7280'}55`,
  },
  backupStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#6B7280',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  inviteCardTouchable: { padding: 16, paddingLeft: 19, gap: 12 },
  inviteTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  horseThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2A1215',
    borderWidth: 1,
    borderColor: '#3A2225',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horseThumbnailBackup: {
    backgroundColor: 'rgba(201,162,75,0.1)',
    borderColor: `${'#6B7280'}55`,
  },
  horseLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  backupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#6B728022',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${'#6B7280'}55`,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  backupChipText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6B7280',
  },
  inviteCardOfficial: {
    borderColor: `${'#0D9488'}44`,
  },
  officialStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#0D9488',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  horseThumbnailOfficial: {
    backgroundColor: '#0D948822',
    borderColor: `${'#0D9488'}55`,
  },
  officialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0D948822',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${'#0D9488'}55`,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  officialChipText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#0D9488',
  },
  inviteHorseInfo: { flex: 1 },
  inviteHorseLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  inviteHorseName: { fontSize: 17, fontWeight: '800', color: Palette.text, letterSpacing: 0.3 },
  pendingBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.gold,
  },
  confirmedBadge: { borderColor: 'rgba(34,197,94,0.5)', backgroundColor: 'rgba(34,197,94,0.1)' },
  confirmedBadgeText: { color: '#22C55E' },
  declinedBadge: { borderColor: 'rgba(200,30,46,0.4)', backgroundColor: 'rgba(200,30,46,0.1)' },
  declinedBadgeText: { color: Palette.red },
  inviteDivider: { height: 1, backgroundColor: Palette.cardBorder },
  inviteDetails: { gap: 10 },
  inviteDetailRow: { flexDirection: 'row', gap: 12 },
  inviteDetailCell: { flex: 1 },
  detailLabel: { fontSize: 11, color: Palette.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '600', color: Palette.text },
  detailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: -4,
  },
  detailHintText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.textMuted,
    letterSpacing: 0.3,
  },

  inviteActions: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 0 },
  btnAccept: {
    flex: 1,
    height: 44,
    backgroundColor: Palette.red,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAcceptText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.text,
  },
  btnDecline: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeclineText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  btnDisabled: { opacity: 0.5 },

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

  // ─── Filter bar ───────────────────────────────────────────────────────────────
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
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 10, fontWeight: '800', color: Palette.textMuted },
  filterCountTextActive: { color: '#FFF' },

  // ─── Bottom sheet ────────────────────────────────────────────────────────────
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Palette.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Palette.cardBorder,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3F',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Palette.text, flex: 1 },
  sheetSubtitle: { fontSize: 12, color: Palette.gold, marginTop: 2 },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262629',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${'#6B7280'}66`,
    backgroundColor: '#6B728022',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backupBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6B7280',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D948866',
    backgroundColor: '#0D948822',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  officialBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#0D9488',
  },
  confirmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confirmBadgeGreen: {
    borderColor: 'rgba(34,197,94,0.4)',
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  confirmBadgeGray: {
    borderColor: Palette.cardBorder,
    backgroundColor: 'transparent',
  },
  confirmBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sheetScroll: { borderTopWidth: 1, borderTopColor: Palette.cardBorder },
  sheetScrollContent: { paddingBottom: 8 },

  sheetSection: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sheetSectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Palette.red,
  },
  sheetSectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMuted,
  },
  sheetSectionBody: {
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    overflow: 'hidden',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  sheetRowLabel: { fontSize: 13, color: Palette.textMuted, flex: 1 },
  sheetRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
    flex: 1.4,
    textAlign: 'right',
  },

  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorder,
  },
  sheetBtnDecline: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnDeclineText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  sheetBtnAccept: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: Palette.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnAcceptText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFF',
  },
});
