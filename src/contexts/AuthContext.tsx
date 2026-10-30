/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ error?: string; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signIn: async () => ({ error: 'Auth not initialized' }),
  signUp: async () => ({ error: 'Auth not initialized' }),
  signOut: async () => {},
  resetPassword: async () => ({ error: 'Auth not initialized' }),
  signInWithGoogle: async () => ({ error: 'Auth not initialized' }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const client = getSupabaseClient();

      // Retrieve initial session
      client.auth
        .getSession()
        .then(({ data, error }) => {
          if (!error && data?.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Supabase auth session fetch warning:', err);
          setLoading(false);
        });

      // Listen for authentication state changes (sign in, sign out, token refresh)
      const { data: authListener } = client.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch (err) {
      console.warn('Supabase auth initialization error:', err);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Authentication is not configured. Supabase credentials are missing.' };
    }
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'An unexpected error occurred during login.' };
    }
  };

  const signUp = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ error?: string; confirmationRequired?: boolean }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Authentication is not configured. Supabase credentials are missing.' };
    }
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Check if session was returned immediately (auto-confirmed) or email confirmation is pending
      const confirmationRequired = !data.session;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      return { confirmationRequired };
    } catch (err: any) {
      return { error: err?.message || 'An unexpected error occurred during registration.' };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return;
    }
    try {
      const client = getSupabaseClient();
      await client.auth.signOut();
    } catch (err) {
      console.warn('Error signing out:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ error?: string; message?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Authentication is not configured. Supabase credentials are missing.' };
    }
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/#login',
      });
      if (error) {
        return { error: error.message };
      }
      return {
        message: 'Password reset instructions have been dispatched to your email address.',
      };
    } catch (err: any) {
      return { error: err?.message || 'Unable to process password reset request.' };
    }
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Authentication is not configured. Supabase credentials are missing.' };
    }
    try {
      // Remember where the visitor wanted to go; App restores it after the Google round trip.
      const hash = window.location.hash;
      if (hash && hash !== '#login' && hash !== '#signup') {
        sessionStorage.setItem('vq:redirect', hash);
      }
      const client = getSupabaseClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/' },
      });
      if (error) return { error: error.message };
      return {}; // browser is being redirected to Google
    } catch (err: any) {
      return { error: err?.message || 'Unable to start Google sign-in.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
