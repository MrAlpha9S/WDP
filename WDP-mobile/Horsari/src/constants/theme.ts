import '@/global.css';

import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * The dark palette every screen already converges on in practice. Screens should
 * import this instead of redeclaring a local `Palette` object — see Phase 1 design
 * system audit. `amber` is "pending/warning"; `green` is the single "positive" color
 * app-wide (some screens previously used amber for both).
 */
export const Palette = {
  background: '#0A0A0B',
  card: '#161618',
  cardRaised: '#1E1E21',
  cardBorder: '#262629',
  text: '#FFFFFF',
  textMuted: '#9A9AA0',
  gold: '#C9A24B',
  goldTint: '#1A1608',
  red: '#C81E2E',
  green: '#22C55E',
  amber: '#E07B3A',
  violet: '#A78BFA',
  errorBg: '#2A1215',
  errorBorder: '#3A1218',
  scrim: 'rgba(0,0,0,0.55)',
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Elevation = {
  overlay: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
} as const;
