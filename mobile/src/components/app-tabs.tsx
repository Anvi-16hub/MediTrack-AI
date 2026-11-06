import { Tabs } from 'expo-router';

import { AppIcon } from '@/components/app-icon';
import { AppColors } from '@/constants/app-theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.blue,
        tabBarInactiveTintColor: AppColors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          paddingBottom: 8,
          borderTopColor: AppColors.line,
          backgroundColor: AppColors.white,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AppIcon name="home" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: 'Medicines',
          tabBarIcon: ({ color }) => <AppIcon name="medicines" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'AI Insights',
          tabBarIcon: ({ color }) => <AppIcon name="insights" color={color} size={21} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="profile" color={color} size={21} />,
        }}
      />
    </Tabs>
  );
}