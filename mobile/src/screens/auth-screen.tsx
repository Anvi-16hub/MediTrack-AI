import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { AppButton, Card, FormField, PageHeader, Screen } from '@/components/app-ui';
import { AppColors, AppSpacing } from '@/constants/app-theme';
import type { AuthResult } from '@/providers/auth-context';

type AuthMode = 'login' | 'register';

export function AuthScreen({
  supabaseConfigured,
  onLogin,
  onRegister,
  onDemoLogin,
}: {
  supabaseConfigured: boolean;
  onLogin: (credentials: { email: string; password: string }) => Promise<AuthResult>;
  onRegister: (account: { name: string; email: string; password: string }) => Promise<AuthResult>;
  onDemoLogin: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setNotice('');
    if (mode === 'register' && name.trim().length < 2) {
      setError('Enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const result = mode === 'register'
        ? await onRegister({ name: name.trim(), email: email.trim().toLowerCase(), password })
        : await onLogin({ email: email.trim().toLowerCase(), password });
      if (!result.success) setError(result.message || 'Authentication failed.');
      else if (result.notice) setNotice(result.notice);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}><AppIcon name="medicines" color={AppColors.white} size={22} /></View>
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>MediTrack AI</Text>
          <Text style={styles.brandSub}>Medication adherence platform</Text>
        </View>
        <View style={[styles.statusPill, supabaseConfigured ? styles.connectedPill : styles.demoPill]}>
          <Text style={[styles.statusText, supabaseConfigured ? styles.connectedText : styles.demoText]}>
            {supabaseConfigured ? 'SUPABASE AUTH' : 'DEMO MODE'}
          </Text>
        </View>
      </View>

      <PageHeader
        eyebrow={mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
        title={mode === 'login' ? 'Sign in' : 'Create account'}
        subtitle={mode === 'login'
          ? 'Use the same account as the MediTrack website when Supabase is configured.'
          : 'Create a shared MediTrack account for website and mobile.'}
      />

      <View style={styles.modeSwitch}>
        <AppButton label="Sign in" variant={mode === 'login' ? 'primary' : 'secondary'} compact onPress={() => { setMode('login'); setError(''); setNotice(''); }} style={styles.modeButton} />
        <AppButton label="Register" variant={mode === 'register' ? 'primary' : 'secondary'} compact onPress={() => { setMode('register'); setError(''); setNotice(''); }} style={styles.modeButton} />
      </View>

      <Card>
        {mode === 'register' ? (
          <FormField label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" maxLength={70} />
        ) : null}
        <FormField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" maxLength={120} />
        <FormField label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" autoCapitalize="none" secureTextEntry maxLength={128} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {notice ? <Text accessibilityRole="status" style={styles.notice}>{notice}</Text> : null}
        <AppButton
          label={busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
          icon={<AppIcon name="forward" color={AppColors.white} size={16} />}
          disabled={busy}
          onPress={() => { void submit(); }}
        />
      </Card>

      {!supabaseConfigured ? (
        <Card style={styles.demoCard}>
          <View style={styles.demoIcon}><AppIcon name="info" color={AppColors.blue} size={17} /></View>
          <View style={styles.demoCopy}>
            <Text style={styles.demoTitle}>Supabase is not configured</Text>
            <Text style={styles.demoDescription}>Local demo accounts are stored only in this app session and are not shared with the website.</Text>
          </View>
          <AppButton label="Continue in demo mode" variant="secondary" onPress={onDemoLogin} />
        </Card>
      ) : null}

      <Text style={styles.securityNote}>
        {supabaseConfigured
          ? 'Auth uses the configured Supabase project. Database access is still enforced by the deployed RLS policies.'
          : 'Do not use real or sensitive patient information in demo mode.'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.md, marginBottom: AppSpacing.md },
  brandIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: AppColors.blue, alignItems: 'center', justifyContent: 'center' },
  brandCopy: { flex: 1, gap: 2 },
  brand: { color: AppColors.ink, fontSize: 16, fontWeight: '800' },
  brandSub: { color: AppColors.muted, fontSize: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  connectedPill: { backgroundColor: AppColors.tealPale },
  demoPill: { backgroundColor: AppColors.amberPale },
  statusText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  connectedText: { color: AppColors.teal },
  demoText: { color: AppColors.amber },
  modeSwitch: { flexDirection: 'row', gap: AppSpacing.sm },
  modeButton: { flex: 1 },
  error: { color: AppColors.red, fontSize: 12, lineHeight: 18 },
  notice: { color: AppColors.teal, fontSize: 12, lineHeight: 18 },
  demoCard: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' },
  demoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: AppColors.bluePale, alignItems: 'center', justifyContent: 'center' },
  demoCopy: { flex: 1, minWidth: 180, gap: 4 },
  demoTitle: { color: AppColors.ink, fontSize: 12, fontWeight: '800' },
  demoDescription: { color: AppColors.muted, fontSize: 11, lineHeight: 16 },
  securityNote: { color: AppColors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
