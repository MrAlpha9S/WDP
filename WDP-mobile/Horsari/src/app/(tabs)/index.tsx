import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

const CHART_MAX_H = 90;

const CHART_DATA = [
  { month: 'Th4', ratio: 0.65 },
  { month: 'Th5', ratio: 0.78 },
  { month: 'Th6', ratio: 0.55 },
  { month: 'Th7', ratio: 1.0 },
  { month: 'Th8', ratio: 0.72 },
];

const ACHIEVEMENTS = [
  { iconName: 'trophy-outline' as const, label: 'Cúp Vàng Derby', year: '2023' },
  { iconName: 'speedometer-outline' as const, label: 'Ký Lục Tốc Độ', year: '2024' },
  { iconName: 'star-outline' as const, label: 'Jockey Của Năm', year: '2023' },
  { iconName: 'ribbon-outline' as const, label: '100 Trận Thắng', year: '2022' },
];

export default function DashboardScreen() {
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
          <Text style={styles.headerTitle}>TRANG CHỦ</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>

          {/* ─── Welcome ─── */}
          <Text style={styles.welcomeSub}>CHÀO MỪNG TRỞ LẠI,</Text>
          <Text style={styles.welcomeTitle}>Bảng Điều Khiển</Text>

          {/* ─── Stats Grid ─── */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statAccentRed]}>
                <Text style={styles.statLabel}>TỶ LỆ THẮNG</Text>
                <Text style={[styles.statValue, { color: Palette.redLight }]}>78%</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TỔNG SỐ TRẬN</Text>
                <Text style={styles.statValue}>142</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>THU NHẬP</Text>
                <Text style={[styles.statValue, { color: Palette.gold }]}>$1.2M</Text>
              </View>
              <View style={[styles.statCard, styles.statAccentGold]}>
                <Text style={styles.statLabel}>XẾP HẠNG</Text>
                <Text style={[styles.statValue, { color: Palette.gold }]}>#5 ELITE</Text>
              </View>
            </View>
          </View>

          {/* ─── Next Race ─── */}
          <View style={styles.raceCard}>
            <LinearGradient
              colors={['#2A1215', '#1C1A10', '#0E1018']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.raceGradient}>
              <View style={styles.raceBadge}>
                <Text style={styles.raceBadgeText}>TRẬN ĐẤU TIẾP THEO</Text>
              </View>
              <View style={styles.raceBody}>
                <View style={styles.raceLeft}>
                  <Text style={styles.raceName}>MIDNIGHT{'\n'}STORM</Text>
                  <View style={styles.raceLocationRow}>
                    <Ionicons name="location-outline" size={12} color={Palette.textMuted} />
                    <Text style={styles.raceLocationText} numberOfLines={1}>
                      Trường đua Churchill Downs, Louisville
                    </Text>
                  </View>
                </View>
                <View style={styles.raceRight}>
                  <Text style={styles.raceTimerLabel}>KHỞI TRANH TRONG</Text>
                  <Text style={styles.raceTimer}>02:45:10</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ─── Performance Chart ─── */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Xu Hướng Hiệu Suất</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendDot} />
                <Text style={styles.legendLabel}>Thu Nhập Hàng Tháng</Text>
              </View>
            </View>

            <View style={styles.chartArea}>
              {CHART_DATA.map((item) => (
                <View key={item.month} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: item.ratio * CHART_MAX_H,
                          backgroundColor: item.ratio >= 1 ? Palette.redLight : '#6B3840',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.month}</Text>
                </View>
              ))}
            </View>

            <View style={styles.chartDivider} />

            <View style={styles.chartSummary}>
              <View>
                <Text style={styles.summaryLabel}>Tốt nhất</Text>
                <Text style={styles.summaryValue}>+$240K</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>Trung bình</Text>
                <Text style={styles.summaryValue}>+$185K</Text>
              </View>
            </View>
          </View>

          {/* ─── Recent Achievements ─── */}
          <View style={styles.achievementsSection}>
            <View style={styles.achievementsHeader}>
              <Text style={styles.achievementsTitle}>THÀNH TỰU GẦN ĐÂY</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.seeAllLink}>XEM TẤT CẢ</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsList}>
              {ACHIEVEMENTS.map((item, i) => (
                <View key={i} style={styles.achievementItem}>
                  <View style={styles.achievementIconBg}>
                    <Ionicons name={item.iconName} size={26} color={Palette.gold} />
                  </View>
                  <Text style={styles.achievementLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                  <Text style={styles.achievementYear}>{item.year}</Text>
                </View>
              ))}
            </ScrollView>
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

  // Header
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

  // Scroll
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Welcome
  welcomeSub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Palette.red,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 20,
  },

  // Stats Grid
  statsGrid: { gap: 12, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 6,
  },
  statAccentRed: {
    borderLeftWidth: 3,
    borderLeftColor: Palette.red,
  },
  statAccentGold: {
    borderColor: Palette.gold,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 0.5,
  },

  // Race Card
  raceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 20,
  },
  raceGradient: { padding: 20 },
  raceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.redLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  raceBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#1A0608',
  },
  raceBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  raceLeft: { flex: 1 },
  raceName: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.text,
    letterSpacing: 1,
    lineHeight: 26,
    marginBottom: 10,
  },
  raceLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raceLocationText: {
    fontSize: 11,
    color: Palette.textMuted,
    flex: 1,
  },
  raceRight: { alignItems: 'flex-end' },
  raceTimerLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  raceTimer: {
    fontFamily: Fonts.mono,
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 1,
  },

  // Chart
  chartCard: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.redLight,
  },
  legendLabel: { fontSize: 11, color: Palette.textMuted },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_MAX_H + 24,
    gap: 8,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    height: CHART_MAX_H,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Palette.textMuted,
    marginTop: 6,
  },
  chartDivider: {
    height: 1,
    backgroundColor: Palette.cardBorder,
    marginVertical: 16,
  },
  chartSummary: { flexDirection: 'row', gap: 32 },
  summaryLabel: { fontSize: 12, color: Palette.textMuted, marginBottom: 2 },
  summaryValue: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '700',
    color: '#6CBA7A',
  },

  // Achievements
  achievementsSection: { marginBottom: 8 },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsTitle: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.text,
  },
  seeAllLink: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.gold,
  },
  achievementsList: { gap: 12, paddingRight: 4 },
  achievementItem: { width: 100, alignItems: 'center', gap: 8 },
  achievementIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
    lineHeight: 15,
  },
  achievementYear: { fontSize: 11, color: Palette.textMuted },

  bottomPad: { height: 20 },
});
