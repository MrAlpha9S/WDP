import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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

import { getMyProfile, updateMyProfile } from '../../api/jockeyApi';
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

export default function EditProfileScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [bookingFee, setBookingFee] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async () => {
      const profile = await getMyProfile();
      if (profile) {
        setBookingFee(profile.jockey.bookingFee ? String(profile.jockey.bookingFee) : '');
        setWeight(profile.jockey.weight ? String(profile.jockey.weight) : '');
        setHeight(profile.jockey.height ? String(profile.jockey.height) : '');
        setFullName(profile.jockey.fullName ?? '');
        setPhoneNumber(profile.jockey.phoneNumber ?? '');
        setAddress(profile.jockey.address ?? '');
      } else {
        setErrorMsg('Không thể tải hồ sơ. Vui lòng thử lại.');
      }
      setIsLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    const parsedBookingFee = bookingFee.trim() ? Number(bookingFee) : undefined;
    const parsedWeight = weight.trim() ? Number(weight) : undefined;
    const parsedHeight = height.trim() ? Number(height) : undefined;

    if (parsedBookingFee != null && (Number.isNaN(parsedBookingFee) || parsedBookingFee < 0)) {
      setErrorMsg('Phí đặt cưỡi phải là một số không âm.');
      return;
    }
    if (parsedWeight != null && (Number.isNaN(parsedWeight) || parsedWeight <= 0)) {
      setErrorMsg('Cân nặng phải là một số dương.');
      return;
    }
    if (parsedHeight != null && (Number.isNaN(parsedHeight) || parsedHeight <= 0)) {
      setErrorMsg('Chiều cao phải là một số dương.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await updateMyProfile({
      bookingFee: parsedBookingFee,
      weight: parsedWeight,
      height: parsedHeight,
      fullName: fullName.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      address: address.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.message);
      return;
    }

    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top']}>
          <ActivityIndicator color={Palette.red} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* ─── Header ─── */}
          <View style={styles.header}>
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Palette.text} />
            </Pressable>
            <Text style={styles.headerTitle}>CHỈNH SỬA HỒ SƠ</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Thông tin nghề nghiệp</Text>

            <Text style={styles.fieldLabel}>Phí đặt cưỡi mặc định (₫)</Text>
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

            <Text style={styles.fieldLabel}>Cân nặng (kg)</Text>
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

            <Text style={styles.fieldLabel}>Chiều cao (cm)</Text>
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

            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

            <Text style={styles.fieldLabel}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrorMsg(null); }}
                placeholder="Nguyễn Văn A"
                placeholderTextColor={Palette.textPlaceholder}
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(v) => { setPhoneNumber(v); setErrorMsg(null); }}
                placeholder="0901234567"
                placeholderTextColor={Palette.textPlaceholder}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.fieldLabel}>Địa chỉ</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={(v) => { setAddress(v); setErrorMsg(null); }}
                placeholder="Địa chỉ của bạn"
                placeholderTextColor={Palette.textPlaceholder}
                autoCorrect={false}
              />
            </View>

            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitText}>LƯU THAY ĐỔI</Text>
              )}
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
    color: Palette.red,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

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

  bottomPad: { height: 30 },
});
