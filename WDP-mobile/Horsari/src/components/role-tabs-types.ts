import { Ionicons } from '@expo/vector-icons';

export interface RoleTabItem {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}
