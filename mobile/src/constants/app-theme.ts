import { StyleSheet } from 'react-native';

export const AppColors = {
  ink: '#18324F',
  muted: '#71839A',
  blue: '#2672D8',
  blueDark: '#1858AC',
  bluePale: '#EAF3FF',
  teal: '#168A82',
  tealPale: '#E7F6F2',
  amber: '#B87518',
  amberPale: '#FFF5E4',
  red: '#BD4B58',
  redPale: '#FCEBED',
  page: '#F4F8FC',
  surface: '#FFFFFF',
  line: '#E2EAF2',
  track: '#E9EFF5',
  white: '#FFFFFF',
} as const;

export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 30,
} as const;

export const commonTextStyles = StyleSheet.create({
  body: { color: AppColors.ink, fontSize: 14, lineHeight: 20 },
  muted: { color: AppColors.muted, fontSize: 12, lineHeight: 18 },
});