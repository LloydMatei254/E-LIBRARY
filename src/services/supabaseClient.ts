import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createSupabaseClient = (): SupabaseClient<Database> | null => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
};

const client = createSupabaseClient();

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!client) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return client;
};
