import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

import { getSpectatorProfile, updateSpectatorProfile } from '../../api/spectatorApi';
import { uploadAvatar } from '../../api/profileApi';
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
  gold: '#C9A24B',
  errorBg: '#2A1215',
  errorBorder: '#5C1A1F',
} as const;

export default function SpectatorEditProfileScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getSpectatorProfile();
      if (profile) {
        setFullName(profile.user.fullName ?? '');
        setPhoneNumber(profile.user.phoneNumber ?? '');
        setAddress(profile.user.address ?? '');
        setDateOfBirth(profile.user.dateOfBirth ? profile.user.dateOfBirth.slice(0, 10) : '');
        setAvatarUri(profile.user.image ?? null);
      } else {
        setErrorMsg('Could not load profile. Please try again.');
      }
      setIsLoading(false);
    })();
  }, []);

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

  const handleSubmit = async () => {
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

    const result = await updateSpectatorProfile({
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
          <ActivityIndicator color={Palette.gold} size="large" />
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

            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Palette.textMuted} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrorMsg(null); }}
                placeholder="Your full name"
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
                <ActivityIndicator color="#0A0A0B" size="small" />
              ) : (
                <Text style={styles.submitText}>SAVE CHANGES</Text>
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
    color: Palette.gold,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

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
    color: Palette.gold,
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
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    color: '#0A0A0B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  bottomPad: { height: 30 },
});
