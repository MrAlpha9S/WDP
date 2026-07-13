import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Fonts } from '@/constants/theme';

const Palette = {
  card: '#161618',
  cardBorder: '#262629',
  gold: '#C9A24B',
  textMuted: '#9A9AA0',
} as const;

export default function SpectatorTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Palette.card,
          borderTopColor: Palette.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarActiveTintColor: Palette.gold,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarLabelStyle: {
          fontFamily: Fonts.mono,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'TRANG CHỦ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'LỊCH ĐUA',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'VÍ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="predictions"
        options={{
          title: 'DỰ ĐOÁN',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'HỒ SƠ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Live race detail screen — hidden from tab bar, navigated programmatically */}
      <Tabs.Screen
        name="race/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      {/* Full transaction history — hidden from tab bar, pushed from Wallet */}
      <Tabs.Screen
        name="transactions"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
