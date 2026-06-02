import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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

import { Fonts } from '@/constants/theme';
/**
 * Fixed "elite racing" dark palette. This screen intentionally ignores the
 * system color scheme so the brand look is consistent.
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
  gold: '#C9A24B',
} as const;

type Role = 'spectator' | 'jockey';

const ROLES: { key: Role; label: string; placeholder: string }[] = [
  { key: 'spectator', label: 'Khán Giả', placeholder: 'spectator@horsari.com' },
  { key: 'jockey', label: 'Jockey', placeholder: 'jockey@horsari.com' },
];

export default function LoginScreen() {
  const [role, setRole] = useState<Role>('spectator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const activeRole = ROLES.find((r) => r.key === role) ?? ROLES[0];

  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleSubmit = () => {
    if (role === 'jockey') {
      router.replace('/(tabs)');
    }
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
                {/* <Ionicons name="speedometer" size={34} color={Palette.red} /> */}
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
                      onPress={() => setRole(item.key)}>
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
              <Text style={styles.title}>CHÀO MỪNG TRỞ LẠI</Text>
              <Text style={styles.subtitle}>
                Vui lòng đăng nhập để quản lý đội đua của bạn
              </Text>

              {/* Email */}
              <Text style={[styles.fieldLabel]}>Email hoặc Số điện thoại</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.popUpBorder]}>
                <Ionicons name="person-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={[styles.input]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={activeRole.placeholder}
                  placeholderTextColor={Palette.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  inputMode="email"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Password */}
              <Text style={styles.fieldLabel}>Mật khẩu</Text>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.popUpBorder]}>
                <Ionicons name="lock-closed-outline" size={18} color={Palette.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Palette.textPlaceholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
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

              <Pressable hitSlop={8} style={styles.forgotWrapper} onPress={() => { }}>
                {({ hovered }) => (
                  <Text style={hovered ? styles.forgotTextHovered : styles.forgotText}>
                    Quên mật khẩu?
                  </Text>
                )}
              </Pressable>

              {/* Submit */}
              <Pressable style={styles.submitPressable} onPress={handleSubmit}>
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
                    <Text style={styles.submitText}>ĐĂNG NHẬP</Text>
                  </LinearGradient>
                )}
              </Pressable>

              <View style={styles.divider} />

              <Text style={styles.footerPrompt}>Chưa có tài khoản chuyên gia?</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.registerLink}>ĐĂNG KÝ TÀI KHOẢN CHUYÊN GIA</Text>
              </Pressable>
            </View>

            <Text style={styles.brandFooter}>ELITE RACING INFRASTRUCTURE © 2024</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  safeArea: {
    flex: 1,
  },
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
  toggleLabelActive: {
    color: Palette.text,
  },
  title: {
    fontSize: 26,
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
  fieldLabel: {
    alignSelf: 'flex-start',
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Palette.textMuted,
    marginBottom: 8,
  },
  popUpBorder: {
    borderColor: '#E6A19C',
    borderWidth: 2,
  }
  ,
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
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
  },
  forgotText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFB3AD',
  },
  forgotTextHovered: {
    fontFamily: Fonts.mono,
    textDecorationLine: 'underline',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFB3AD',
  },
  submitPressable: {
    alignSelf: 'stretch',
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }],
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
  registerLink: {
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
