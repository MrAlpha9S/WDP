import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

const SKILLS = [
  { name: 'Speed Control', percent: 94, color: Palette.redLight },
  { name: 'Stamina Management', percent: 88, color: Palette.redLight },
  { name: 'Tactical Positioning', percent: 91, color: Palette.gold },
];

const TROPHIES = [
  { icon: 'trophy-outline' as const, name: "Royal Ascot '23" },
  { icon: 'medal-outline' as const, name: "Dubai Cup '24" },
  { icon: 'trophy-outline' as const, name: 'Triple Crown' },
];

export default function ProfileScreen() {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [biometricOn, setBiometricOn] = useState(false);

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
          <Text style={styles.headerTitle}>JOCKEY CENTRAL</Text>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={Palette.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>

          {/* ─── Hero card ─── */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#3A1A0A', '#1A1A2A', '#0A0A12']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBg}
            />
            <View style={styles.heroContent}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={44} color={Palette.textMuted} />
                </View>
                <View style={styles.avatarBadge}>
                  <Ionicons name="trophy" size={10} color={Palette.gold} />
                </View>
              </View>
              <Text style={styles.heroName}>Alexander Thorne</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroRank}>ELITE JOCKEY #5</Text>
                <View style={styles.heroDot} />
                <Ionicons name="globe-outline" size={13} color={Palette.textMuted} />
                <Text style={styles.heroCountry}>United Kingdom</Text>
              </View>
              <View style={styles.heroActions}>
                <Pressable style={styles.btnEditProfile}>
                  <Text style={styles.btnEditProfileText}>EDIT PROFILE</Text>
                </Pressable>
                <Pressable style={styles.btnJockeyBio}>
                  <Text style={styles.btnJockeyBioText}>VIEW JOCKEY BIO</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ─── Professional Stats ─── */}
          <Text style={styles.cardSectionTitle}>Professional Stats</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>CAREER WINS</Text>
              <Text style={[styles.statBig, { color: Palette.redLight }]}>1,248</Text>
              <Text style={styles.statSub}>+12 this month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL EARNINGS</Text>
              <Text style={[styles.statBig, { color: Palette.gold }]}>$14.2M</Text>
              <Text style={styles.statSub}>Top 2% Globally</Text>
            </View>
          </View>

          <View style={styles.placementCard}>
            <View style={styles.placementLeft}>
              <Text style={styles.statLabel}>AVERAGE PLACEMENT</Text>
              <View style={styles.placementValueRow}>
                <Text style={styles.placementBig}>2.4</Text>
                <Text style={styles.placementSub}>out of 12 starters</Text>
              </View>
            </View>
            <View style={styles.miniBars}>
              {[0.55, 0.85, 1.0].map((h, i) => (
                <View key={i} style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBar,
                      {
                        height: h * 32,
                        backgroundColor: i === 2 ? Palette.redLight : '#6B3840',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* ─── Skill Radar ─── */}
          <View style={styles.skillCard}>
            <View style={styles.skillCardHeader}>
              <Ionicons name="bar-chart-outline" size={16} color={Palette.redLight} />
              <Text style={styles.skillCardTitle}>Skill Radar</Text>
            </View>
            {SKILLS.map((skill) => (
              <View key={skill.name} style={styles.skillRow}>
                <View style={styles.skillLabelRow}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillPercent}>{skill.percent}%</Text>
                </View>
                <View style={styles.skillTrack}>
                  <View
                    style={[
                      styles.skillFill,
                      { width: `${skill.percent}%`, backgroundColor: skill.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* ─── Trophy Cabinet ─── */}
          <View style={styles.trophySection}>
            <View style={styles.trophyHeader}>
              <Text style={styles.cardSectionTitle}>Trophy Cabinet</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.viewAllLink}>VIEW ALL</Text>
              </Pressable>
            </View>
            <View style={styles.trophyGrid}>
              {TROPHIES.map((t, i) => (
                <View key={i} style={styles.trophyItem}>
                  <View style={styles.trophyIconBg}>
                    <Ionicons name={t.icon} size={28} color={Palette.gold} />
                  </View>
                  <Text style={styles.trophyName} numberOfLines={2}>{t.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── Account Settings ─── */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Account Settings</Text>

            <Pressable style={styles.settingsRow}>
              <Ionicons name="globe-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.settingsLabel}>Language</Text>
              <View style={styles.settingsRight}>
                <Text style={styles.settingsValue}>English</Text>
                <Ionicons name="chevron-forward" size={16} color={Palette.textMuted} />
              </View>
            </Pressable>

            <View style={styles.settingsDivider} />

            <View style={styles.settingsRow}>
              <Ionicons name="notifications-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.settingsLabel}>Notifications</Text>
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{ false: Palette.cardBorder, true: Palette.red }}
                thumbColor={Palette.text}
              />
            </View>

            <View style={styles.settingsDivider} />

            <View style={styles.settingsRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Palette.textMuted} />
              <Text style={styles.settingsLabel}>Biometric Login</Text>
              <Switch
                value={biometricOn}
                onValueChange={setBiometricOn}
                trackColor={{ false: Palette.cardBorder, true: Palette.red }}
                thumbColor={Palette.text}
              />
            </View>
          </View>

          {/* ─── Log out ─── */}
          <Pressable style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={Palette.red} />
            <Text style={styles.logoutText}>LOG OUT JOCKEY ACCOUNT</Text>
          </Pressable>

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

  // Hero card
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: 24,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E1E24',
    borderWidth: 2,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2A2010',
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: 0.3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroRank: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.gold,
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.textMuted,
  },
  heroCountry: { fontSize: 12, color: Palette.textMuted },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    alignSelf: 'stretch',
  },
  btnEditProfile: {
    flex: 1,
    height: 40,
    backgroundColor: Palette.red,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEditProfileText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.text,
  },
  btnJockeyBio: {
    flex: 1,
    height: 40,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnJockeyBioText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.gold,
  },

  // Stats
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 4,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  statBig: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statSub: { fontSize: 11, color: Palette.textMuted },

  placementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  placementLeft: { flex: 1, gap: 6 },
  placementValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  placementBig: {
    fontSize: 32,
    fontWeight: '800',
    color: Palette.text,
  },
  placementSub: { fontSize: 12, color: Palette.textMuted },
  miniBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 40,
  },
  miniBarTrack: {
    width: 14,
    height: 32,
    justifyContent: 'flex-end',
  },
  miniBar: {
    width: 14,
    borderRadius: 3,
  },

  // Skills
  skillCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  skillCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  skillCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.text,
  },
  skillRow: { gap: 6 },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillName: { fontSize: 13, fontWeight: '600', color: Palette.text },
  skillPercent: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  skillTrack: {
    height: 6,
    backgroundColor: '#2A2A2D',
    borderRadius: 3,
  },
  skillFill: {
    height: 6,
    borderRadius: 3,
  },

  // Trophies
  trophySection: { marginBottom: 20 },
  trophyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.red,
  },
  trophyGrid: { flexDirection: 'row', gap: 12 },
  trophyItem: { flex: 1, alignItems: 'center', gap: 8 },
  trophyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyName: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Settings
  settingsCard: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    paddingVertical: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    color: Palette.text,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsValue: {
    fontSize: 14,
    color: Palette.textMuted,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Palette.cardBorder,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.red,
  },

  bottomPad: { height: 20 },
});
