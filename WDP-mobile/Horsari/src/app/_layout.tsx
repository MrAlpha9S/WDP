import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '../auth/AuthContext';

export const unstable_settings = {
  initialRouteName: 'login',
};

// Separate component so it has access to the AuthContext value.
function RootNavigation() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = segments[0] === 'login' || segments[0] === 'register';

    if (!session) {
      // No active session → go to login, unless already on a public route
      if (!isPublicRoute) router.replace('/login');
      return;
    }

    // Session exists → route by role
    const { role } = session.user;
    if (role === 'jockey') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(jockey)' as any);
    } else if (role === 'spectator') {
      router.replace('/(spectator)');
    } else {
      // Unknown / unsupported role — clear and return to login
      router.replace('/login');
    }
  }, [session, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(jockey)" />
      <Stack.Screen name="(spectator)" />
      <Stack.Screen name="new-prediction" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
