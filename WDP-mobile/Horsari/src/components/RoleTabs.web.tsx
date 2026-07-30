import { Ionicons } from '@expo/vector-icons';
import { Href } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { RoleTabItem } from './role-tabs-types';

import { Fonts, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

interface RoleTabsProps {
  accentColor: string;
  items: RoleTabItem[];
  /** name -> href, e.g. { index: '/', wallet: '/wallet' } */
  hrefs: Record<string, string>;
}

/**
 * Web counterpart of RoleTabs — same accent/item-set parameterization, using
 * expo-router/ui's TabTrigger API instead of native Tabs. Previously only the
 * jockey group had a web variant; spectator fell back to the native Tabs
 * component and diverged in behavior on web.
 */
export function RoleTabs({ accentColor, items, hrefs }: RoleTabsProps) {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          {items.map(item => (
            <TabTrigger key={item.name} name={item.name} href={hrefs[item.name] as Href} asChild>
              <TabButton icon={item.icon} accentColor={accentColor}>{item.title}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accentColor: string;
};

function TabButton({ children, isFocused, icon, accentColor, ...props }: TabButtonProps) {
  const color = isFocused ? accentColor : Palette.textMuted;
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{children}</Text>
    </Pressable>
  );
}

function CustomTabList({ children }: TabListProps) {
  return (
    <View style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{children}</View>
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
