import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { useAuth } from '../auth/AuthContext';
import { registerUser } from '../auth/authService';
import { Fonts } from '@/constants/theme';

/**
 * Fixed "elite racing" dark palette — mirrors login.tsx exactly.
 */
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
  redDark: '#8C1620',
  errorBg: '#2A1215',
  errorBorder: '#5C1A1F',
  gold: '#C9A24B',
} as const;

type Role = 'spectator' | 'jockey';

const ROLES: { key: Role; label: string }[] = [
  { key: 'spectator', label: 'Khán Giả' },
  { key: 'jockey', label: 'Jockey' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { saveAndSetSession } = useAuth();

  const [role, setRole] = useState<Role>('spectator');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [license, setLicense] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pickLicense = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setLicense({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
      });
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !email.trim() || !password || !fullName.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (role === 'jockey' && !license) {
      setErrorMsg('Vui lòng tải lên giấy phép đua ngựa (PDF).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await registerUser({
      username: username.trim(),
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      role,
      license: role === 'jockey' ? license! : undefined,
    });

    if (!result.ok) {
      setErrorMsg(result.message);
      setIsSubmitting(false);
      return;
    }

    // Saving the session triggers RootNavigation to redirect by role.
    await saveAndSetSession(result.session);
    setIsSubmitting(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              {/* Logo */}
              <View style={styles.logoCircle}>
                <Image
                  source={require('@/assets/images/horsari-logo.png')}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              </View>

              {/* Role toggle */}
              <View style={styles.toggle}>
                {ROLES.map((item) => {
                  const selected = item.key === role;
                  return (
                    <Pressable
                      key={item.key}
                      style={styles.toggleItem}
                      onPress={() => {
                        setRole(item.key);
                        setErrorMsg(null);
                      }}>
                      {selected ? (
                        <LinearGradient
                          colors={[Palette.redDark, Palette.red]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.toggleFill}>
                          <Text style={[styles.toggleLabel, styles.toggleLabelActive]}>
                            {item.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.toggleLabel}>{item.label}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Heading */}
              <Text style={styles.title}>ĐĂNG KÝ TÀI KHOẢN</Text>
              <Text style={styles.subtitle}>
                Tạo tài khoản để tham gia Horsari
              </Text>

              {/* Error banner */}
              {errorMsg && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Full name */}
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

              {/* Username */}
              <Text style={styles.fieldLabel}>Tên đăng nhập</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="at-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(v) => { setUsername(v); setErrorMsg(null); }}
                  placeholder="username"
                  placeholderTextColor={Palette.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
                  placeholder="you@horsari.com"
                  placeholderTextColor={Palette.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  inputMode="email"
                />
              </View>

              {/* Phone (optional) */}
              <Text style={styles.fieldLabel}>Số điện thoại (không bắt buộc)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="0901234567"
                  placeholderTextColor={Palette.textPlaceholder}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password */}
              <Text style={styles.fieldLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
                  placeholder="••••••••"
                  placeholderTextColor={Palette.textPlaceholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Palette.textMuted}
                  />
                </Pressable>
              </View>

              {/* License upload — jockey only */}
              {role === 'jockey' && (
                <>
                  <Text style={styles.fieldLabel}>Giấy phép đua ngựa (PDF)</Text>
                  <Pressable style={styles.licenseWrapper} onPress={pickLicense}>
                    <Ionicons
                      name={license ? 'document-attach' : 'cloud-upload-outline'}
                      size={18}
                      color={license ? Palette.gold : Palette.textMuted}
                    />
                    <Text style={[styles.licenseText, license && styles.licenseTextActive]} numberOfLines={1}>
                      {license ? license.name : 'Chọn tệp PDF...'}
                    </Text>
                  </Pressable>
                </>
              )}

              {/* Submit */}
              <Pressable
                style={[styles.submitPressable, isSubmitting && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}>
                {({ pressed, hovered }) => (
                  <LinearGradient
                    colors={[Palette.redDark, Palette.red]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.submitButton,
                      hovered && styles.submitButtonHovered,
                      pressed && styles.submitButtonPressed,
                    ]}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitText}>ĐĂNG KÝ</Text>
                    )}
                  </LinearGradient>
                )}
              </Pressable>

              <View style={styles.divider} />

              <Text style={styles.footerPrompt}>Đã có tài khoản?</Text>
              <Pressable hitSlop={8} onPress={() => router.back()}>
                <Text style={styles.loginLink}>ĐĂNG NHẬP</Text>
              </Pressable>
            </View>

            <Text style={styles.brandFooter}>ELITE RACING INFRASTRUCTURE © 2026</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Palette.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#101011',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: Palette.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    padding: 4,
    marginBottom: 28,
  },
  toggleItem: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toggleFill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  toggleLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  toggleLabelActive: { color: Palette.text },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Palette.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.errorBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
    lineHeight: 18,
  },
  fieldLabel: {
    alignSelf: 'flex-start',
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
    alignSelf: 'stretch',
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
  licenseWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 52,
    backgroundColor: Palette.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 10,
  },
  licenseText: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPlaceholder,
  },
  licenseTextActive: { color: Palette.text },
  submitPressable: {
    alignSelf: 'stretch',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.7 },
  submitButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonHovered: {
    opacity: 0.95,
    transform: [{ scale: 1.01 }],
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  submitText: {
    color: Palette.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: Palette.cardBorder,
    marginVertical: 24,
  },
  footerPrompt: {
    fontSize: 14,
    color: Palette.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginLink: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.gold,
    textAlign: 'center',
  },
  brandFooter: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#4A4A50',
    textAlign: 'center',
    marginTop: 28,
  },
});
