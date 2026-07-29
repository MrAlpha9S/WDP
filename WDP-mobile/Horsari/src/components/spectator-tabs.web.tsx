import { Palette } from '@/constants/theme';
import { RoleTabs } from './RoleTabs.web';

// Previously missing — spectator fell back to the native Tabs bar on web
// while jockey had a dedicated web variant. See Phase 1 design system audit.
export default function SpectatorTabs() {
  return (
    <RoleTabs
      accentColor={Palette.gold}
      items={[
        { name: 'index', title: 'HOME', icon: 'home-outline' },
        { name: 'wallet', title: 'WALLET', icon: 'wallet-outline' },
        { name: 'predictions', title: 'PREDICTIONS', icon: 'stats-chart-outline' },
        { name: 'profile', title: 'PROFILE', icon: 'person-outline' },
      ]}
      hrefs={{
        index: '/',
        wallet: '/wallet',
        predictions: '/predictions',
        profile: '/profile',
      }}
    />
  );
}
