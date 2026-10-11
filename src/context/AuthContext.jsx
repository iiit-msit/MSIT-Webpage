import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

/**
 * Get the canonical site URL for auth redirects.
 * Priority: VITE_SITE_URL env var > window.location.origin > hardcoded fallback.
 * This prevents magic-link emails from redirecting to localhost:3000.
 */
function getSiteUrl(targetPath = '/programme') {
  // 1. Env var set in Vercel / .env (most reliable for deployed environments)
  const envUrl = import.meta?.env?.VITE_SITE_URL;
  let base = 'https://msit.ac.in';
  if (envUrl) {
    base = envUrl.replace(/\/+$/, '');
  } else if (typeof window !== 'undefined' && window.location.origin) {
    // 2. Runtime origin (e.g. http://localhost:3000, or current custom domain)
    base = window.location.origin;
  }

  const cleanPath = targetPath ? (targetPath.startsWith('/') ? targetPath : `/${targetPath}`) : '';
  return `${base}${cleanPath}`;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      try {
        const savedUser = localStorage.getItem('msit_auth_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setSession({ user: parsed, access_token: 'local-demo-token' });
        }
      } catch (e) {
        console.error('Failed to load local auth session:', e);
      }
      setLoading(false);
      return;
    }

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Send OTP to the given email address via Supabase Auth (or simulated fallback).
   * @param {string} email
   * @param {string} fullName
   * @returns {{ data: object|null, error: object|null }}
   */
  const signInWithOtp = async (email, fullName = '', redirectTo = '/programme') => {
    if (!isSupabaseConfigured()) {
      // Store pending lead locally so it persists even in preview mode
      try {
        const pending = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          requestedAt: new Date().toISOString()
        };
        sessionStorage.setItem('msit_pending_auth', JSON.stringify(pending));
      } catch (e) {
        // ignore
      }
      return { data: { message: 'Verification code generated' }, error: null };
    }

    try {
      let result = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: getSiteUrl(redirectTo),
          data: {
            full_name: fullName
          }
        }
      });

      // If Supabase rejects because the domain is not in the Redirect URLs allowlist,
      // retry without emailRedirectTo so the OTP email is still sent directly to user's inbox!
      if (result?.error?.message && (
        result.error.message.toLowerCase().includes('redirect') ||
        result.error.message.toLowerCase().includes('url')
      )) {
        console.warn('[MSIT] Redirect URL rejected by Supabase, retrying without emailRedirectTo:', result.error.message);
        result = await supabase.auth.signInWithOtp({
          email,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
      }

      return result;
    } catch (err) {
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
        // Automatic retry once in case of a temporary network blip
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const retryResult = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: getSiteUrl(redirectTo),
              data: {
                full_name: fullName
              }
            }
          });
          if (retryResult && !retryResult.error) {
            return retryResult;
          }
        } catch (retryErr) {
          // fall through to error return below
        }

        return {
          data: null,
          error: {
            message: 'Unable to connect to authentication service. Please check your internet connection or disable ad-blockers and try again.'
          }
        };
      }

      return { data: null, error: { message: err.message || 'An unexpected error occurred.' } };
    }
  };

  /**
   * Verify the OTP code for the given email.
   * @param {string} email
   * @param {string} token - The OTP code
   * @returns {{ data: object|null, error: object|null }}
   */
  const verifyOtp = async (email, token) => {
    if (!isSupabaseConfigured()) {
      let fullName = '';
      try {
        const pending = JSON.parse(sessionStorage.getItem('msit_pending_auth') || '{}');
        fullName = pending.fullName || '';
      } catch (e) {}

      const mockUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 10),
        email: email.trim().toLowerCase(),
        user_metadata: {
          full_name: fullName || 'Prospective Student'
        }
      };

      try {
        localStorage.setItem('msit_auth_user', JSON.stringify(mockUser));
        const leads = JSON.parse(localStorage.getItem('msit_intake_leads') || '[]');
        leads.unshift({
          email: mockUser.email,
          fullName: fullName,
          verifiedAt: new Date().toISOString()
        });
        localStorage.setItem('msit_intake_leads', JSON.stringify(leads.slice(0, 50)));
      } catch (e) {}

      setUser(mockUser);
      setSession({ user: mockUser, access_token: 'local-demo-token' });
      return { data: { user: mockUser }, error: null };
    }

    try {
      const result = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      return result;
    } catch (err) {
      return { data: null, error: { message: err.message || 'An unexpected error occurred.' } };
    }
  };

  /**
   * Sign out the current user and clear session.
   */
  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      try {
        localStorage.removeItem('msit_auth_user');
        sessionStorage.removeItem('msit_pending_auth');
      } catch (e) {}
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithOtp,
    verifyOtp,
    signOut,
    isConfigured: isSupabaseConfigured(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
