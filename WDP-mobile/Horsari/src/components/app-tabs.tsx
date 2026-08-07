import { Palette } from '@/constants/theme';
import { RoleTabs } from './RoleTabs';

export default function AppTabs() {
  return (
    <RoleTabs
      accentColor={Palette.red}
      items={[
        { name: 'index', title: 'DASHBOARD', icon: 'grid-outline' },
        { name: 'schedule', title: 'SCHEDULE', icon: 'calendar-outline' },
        { name: 'invites', title: 'INVITES', icon: 'mail-outline' },
        { name: 'payments', title: 'PAYMENTS', icon: 'cash-outline' },
        { name: 'profile', title: 'PROFILE', icon: 'person-outline' },
      ]}
      hidden={['edit-profile', 'statistics', 'race/[id]']}
    />
  );
}
