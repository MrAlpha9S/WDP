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
import { spectatorSignupSchema, jockeySignupSchema } from "@/lib/schemas";
import { InputField } from "@/components/InputField";
import { PasswordInput } from "@/components/PasswordInput";
import { RoleSelector } from "@/components/RoleSelector";
import { UploadField } from "@/components/UploadField";
import { Button } from "@/components/Button";
import { AuthHeader } from "@/components/AuthHeader";
import { Colors } from "@/constants/theme";

type SignupFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "spectator" | "jockey";
  certificateName?: string;
  certificateUri?: string;
};

export default function SignupScreen() {
  const { signup, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<
    "spectator" | "jockey" | null
  >(null);
  const [certificateName, setCertificateName] = useState<string | null>(null);
  const [certificateUri, setCertificateUri] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const schema =
    selectedRole === "jockey" ? jockeySignupSchema : spectatorSignupSchema;
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: selectedRole || "spectator",
      certificateName: certificateName || "",
      certificateUri: certificateUri || "",
    },
  });

  const handleRoleSelect = (role: "spectator" | "jockey") => {
    setSelectedRole(role);
    setValue("role", role);
  };

  const handleDocumentSelected = (uri: string, name: string) => {
    setCertificateUri(uri);
    setCertificateName(name);
    setValue("certificateUri", uri);
    setValue("certificateName", name);
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({
        ...data,
        role: selectedRole || "spectator",
        certificateUri: certificateUri || undefined,
        certificateName: certificateName || undefined,
      });

      setShowSuccessMessage(true);
      setTimeout(() => {
        router.push("/(auth)/login");
      }, 2000);
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        "An error occurred. Please try again.",
      );
    }
  };

  if (!selectedRole) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <AuthHeader title="Create Account" subtitle="Choose your role" />
        <RoleSelector
          selectedRole={selectedRole}
          onSelectRole={handleRoleSelect}
        />
        <View style={styles.placeholder} />
      </ScrollView>
    );
  }

  if (showSuccessMessage) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Account Created Successfully!</Text>
          <Text style={styles.successMessage}>Redirecting to login...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <AuthHeader
        title={
          selectedRole === "jockey"
            ? "Jockey Registration"
            : "Spectator Registration"
        }
        subtitle="Complete your profile"
      />

      <Pressable
        onPress={() => setSelectedRole(null)}
        style={styles.changeRoleButton}
      >
        <Text style={styles.changeRoleText}>← Change Role</Text>
      </Pressable>

      <View style={styles.form}>
        <Controller
          control={control}
          name="username"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Username"
              placeholder="Choose a username"
              value={value}
              onChangeText={onChange}
              error={errors.username?.message}
              autoCapitalize="none"
            />
          )}
        />

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
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange } }) => (
            <PasswordInput
              label="Confirm Password"
              placeholder="Repeat your password"
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {selectedRole === "jockey" && (
          <UploadField
            onDocumentSelected={handleDocumentSelected}
            selectedDocumentName={certificateName || undefined}
            error={errors.certificateName?.message}
          />
        )}

        <Button
          onPress={handleSubmit(onSubmit)}
          title={isLoading ? "Creating Account..." : "Create Account"}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.footerLink}>Log In</Text>
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
  changeRoleButton: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  changeRoleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  placeholder: {
    height: 100,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  successContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
