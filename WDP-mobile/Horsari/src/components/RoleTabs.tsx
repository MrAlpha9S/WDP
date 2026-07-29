import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';
import { RoleTabItem } from './role-tabs-types';

export type { RoleTabItem };

interface RoleTabsProps {
  /** Spectator = gold, Jockey = red — see Phase 1 design system audit. */
  accentColor: string;
  items: RoleTabItem[];
  /** Route names that exist under this group but aren't shown as tab items (pushed screens). */
  hidden: string[];
}

/**
 * Single bottom-tab-bar implementation shared by every role group, parameterized
 * by accent color and item set. Replaces the previously near-duplicate
 * spectator-tabs.tsx / app-tabs.tsx.
 */
export function RoleTabs({ accentColor, items, hidden }: RoleTabsProps) {
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
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarLabelStyle: {
          fontFamily: Fonts.mono,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
        },
      }}>
      {items.map(item => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={item.icon} size={size} color={color} />,
          }}
        />
      ))}
      {hidden.map(name => (
        <Tabs.Screen key={name} name={name} options={{ href: null, tabBarStyle: { display: 'none' } }} />
      ))}
    </Tabs>
  );
}
