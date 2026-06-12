import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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
  redLight: '#E8828A',
  gold: '#C9A24B',
} as const;

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
        confirmed: true,
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
        confirmed: true,
      },
      {
        time: '16:15',
        period: 'PM',
        title: 'Sprint Invitational',
        location: 'Trường đua Phú Thọ, TP.HCM',
        horse: 'FLASH POINT',
        confirmed: true,
      },
    ],
  },
];

export default function ScheduleScreen() {
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
          <Text style={styles.headerTitle}>LỊCH TRÌNH ĐUA</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>

          {/* ─── Section header ─── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Lịch thi đấu</Text>
            </View>
            <Pressable hitSlop={8} style={styles.viewMonthBtn}>
              <Text style={styles.viewMonthText}>XEM THÁNG</Text>
              <Ionicons name="calendar-outline" size={14} color={Palette.textMuted} />
            </Pressable>
          </View>

          {/* ─── Race groups ─── */}
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
                      {race.confirmed && (
                        <View style={styles.tagConfirmed}>
                          <Text style={styles.tagConfirmedText}>ĐÃ XÁC NHẬN</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* ─── Info notice ─── */}
          <View style={styles.infoNotice}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Palette.redLight}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Hãy đảm bảo bạn có mặt tại trường đua ít nhất 2 tiếng trước khi bắt đầu để kiểm tra
              sức khỏe và thiết bị.
            </Text>
          </View>

          <View style={styles.bottomPad} />
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

  raceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
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

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: '#1A1214',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A1A1C',
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Palette.textMuted,
  },

  bottomPad: { height: 20 },
});
