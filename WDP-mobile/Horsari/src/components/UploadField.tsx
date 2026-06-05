import React, { useState } from "react";
import { StyleSheet, View, Pressable, Text, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Colors } from "@/constants/theme";

interface UploadFieldProps {
  onDocumentSelected: (uri: string, name: string) => void;
  selectedDocumentName?: string;
  error?: string;
}

export function UploadField({
  onDocumentSelected,
  selectedDocumentName,
  error,
}: UploadFieldProps) {
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onDocumentSelected(asset.uri, asset.name || "certificate");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Racing Certificate</Text>
      <Pressable
        onPress={pickDocument}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.uploadButton,
          selectedDocumentName && styles.uploadButtonSuccess,
          pressed && styles.uploadButtonPressed,
        ]}
      >
        <View style={styles.uploadContent}>
          <Text style={styles.uploadIcon}>
            {selectedDocumentName ? "✅" : "📄"}
          </Text>
          <Text style={styles.uploadText}>
            {isLoading
              ? "Selecting..."
              : selectedDocumentName || "Choose Certificate (PDF, JPG, PNG)"}
          </Text>
        </View>
      </Pressable>
      {selectedDocumentName && (
        <Text style={styles.selectedText}>
          Selected: {selectedDocumentName}
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: "#DDD",
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  uploadButtonSuccess: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  uploadButtonPressed: {
    opacity: 0.7,
  },
  uploadContent: {
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  selectedText: {
    fontSize: 12,
    color: "#22C55E",
    marginTop: 8,
    fontWeight: "500",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
});
