import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Text,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { loginSchema } from "@/lib/schemas";
import { InputField } from "@/components/InputField";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/Button";
import { AuthHeader } from "@/components/AuthHeader";
import { Colors } from "@/constants/theme";

type LoginFormData = {
  email: string;
  password: string;
  role: "spectator" | "jockey";
};

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [role, setRole] = useState<"spectator" | "jockey">("spectator");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "spectator",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, role);
      // Navigate based on role
      if (role === "spectator") {
        router.replace("/(spectator)/home");
      } else {
        router.replace("/(jockey)/home");
      }
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again.",
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <AuthHeader title="Welcome Back" subtitle="Log in to your account" />

      <View style={styles.roleToggleContainer}>
        <Text style={styles.roleLabel}>Role Selection:</Text>
        <View style={styles.roleToggleButtons}>
          <Pressable
            onPress={() => setRole("spectator")}
            style={[
              styles.roleToggleButton,
              role === "spectator" && styles.roleToggleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleToggleText,
                role === "spectator" && styles.roleToggleTextActive,
              ]}
            >
              👀 Spectator
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole("jockey")}
            style={[
              styles.roleToggleButton,
              role === "jockey" && styles.roleToggleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleToggleText,
                role === "jockey" && styles.roleToggleTextActive,
              ]}
            >
              🏇 Jockey
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Email"
              placeholder="your@email.com"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              keyboardType="email-address"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange } }) => (
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          onPress={handleSubmit(onSubmit)}
          title="Log In"
          isLoading={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  roleToggleContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  roleToggleButtons: {
    flexDirection: "row",
    gap: 8,
  },
  roleToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  roleToggleButtonActive: {
    backgroundColor: Colors.buttonPrimary,
    borderColor: Colors.buttonPrimary,
  },
  roleToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  roleToggleTextActive: {
    color: "#FFFFFF",
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.buttonPrimary,
  },
});
