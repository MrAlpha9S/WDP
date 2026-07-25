import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMyProfile, updateMyProfile, updateMyLicense } from '../../api/jockeyApi';
import { uploadAvatar } from '../../api/profileApi';
import { isNetworkError, NETWORK_ERROR_MESSAGE } from '../../api/axios';
import { Fonts } from '@/constants/theme';

const LICENSE_BADGE_COLOR: Record<string, string> = {
  pending: '#C9A24B',
  approved: '#3DBE6C',
  rejected: '#C81E2E',
};

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
  const [loadFailed, setLoadFailed] = useState(false);

  const [bookingFee, setBookingFee] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<string | null>(null);
  const [licenseLink, setLicenseLink] = useState<string | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const profile = await getMyProfile();
      if (profile) {
        setBookingFee(profile.jockey.bookingFee ? String(profile.jockey.bookingFee) : '');
        setWeight(profile.jockey.weight ? String(profile.jockey.weight) : '');
        setHeight(profile.jockey.height ? String(profile.jockey.height) : '');
        setFullName(profile.jockey.fullName ?? '');
        setPhoneNumber(profile.jockey.phoneNumber ?? '');
        setAddress(profile.jockey.address ?? '');
        setDateOfBirth(profile.jockey.dateOfBirth ? profile.jockey.dateOfBirth.slice(0, 10) : '');
        setAvatarUri(profile.jockey.image ?? null);
        setLicenseStatus(profile.jockey.licenseStatus ?? null);
        setLicenseLink(profile.jockey.licenseLink ?? null);
      } else {
        setErrorMsg('Could not load profile. Please try again.');
        setLoadFailed(true);
      }
    } catch (err: any) {
      setErrorMsg(isNetworkError(err) ? NETWORK_ERROR_MESSAGE : 'Could not load profile. Please try again.');
      setLoadFailed(true);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMsg('Photo library permission is required to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setIsUploadingAvatar(true);
    setErrorMsg(null);
    const uploadResult = await uploadAvatar({
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
    setIsUploadingAvatar(false);
    if (uploadResult.ok && uploadResult.image) {
      setAvatarUri(uploadResult.image);
    } else {
      setErrorMsg(uploadResult.message);
    }
  };

  const handlePickLicense = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setIsUploadingLicense(true);
    setErrorMsg(null);
    const licenseResult = await updateMyLicense({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
    });
    setIsUploadingLicense(false);
    if (licenseResult.ok && licenseResult.data) {
      setLicenseStatus(licenseResult.data.jockey.licenseStatus);
      setLicenseLink(licenseResult.data.jockey.licenseLink);
    } else {
      setErrorMsg(licenseResult.message);
    }
  };

  const handleSubmit = async () => {
    const parsedBookingFee = bookingFee.trim() ? Number(bookingFee) : undefined;
    const parsedWeight = weight.trim() ? Number(weight) : undefined;
    const parsedHeight = height.trim() ? Number(height) : undefined;

    if (parsedBookingFee != null && (Number.isNaN(parsedBookingFee) || parsedBookingFee < 0)) {
      setErrorMsg('Booking fee must be a non-negative number.');
      return;
    }
    if (parsedWeight != null && (Number.isNaN(parsedWeight) || parsedWeight <= 0)) {
      setErrorMsg('Weight must be a positive number.');
      return;
    }
    if (parsedHeight != null && (Number.isNaN(parsedHeight) || parsedHeight <= 0)) {
      setErrorMsg('Height must be a positive number.');
      return;
    }
    const trimmedDob = dateOfBirth.trim();
    if (trimmedDob) {
      const parsedDob = new Date(trimmedDob);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        setErrorMsg('Please enter a valid date of birth (YYYY-MM-DD).');
        return;
      }
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
      dateOfBirth: trimmedDob || undefined,
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
            <Text style={styles.headerTitle}>EDIT PROFILE</Text>
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
                {loadFailed && (
                  <Pressable onPress={load} hitSlop={8}>
                    <Text style={styles.errorRetryText}>RETRY</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.avatarRow}>
              <View style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={28} color={Palette.textMuted} />
                  </View>
                )}
                <Pressable
                  style={styles.avatarEditBtn}
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color={Palette.text} />
                  ) : (
                    <Ionicons name="camera" size={13} color={Palette.text} />
                  )}
                </Pressable>
              </View>
              <Pressable onPress={handlePickAvatar} disabled={isUploadingAvatar}>
                <Text style={styles.avatarChangeText}>Change Photo</Text>
              </Pressable>
            </View>

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

            <Text style={styles.sectionTitle}>Contact Info</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrorMsg(null); }}
                placeholder="John Doe"
                placeholderTextColor={Palette.textPlaceholder}
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fieldLabel}>Phone Number</Text>
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
                <Text style={styles.submitText}>SAVE CHANGES</Text>
              )}
            </Pressable>

            <View style={styles.licenseSection}>
              <View style={styles.licenseHeader}>
                <Text style={styles.sectionTitle}>License</Text>
                {licenseStatus && (
                  <View style={[styles.licenseBadge, { borderColor: LICENSE_BADGE_COLOR[licenseStatus] ?? Palette.textMuted }]}>
                    <Text style={[styles.licenseBadgeText, { color: LICENSE_BADGE_COLOR[licenseStatus] ?? Palette.textMuted }]}>
                      {licenseStatus.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.licenseActions}>
                {licenseLink && (
                  <Pressable onPress={() => Linking.openURL(licenseLink)} style={styles.licenseLinkBtn}>
                    <Ionicons name="document-text-outline" size={14} color={Palette.textMuted} />
                    <Text style={styles.licenseLinkText}>View current license</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.licenseUploadBtn}
                  onPress={handlePickLicense}
                  disabled={isUploadingLicense}>
                  {isUploadingLicense ? (
                    <ActivityIndicator size="small" color={Palette.text} />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={14} color={Palette.text} />
                  )}
                  <Text style={styles.licenseUploadText}>Re-upload License (PDF)</Text>
                </Pressable>
              </View>
              <Text style={styles.licenseHint}>Re-uploading resets your license status to pending until reviewed.</Text>
            </View>

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
  errorRetryText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Palette.red,
  },

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

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarWrapper: { position: 'relative' },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
  },
  avatarPlaceholder: {
    backgroundColor: Palette.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.red,
  },

  licenseSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorder,
  },
  licenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  licenseBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  licenseBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  licenseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  licenseLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  licenseLinkText: { fontSize: 12, color: Palette.textMuted },
  licenseUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.inputBackground,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  licenseUploadText: { fontSize: 12, fontWeight: '600', color: Palette.text },
  licenseHint: { fontSize: 11, color: Palette.textMuted, marginTop: 10, lineHeight: 16 },
});
