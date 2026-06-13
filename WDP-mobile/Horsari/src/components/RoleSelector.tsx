import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";

interface RoleSelectorProps {
  selectedRole: "spectator" | "jockey" | null;
  onSelectRole: (role: "spectator" | "jockey") => void;
  disabled?: boolean;
}

export function RoleSelector({
  selectedRole,
  onSelectRole,
  disabled = false,
}: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Your Role</Text>
      <View style={styles.rolesContainer}>
        <Pressable
          onPress={() => !disabled && onSelectRole("spectator")}
          disabled={disabled}
          style={({ pressed }) => [
            styles.roleCard,
            selectedRole === "spectator" && styles.roleCardSelected,
            pressed && styles.roleCardPressed,
          ]}
        >
          <Text style={styles.roleIcon}>👀</Text>
          <Text
            style={[
              styles.roleTitle,
              selectedRole === "spectator" && styles.roleTextActive,
            ]}
          >
            Spectator
          </Text>
          <Text
            style={[
              styles.roleDescription,
              selectedRole === "spectator" && styles.roleDescriptionActive,
            ]}
          >
            Watch races and follow results
          </Text>
        </Pressable>

        <Pressable
          onPress={() => !disabled && onSelectRole("jockey")}
          disabled={disabled}
          style={({ pressed }) => [
            styles.roleCard,
            selectedRole === "jockey" && styles.roleCardSelected,
            pressed && styles.roleCardPressed,
          ]}
        >
          <Text style={styles.roleIcon}>🏇</Text>
          <Text
            style={[
              styles.roleTitle,
              selectedRole === "jockey" && styles.roleTextActive,
            ]}
          >
            Jockey
          </Text>
          <Text
            style={[
              styles.roleDescription,
              selectedRole === "jockey" && styles.roleDescriptionActive,
            ]}
          >
            Participate in races
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: Colors.text,
  },
  rolesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    alignItems: "center",
    backgroundColor: Colors.backgroundElement,
  },
  roleCardSelected: {
    borderColor: "#DC2626",
    backgroundColor: "#FEE2E2",
  },
  roleCardPressed: {
    opacity: 0.7,
  },
  roleIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  roleTextActive: {
    color: "#DC2626",
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  roleDescriptionActive: {
    color: "#DC2626",
    fontWeight: "500",
  },
});
