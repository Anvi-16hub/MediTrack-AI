import { createContext } from 'react';

export type AuthUser = {
  id: string | null;
  name: string;
  email: string;
  mode: 'supabase' | 'demo';
};

export type AuthResult = { success: boolean; message?: string; notice?: string };

export type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  supabaseConfigured: boolean;
  pushRegistrationMessage: string;
  signIn: (credentials: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (account: { name: string; email: string; password: string }) => Promise<AuthResult>;
  continueDemo: () => void;
  signOut: () => Promise<void>;
  registerPushToken: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
