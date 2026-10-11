import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta?.env?.VITE_SUPABASE_URL || 
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_URL || 
  'https://gejmwadyksjzfrcwjcaj.supabase.co';

const supabaseAnonKey = 
  import.meta?.env?.VITE_SUPABASE_ANON_KEY || 
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  import.meta?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'sb_publishable_a8pcAYpEVcah3RCCEmYFBQ_VKFy2aLZ';

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Check whether Supabase is properly configured.
 * Components use this to show appropriate fallback UI.
 */
export const isSupabaseConfigured = () => !!supabase;
