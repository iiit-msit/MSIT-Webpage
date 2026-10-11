import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AdminAuthContext = createContext(null);

/**
 * Get the canonical site URL for auth redirects.
 * Priority: VITE_SITE_URL env var > window.location.origin > hardcoded fallback.
 */
function getSiteUrl() {
  const envUrl = import.meta?.env?.VITE_SITE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://msit-webpage.vercel.app';
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

/**
 * Check if an email address is authorized for admin access.
 * Rules:
 * 1. TEMPORARY — DEVELOPMENT/TESTING ONLY: Any @getskills.io email address (e.g. sadhvik@getskills.io)
 * 2. Official database roles: Any email existing in public.admin_users
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isAuthorizedAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  
  // Explicitly authorized admin accounts and domains (@msitprogram.net, @getskills.io)
  const designatedAdmins = [
    'head@msitprogram.net',
    'dean@msitprogram.net',
    'varshithathorthi04@msitprogram.net',
    'sadhvik@getskills.io'
  ];

  if (
    designatedAdmins.includes(normalized) ||
    normalized.endsWith('@msitprogram.net') ||
    normalized.endsWith('@getskills.io')
  ) {
    return true;
  }

  return false;
}

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth state on mount and sync with Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        evaluateUser(session.user);
      } else {
        evaluateUser(null);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluateUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Evaluate whether a Supabase user has admin privileges.
   */
  const evaluateUser = async (user) => {
    if (!user || !user.email) {
      setAdminUser(null);
      setIsAdmin(false);
      setIsDevAdmin(false);
      return;
    }

    const email = user.email.toLowerCase();

    // 1. Check authorized admin email domains (@msitprogram.net or @getskills.io)
    if (isAuthorizedAdminEmail(email)) {
      setAdminUser(user);
      setIsAdmin(true);
      setIsDevAdmin(false);

      // Check if user requested admin login or arrived via magic link
      const authIntent = localStorage.getItem('msit_auth_intent') || sessionStorage.getItem('msit_auth_intent');
      if (authIntent === 'admin') {
        localStorage.removeItem('msit_auth_intent');
        sessionStorage.removeItem('msit_auth_intent');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/dashboard';
        }
      }
      return;
    }

    // 2. Check public.admin_users in Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('email, role')
          .eq('email', email)
          .maybeSingle();

        if (!error && data) {
          setAdminUser(user);
          setIsAdmin(true);
          setIsDevAdmin(false);
          return;
        }
      } catch (err) {
        // Table may not exist yet
      }
    }

    // User is logged in, but is NOT an authorized administrator
    setAdminUser(user);
    setIsAdmin(false);
    setIsDevAdmin(false);
  };

  /**
   * Request an Admin Magic Link via Supabase Auth.
   * Supabase Magic Link ONLY.
   * Does NOT auto-login; user MUST click the link in email or verify with OTP.
   *
   * @param {string} email
   * @returns {Promise<{ error: object|null }>}
   */
  const requestAdminMagicLink = async (email) => {
    if (!email) {
      return { error: { message: 'Administrator email is required.' } };
    }

    const normalized = email.trim().toLowerCase();

    try {
      localStorage.setItem('msit_auth_intent', 'admin');
      sessionStorage.setItem('msit_auth_intent', 'admin');
    } catch (e) {}

    if (!isAuthorizedAdminEmail(normalized)) {
      return {
        error: {
          message: 'Access Denied: Only authorized administrators (@msitprogram.net or @getskills.io) can access this portal.'
        }
      };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return {
        error: {
          message: 'Supabase authentication service is not configured. Please check your environment variables.'
        }
      };
    }

    try {
      const redirectUrl = `${getSiteUrl()}/admin`;

      let result = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: redirectUrl,
          data: { role: 'admin' }
        }
      });

      // Handle redirect URL allowlist fallback if Supabase rejects custom redirect URL
      if (result?.error?.message && (
        result.error.message.toLowerCase().includes('redirect') ||
        result.error.message.toLowerCase().includes('url')
      )) {
        result = await supabase.auth.signInWithOtp({
          email: normalized,
          options: {
            data: { role: 'admin' }
          }
        });
      }

      if (result?.error) {
        const isRateLimit = result.error.status === 429 || 
          result.error.code === 'over_email_send_rate_limit' || 
          result.error.message?.toLowerCase().includes('rate limit');
        
        if (isRateLimit) {
          return {
            error: {
              ...result.error,
              isRateLimit: true,
              message: 'Email dispatch rate limit reached. Please wait a few minutes before requesting another link.'
            }
          };
        }
      }

      return result;
    } catch (err) {
      const isRateLimit = err.status === 429 || 
        err.code === 'over_email_send_rate_limit' || 
        err.message?.toLowerCase().includes('rate limit');

      return { 
        error: { 
          message: isRateLimit
            ? 'Email dispatch rate limit reached. Please wait a few minutes before requesting another link.'
            : (err.message || 'Failed to dispatch magic link. Please check your internet connection and retry.'),
          isRateLimit
        } 
      };
    }
  };

  /**
   * Verify 6-digit OTP code for email sign-in (if received via Supabase email).
   *
   * @param {string} email
   * @param {string} token
   * @returns {Promise<{ data: object|null, error: object|null }>}
   */
  const verifyAdminOtp = async (email, token) => {
    if (!email || !token) {
      return { error: { message: 'Email and OTP token are required.' } };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return { error: { message: 'Supabase authentication service is not configured.' } };
    }

    try {
      const result = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type: 'email'
      });

      if (!result.error && result.data?.user) {
        await evaluateUser(result.data.user);
      }

      return result;
    } catch (err) {
      return { error: { message: err.message || 'Failed to verify OTP code.' } };
    }
  };

  /**
   * Admin Sign Out.
   */
  const adminSignOut = async () => {
    try {
      localStorage.removeItem('msit_auth_intent');
      sessionStorage.removeItem('msit_auth_intent');
    } catch (e) {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }

    setAdminUser(null);
    setIsAdmin(false);
    setIsDevAdmin(false);
  };

  const value = {
    adminUser,
    isAdmin,
    isDevAdmin,
    loading,
    requestAdminMagicLink,
    verifyAdminOtp,
    adminSignOut,
    testAccountEmail: 'head@msitprogram.net'
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
