import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';

import { deactivateDevicePushToken, listenForPushTokenChanges, registerDevicePushToken } from '@/services/device-push-registration';
import { medicationRepository } from '@/data/demo-medication-repository';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { AuthContext, type AuthResult, type AuthUser } from '@/providers/auth-context';

const initialDemoAccounts = [
  { name: 'Demo User', email: 'demo@meditrack.ai', password: 'Demo123!' },
];

function fromSupabaseUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  const metadataName = authUser.user_metadata?.full_name;
  return {
    id: authUser.id,
    name: typeof metadataName === 'string' && metadataName ? metadataName : authUser.email || 'MediTrack user',
    email: authUser.email || '',
    mode: 'supabase',
  };
}

function setDemoUserProfile(account: { name: string; email: string }, update: (user: AuthUser) => void) {
  void medicationRepository.updateProfile({ name: account.name, email: account.email });
  update({ id: null, name: account.name, email: account.email, mode: 'demo' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const [pushRegistrationMessage, setPushRegistrationMessage] = useState('');
  const demoAccounts = useRef(initialDemoAccounts);

  useEffect(() => {
    const client = supabase;
    if (!client) return undefined;

    let active = true;
    const handleAuthUrl = async (url: string | null) => {
      if (!url) return;
      const code = Linking.parse(url).queryParams?.code;
      if (typeof code !== 'string') return;
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error && active) console.warn('Could not complete the email confirmation link:', error.message);
    };
    void Linking.getInitialURL().then(handleAuthUrl).catch(() => {});
    const linkSubscription = Linking.addEventListener('url', ({ url }) => { void handleAuthUrl(url); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ? fromSupabaseUser(session.user) : null);
    });

    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.warn('Could not restore the mobile Supabase session:', error.message);
      setUser(data.session?.user ? fromSupabaseUser(data.session.user) : null);
      setReady(true);
    }).catch((error: unknown) => {
      if (!active) return;
      console.warn('Could not restore the mobile Supabase session:', error);
      setReady(true);
    });

    return () => {
      active = false;
      linkSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  async function registerPushToken() {
    if (user?.mode !== 'supabase' || !user.id) {
      setPushRegistrationMessage('Sign in with a Supabase account before registering a device.');
      return;
    }
    const result = await registerDevicePushToken(user.id);
    setPushRegistrationMessage(result.message);
  }

  useEffect(() => {
    if (user?.mode !== 'supabase' || !user.id) return undefined;
    let active = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (supabase && timezone) {
      void supabase.from('profiles').update({ timezone }).eq('id', user.id).then(({ error }) => {
        if (error) console.warn('Could not sync profile timezone:', error.message);
      }, () => {});
    }
    const tokenListener = listenForPushTokenChanges(user.id);
    void registerDevicePushToken(user.id).then((result) => {
      if (active) setPushRegistrationMessage(result.message);
    });
    return () => {
      active = false;
      tokenListener.remove();
    };
  }, [user?.id, user?.mode]);

  async function signIn(credentials: { email: string; password: string }): Promise<AuthResult> {
    const email = credentials.email.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: credentials.password });
      if (error) return { success: false, message: error.message };
      if (data.user) setUser(fromSupabaseUser(data.user));
      return { success: true };
    }

    const account = demoAccounts.current.find((entry) => entry.email === email && entry.password === credentials.password);
    if (!account) return { success: false, message: 'No matching local demo account exists in this app session.' };
    setDemoUserProfile(account, setUser);
    return { success: true };
  }

  async function signUp(account: { name: string; email: string; password: string }): Promise<AuthResult> {
    const name = account.name.trim();
    const email = account.email.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: account.password,
        options: {
          emailRedirectTo: Linking.createURL('/'),
          data: { full_name: name },
        },
      });
      if (error) return { success: false, message: error.message };
      if (data.session?.user) setUser(fromSupabaseUser(data.session.user));
      return data.session
        ? { success: true }
        : { success: true, notice: 'Check your email to confirm the account, then sign in with it on the website or mobile app.' };
    }

    if (demoAccounts.current.some((entry) => entry.email === email)) {
      return { success: false, message: 'An account with that email already exists in this app session.' };
    }
    demoAccounts.current = [...demoAccounts.current, { name, email, password: account.password }];
    setDemoUserProfile({ name, email }, setUser);
    return { success: true };
  }

  function continueDemo() {
    setDemoUserProfile({ name: 'Demo User', email: 'demo@meditrack.ai' }, setUser);
  }

  async function signOut() {
    if (user?.mode === 'supabase' && user.id) {
      await deactivateDevicePushToken(user.id);
      if (supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      }
    }
    setUser(null);
    setPushRegistrationMessage('');
  }

  return (
    <AuthContext.Provider
      value={{ user, ready, supabaseConfigured, pushRegistrationMessage, signIn, signUp, continueDemo, signOut, registerPushToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}
