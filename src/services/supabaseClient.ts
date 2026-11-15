import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const cleanEnv = (value: string | undefined): string | undefined =>
  value?.trim().replace(/^(['"])(.*)\1$/, '$2').trim();

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL)?.replace(/\/+$/, '');
const supabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
const demoModeEnv = cleanEnv(import.meta.env.VITE_DEMO_MODE);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isDemoMode = demoModeEnv === 'true'
  || (demoModeEnv !== 'false' && !isSupabaseConfigured);

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
