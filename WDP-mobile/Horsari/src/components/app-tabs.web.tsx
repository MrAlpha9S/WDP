import { Ionicons } from '@expo/vector-icons';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';

import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';

const Palette = {
  card: '#161618',
  cardBorder: '#262629',
  red: '#C81E2E',
  textMuted: '#9A9AA0',
} as const;

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="grid-outline">DASHBOARD</TabButton>
          </TabTrigger>
          <TabTrigger name="schedule" href="/schedule" asChild>
            <TabButton icon="calendar-outline">SCHEDULE</TabButton>
          </TabTrigger>
          <TabTrigger name="invites" href="/invites" asChild>
            <TabButton icon="mail-outline">INVITES</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="person-outline">PROFILE</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Ionicons
        name={icon}
        size={20}
        color={isFocused ? Palette.red : Palette.textMuted}
      />
      <ThemedText
        type="small"
        style={[styles.tabLabel, { color: isFocused ? Palette.red : Palette.textMuted }]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function CustomTabList({ children }: TabListProps) {
  return (
    <View style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    backgroundColor: Palette.card,
    borderTopColor: Palette.cardBorder,
    borderTopWidth: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  tabButton: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
