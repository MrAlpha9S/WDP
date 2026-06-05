import { Colors } from "@/constants/theme";
import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress,
  title,
  variant = "primary",
  disabled = false,
  isLoading = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        (pressed || disabled) && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>
        {isLoading ? "Loading..." : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  button_primary: {
    backgroundColor: Colors.buttonPrimary,
  },
  button_secondary: {
    backgroundColor: Colors.buttonSecondary,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonText_primary: {
    color: Colors.buttonTextPrimary,
  },
  buttonText_secondary: {
    color: Colors.buttonTextSecondary,
  },
});
