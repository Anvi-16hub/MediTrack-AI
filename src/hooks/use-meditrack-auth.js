import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const initialDemoUsers = [
  { name: 'Demo User', email: 'demo@meditrack.ai', password: 'Demo123!' },
];

function fromSupabaseUser(authUser) {
  return {
    id: authUser.id,
    name: authUser.user_metadata?.full_name || authUser.email || 'MediTrack user',
    email: authUser.email || '',
    mode: 'supabase',
  };
}

function syncUserTimezone(userId) {
  if (!supabase) return;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone) void supabase.from('profiles').update({ timezone }).eq('id', userId);
}

export function useMediTrackAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const demoUsers = useRef(initialDemoUsers);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ? fromSupabaseUser(session.user) : null);
      if (session?.user) syncUserTimezone(session.user.id);
      setReady(true);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.warn('Could not restore the Supabase session:', error.message);
      setUser(data.session?.user ? fromSupabaseUser(data.session.user) : null);
      if (data.session?.user) syncUserTimezone(data.session.user.id);
      setReady(true);
    }).catch((error) => {
      if (!active) return;
      console.warn('Could not restore the Supabase session:', error);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) return { success: false, message: error.message };
      if (data.user) {
        setUser(fromSupabaseUser(data.user));
        syncUserTimezone(data.user.id);
        void supabase.functions.invoke('dispatch-notifications').catch(() => {});
      }
      return { success: true };
    }

    const account = demoUsers.current.find((candidate) => candidate.email === normalizedEmail && candidate.password === password);
    if (!account) return { success: false, message: 'Email or password is incorrect. Demo accounts exist only in this browser session.' };
    setUser({ name: account.name, email: account.email, mode: 'demo' });
    return { success: true };
  }

  async function signUp({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: normalizedName },
        },
      });
      if (error) return { success: false, message: error.message };
      if (data.session?.user) {
        setUser(fromSupabaseUser(data.session.user));
        syncUserTimezone(data.session.user.id);
        void supabase.functions.invoke('dispatch-notifications').catch(() => {});
      }
      return data.session
        ? { success: true }
        : { success: true, notice: 'Check your email to confirm this account, then sign in with the same account on mobile.' };
    }

    if (demoUsers.current.some((candidate) => candidate.email === normalizedEmail)) {
      return { success: false, message: 'An account with this email already exists in this browser session.' };
    }
    demoUsers.current = [...demoUsers.current, { name: normalizedName, email: normalizedEmail, password }];
    setUser({ name: normalizedName, email: normalizedEmail, mode: 'demo' });
    return { success: true };
  }

  function continueDemo() {
    setUser({ name: 'Demo User', email: 'demo@meditrack.ai', mode: 'demo' });
  }

  async function signOut() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
  }

  return { user, ready, supabaseConfigured, signIn, signUp, continueDemo, signOut };
}
