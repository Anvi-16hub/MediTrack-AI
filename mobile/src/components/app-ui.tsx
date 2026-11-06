import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing } from '@/constants/app-theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWidth}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  right,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeadingCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  compact = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        compact && styles.buttonCompact,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`], compact && styles.buttonTextCompact]}>{label}</Text>
    </Pressable>
  );
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize = 'sentences',
  secureTextEntry,
  multiline = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.textInput, multiline && styles.textArea, error && styles.textInputError]}
        value={value}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function ProgressBar({ value, color = AppColors.blue }: { value: number; color?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <View accessibilityLabel={`${Math.round(clampedValue)} percent`} accessibilityRole="progressbar" style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clampedValue}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.page },
  screenContent: { paddingHorizontal: AppSpacing.lg, paddingTop: AppSpacing.md, paddingBottom: 36 },
  contentWidth: { width: '100%', maxWidth: 700, alignSelf: 'center', gap: AppSpacing.lg },
  pageHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: AppSpacing.md },
  pageHeadingCopy: { flex: 1, gap: AppSpacing.xs },
  eyebrow: { color: AppColors.teal, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  pageTitle: { color: AppColors.ink, fontSize: 24, lineHeight: 30, fontWeight: '800' },
  pageSubtitle: { color: AppColors.muted, fontSize: 13, lineHeight: 19 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: AppSpacing.sm },
  sectionTitle: { color: AppColors.ink, fontSize: 17, fontWeight: '700' },
  card: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.line, padding: AppSpacing.lg, gap: AppSpacing.md },
  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: AppSpacing.sm, paddingHorizontal: AppSpacing.lg, borderRadius: 11, borderWidth: 1 },
  button_primary: { backgroundColor: AppColors.blue, borderColor: AppColors.blue },
  button_secondary: { backgroundColor: AppColors.white, borderColor: AppColors.line },
  button_danger: { backgroundColor: AppColors.redPale, borderColor: '#F3D0D4' },
  button_quiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  buttonText: { fontSize: 13, fontWeight: '700' },
  buttonText_primary: { color: AppColors.white },
  buttonText_secondary: { color: AppColors.ink },
  buttonText_danger: { color: AppColors.red },
  buttonText_quiet: { color: AppColors.blue },
  buttonCompact: { minHeight: 36, paddingHorizontal: AppSpacing.md, borderRadius: 9 },
  buttonTextCompact: { fontSize: 12 },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  fieldGroup: { gap: AppSpacing.xs },
  fieldLabel: { color: AppColors.ink, fontSize: 12, fontWeight: '700' },
  textInput: { minHeight: 46, paddingHorizontal: AppSpacing.md, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: AppColors.line, backgroundColor: '#FBFDFF', color: AppColors.ink, fontSize: 14 },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  textInputError: { borderColor: AppColors.red },
  fieldError: { color: AppColors.red, fontSize: 11 },
  progressTrack: { height: 9, overflow: 'hidden', borderRadius: 20, backgroundColor: AppColors.track },
  progressFill: { height: '100%', borderRadius: 20 },
});