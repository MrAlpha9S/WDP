import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
} as const;

type InviteStatus = 'pending' | 'new' | 'accepted' | 'declined';

interface Invite {
  id: string;
  horse: string;
  owner: string;
  tournament: string;
  raceDate: string | null;
  fee: string | null;
  status: InviteStatus;
}

const INITIAL_INVITES: Invite[] = [
  {
    id: '1',
    horse: 'Silver Streak',
    owner: 'Phạm Hoàng Nam',
    tournament: 'Grand Prix Derby',
    raceDate: '28 Th05, 2024',
    fee: '$12,500',
    status: 'pending',
  },
  {
    id: '2',
    horse: 'Golden Mane',
    owner: 'Lê Quang Minh',
    tournament: 'Royal Sprint',
    raceDate: null,
    fee: null,
    status: 'new',
  },
];

const SCHEDULE_DATA = [
  {
    date: 'HÔM NAY, 24 THÁNG 5',
    races: [
      {
        time: '14:30',
        period: 'PM',
        title: 'Vietnam National Cup',
        location: 'Trường đua Phú Thọ, TP.HCM',
        horse: 'MIDNIGHT STORM',
      },
    ],
  },
  {
    date: 'NGÀY MAI, 25 THÁNG 5',
    races: [
      {
        time: '09:00',
        period: 'AM',
        title: 'Vòng Loại Khu Vực',
        location: 'Trường đua Đại Nam, Bình Dương',
        horse: 'WIND WALKER',
      },
      {
        time: '16:15',
        period: 'PM',
        title: 'Sprint Invitational',
        location: 'Trường đua Phú Thọ, TP.HCM',
        horse: 'FLASH POINT',
      },
    ],
  },
];

