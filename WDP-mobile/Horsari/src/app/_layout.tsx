import React from "react";
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RootLayoutNav() {
  const { user } = useAuth();

  return (
    <Stack>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(spectator)" options={{ headerShown: false }} />
        <Stack.Screen name="(jockey)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
