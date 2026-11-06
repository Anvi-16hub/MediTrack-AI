import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/screens/auth-screen';
import { AuthProvider } from '@/providers/auth-provider';
import { AppStateProvider } from '@/providers/app-state-provider';
import { AppColors } from '@/constants/app-theme';
import { useAuth } from '@/hooks/use-auth';
import { useAppState } from '@/hooks/use-app-state';

export default function TabLayout() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const { user, ready, supabaseConfigured, signIn, signUp, continueDemo } = useAuth();
  const { dataLoading, errorMessage, clearError, refreshData } = useAppState();

  if (!ready) return <LoadingState message="Restoring secure session..." />;
  if (!user) {
    return <AuthScreen supabaseConfigured={supabaseConfigured} onLogin={signIn} onRegister={signUp} onDemoLogin={continueDemo} />;
  }
  if (dataLoading) return <LoadingState message="Loading your shared medication data..." />;
  return (
    <View style={styles.appShell}>
      <AppTabs />
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <View style={styles.errorActions}>
            <Pressable accessibilityRole="button" onPress={() => { void refreshData(); }}><Text style={styles.retryText}>Retry</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={clearError}><Text style={styles.retryText}>Dismiss</Text></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={AppColors.blue} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: AppColors.page },
  loadingText: { color: AppColors.muted, fontSize: 13 },
  errorBanner: { position: 'absolute', top: 8, left: 12, right: 12, zIndex: 100, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F3D0D4', backgroundColor: AppColors.redPale, gap: 8 },
  errorText: { color: AppColors.red, fontSize: 12, lineHeight: 18 },
  errorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  retryText: { color: AppColors.blueDark, fontSize: 12, fontWeight: '700' },
});
