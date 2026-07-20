import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateMyProfile } from '../api/jockeyApi';
import { useAuth } from '../auth/AuthContext';
import { Fonts } from '@/constants/theme';

const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardBorder: '#262629',
  inputBackground: '#0E0E10',
  inputBorder: '#2A2A2D',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  textPlaceholder: '#6A6A70',
  red: '#C81E2E',
  errorBg: '#2A1215',
  errorBorder: '#5C1A1F',
  gold: '#C9A24B',
} as const;

// YYYY-MM-DD
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function CompleteJockeyProfileScreen() {
  const { session, saveAndSetSession, logout } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [bookingFee, setBookingFee] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const handleSubmit = async () => {
    if (!bookingFee.trim() || !weight.trim() || !height.trim() || !address.trim() || !dateOfBirth.trim()) {
      setErrorMsg('Please fill in all fields to continue.');
      return;
    }

    const parsedBookingFee = Number(bookingFee);
    const parsedWeight = Number(weight);
    const parsedHeight = Number(height);

    if (Number.isNaN(parsedBookingFee) || parsedBookingFee < 0) {
      setErrorMsg('Booking fee must be a non-negative number.');
      return;
    }
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setErrorMsg('Weight must be a positive number.');
      return;
    }
    if (Number.isNaN(parsedHeight) || parsedHeight <= 0) {
      setErrorMsg('Height must be a positive number.');
      return;
    }
    if (!DATE_RE.test(dateOfBirth.trim())) {
      setErrorMsg('Date of birth must be in YYYY-MM-DD format.');
      return;
    }
    const parsedDob = new Date(dateOfBirth.trim());
    if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
      setErrorMsg('Please enter a valid date of birth.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await updateMyProfile({
      bookingFee: parsedBookingFee,
      weight: parsedWeight,
      height: parsedHeight,
      address: address.trim(),
      dateOfBirth: dateOfBirth.trim(),
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setErrorMsg(result.message);
      return;
    }

    // Clears the onboarding flag so RootNavigation's redirect effect sends
    // us into the jockey app instead of bouncing back here.
    if (session) {
      await saveAndSetSession({
        ...session,
        user: { ...session.user, needsProfileSetup: false },
      });
    }
    setIsSubmitting(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>COMPLETE YOUR PROFILE</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <Text style={styles.introText}>
              A few more details before you can start booking races.
            </Text>

            {errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Professional Info</Text>

            <Text style={styles.fieldLabel}>Default Booking Fee (₫)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="cash-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={bookingFee}
                onChangeText={(v) => { setBookingFee(v); setErrorMsg(null); }}
                placeholder="0"
                placeholderTextColor={Palette.textPlaceholder}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="speedometer-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={(v) => { setWeight(v); setErrorMsg(null); }}
                placeholder="55"
                placeholderTextColor={Palette.textPlaceholder}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="resize-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={(v) => { setHeight(v); setErrorMsg(null); }}
                placeholder="165"
                placeholderTextColor={Palette.textPlaceholder}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionTitle}>Personal Info</Text>

            <Text style={styles.fieldLabel}>Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={(v) => { setAddress(v); setErrorMsg(null); }}
                placeholder="Your address"
                placeholderTextColor={Palette.textPlaceholder}
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                onChangeText={(v) => { setDateOfBirth(v); setErrorMsg(null); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Palette.textPlaceholder}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>

            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitText}>CONTINUE</Text>
              )}
            </Pressable>

            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={16} color={Palette.red} />
              <Text style={styles.logoutText}>LOG OUT</Text>
            </Pressable>

            <View style={styles.bottomPad} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    color: Palette.red,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  introText: {
    fontSize: 13,
    color: Palette.textMuted,
    lineHeight: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.text,
    marginTop: 8,
    marginBottom: 14,
  },

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
  errorText: { flex: 1, fontSize: 13, color: '#FF6B6B', lineHeight: 18 },

  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: Palette.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 10,
  },
  input: {
    flex: 1,
    color: Palette.text,
    borderWidth: 0,
    fontSize: 15,
    height: '100%',
  },

  submitBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: Palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

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

  bottomPad: { height: 30 },
});
