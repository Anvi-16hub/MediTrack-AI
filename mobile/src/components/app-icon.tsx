import { SymbolView } from 'expo-symbols';
import { Text, type ColorValue } from 'react-native';

const iconNames = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  medicines: { ios: 'pills.fill', android: 'medication', web: 'medication' },
  insights: { ios: 'chart.bar.fill', android: 'insights', web: 'insights' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  schedule: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  taken: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  missed: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  notifications: { ios: 'bell.badge.fill', android: 'notifications', web: 'notifications' },
  caregiver: { ios: 'person.2.fill', android: 'group', web: 'group' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  insightsDemo: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  forward: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  chart: { ios: 'chart.xyaxis.line', android: 'monitoring', web: 'monitoring' },
} as const;

export type AppIconName = keyof typeof iconNames;

export function AppIcon({ name, size = 20, color }: { name: AppIconName; size?: number; color: ColorValue }) {
  return (
    <SymbolView
      fallback={<Text style={{ color, fontSize: size, lineHeight: size }}>•</Text>}
      name={iconNames[name]}
      size={size}
      tintColor={color}
    />
  );
}