export default function InvitesScreen() {
  const [invites, setInvites] = useState<Invite[]>(INITIAL_INVITES);

  const activeInvites = invites.filter((i) => i.status === 'pending' || i.status === 'new');

  const respond = (id: string, action: 'accepted' | 'declined') => {
    setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, status: action } : i)));
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>

          {/* ─── New Invites section ─── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Lời mời mới</Text>
            </View>
            {activeInvites.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{activeInvites.length} MỚI</Text>
              </View>
            )}
          </View>

          {invites.map((invite) => {
            if (invite.status === 'accepted' || invite.status === 'declined') return null;
            return (
              <View key={invite.id} style={styles.inviteCard}>
                {/* Horse header row */}
                <View style={styles.inviteTopRow}>
                  <View style={styles.horseThumbnail}>
                    <Ionicons name="flash" size={22} color={Palette.redLight} />
                  </View>
                  <View style={styles.inviteHorseInfo}>
                    <Text style={styles.inviteHorseLabel}>NGỰA ĐUA</Text>
                    <Text style={[
                      styles.inviteHorseName,
                      invite.status === 'new' && { color: Palette.gold },
                    ]}>
                      {invite.horse}
                    </Text>
                  </View>
                  {invite.status === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>CHỜ PHẢN HỒI</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inviteDivider} />

                {/* Details grid */}
                <View style={styles.inviteDetails}>
                  <View style={styles.inviteDetailRow}>
                    <View style={styles.inviteDetailCell}>
                      <Text style={styles.detailLabel}>Chủ ngựa</Text>
                      <Text style={styles.detailValue}>{invite.owner}</Text>
                    </View>
                    <View style={styles.inviteDetailCell}>
                      <Text style={styles.detailLabel}>Giải đấu</Text>
                      <Text style={styles.detailValue}>{invite.tournament}</Text>
                    </View>
                  </View>
                  {(invite.raceDate || invite.fee) && (
                    <View style={styles.inviteDetailRow}>
                      {invite.raceDate && (
                        <View style={styles.inviteDetailCell}>
                          <Text style={styles.detailLabel}>Ngày đua</Text>
                          <Text style={styles.detailValue}>{invite.raceDate}</Text>
                        </View>
                      )}
                      {invite.fee && (
                        <View style={styles.inviteDetailCell}>
                          <Text style={styles.detailLabel}>Phí thỏa thuận</Text>
                          <Text style={[styles.detailValue, { color: Palette.gold }]}>
                            {invite.fee}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Action buttons */}
                <View style={styles.inviteActions}>
                  <Pressable
                    style={styles.btnAccept}
                    onPress={() => respond(invite.id, 'accepted')}>
                    <Text style={styles.btnAcceptText}>CHẤP NHẬN</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnDecline}
                    onPress={() => respond(invite.id, 'declined')}>
                    <Text style={styles.btnDeclineText}>TỪ CHỐI</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {activeInvites.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={36} color={Palette.textMuted} />
              <Text style={styles.emptyText}>Không có lời mời mới</Text>
            </View>
          )}

          {/* ─── Upcoming schedule ─── */}
          {/* <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Lịch thi đấu</Text>
            </View>
            <Pressable hitSlop={8} style={styles.viewMonthBtn}>
              <Text style={styles.viewMonthText}>XEM THÁNG</Text>
              <Ionicons name="calendar-outline" size={14} color={Palette.textMuted} />
            </Pressable>
          </View>

          {SCHEDULE_DATA.map((group) => (
            <View key={group.date}>
              <View style={styles.dateChip}>
                <Text style={styles.dateChipText}>{group.date}</Text>
              </View>
              {group.races.map((race, i) => (
                <View key={i} style={styles.raceCard}>
                  <View style={styles.raceTimeCol}>
                    <Text style={styles.raceTime}>{race.time}</Text>
                    <Text style={styles.racePeriod}>{race.period}</Text>
                  </View>
                  <View style={styles.raceInfo}>
                    <Text style={styles.raceTitle}>{race.title}</Text>
                    <View style={styles.raceLocationRow}>
                      <Ionicons name="location-outline" size={12} color={Palette.textMuted} />
                      <Text style={styles.raceLocation} numberOfLines={1}>
                        {race.location}
                      </Text>
                    </View>
                    <View style={styles.raceTags}>
                      <View style={styles.tagHorse}>
                        <Text style={styles.tagHorseText}>{race.horse}</Text>
                      </View>
                      <View style={styles.tagConfirmed}>
                        <Text style={styles.tagConfirmedText}>ĐÃ XÁC NHẬN</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.bottomPad} /> */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },

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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Palette.gold,
  },
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

  // Invite card
  inviteCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  inviteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
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
  inviteHorseInfo: { flex: 1 },
  inviteHorseLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
    marginBottom: 3,
  },
  inviteHorseName: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 0.3,
  },
  pendingBadge: {
    backgroundColor: 'transparent',
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
  inviteDivider: {
    height: 1,
    backgroundColor: Palette.cardBorder,
  },
  inviteDetails: { gap: 10 },
  inviteDetailRow: { flexDirection: 'row', gap: 12 },
  inviteDetailCell: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    color: Palette.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.text,
  },

  // Buttons
  inviteActions: {
    flexDirection: 'row',
    gap: 10,
  },
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
    backgroundColor: 'transparent',
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

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Palette.textMuted,
  },

  // Schedule section (reused from schedule.tsx)
  viewMonthBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewMonthText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  dateChipText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
  },
  raceCard: {
    flexDirection: 'row',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderLeftWidth: 3,
    borderLeftColor: Palette.red,
    padding: 16,
    gap: 16,
    marginBottom: 12,
  },
  raceTimeCol: { alignItems: 'center', minWidth: 52 },
  raceTime: {
    fontFamily: Fonts.mono,
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  racePeriod: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    letterSpacing: 0.5,
  },
  raceInfo: { flex: 1, gap: 6 },
  raceTitle: { fontSize: 15, fontWeight: '700', color: Palette.text },
  raceLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  raceLocation: { fontSize: 12, color: Palette.textMuted, flex: 1 },
  raceTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tagHorse: {
    backgroundColor: '#2A2020',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagHorseText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.redLight,
  },
  tagConfirmed: {
    backgroundColor: '#1A2A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A4A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagConfirmedText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#6CBA7A',
  },

  bottomPad: { height: 20 },
});
