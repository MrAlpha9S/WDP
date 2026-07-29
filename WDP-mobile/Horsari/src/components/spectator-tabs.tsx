import { Palette } from '@/constants/theme';
import { RoleTabs } from './RoleTabs';

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
      hidden={['race/[id]', 'transactions', 'statistics']}
    />
  );
}
