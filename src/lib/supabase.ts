import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ckcmvlbobfitcagyxtdz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY212bGJvYmZpdGNhZ3l4dGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTQ2NzcsImV4cCI6MjEwNTA3MDY3N30.tYjgsmtaz7onN8gdTyk7dJFqSNy37qAPN7qiwtnL7ms';

export function getSupabaseUrl(): string {
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    localStorage.getItem('cubic_supabase_url') ||
    DEFAULT_SUPABASE_URL
  );
}

export function getSupabaseAnonKey(): string {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('cubic_supabase_anon_key') ||
    DEFAULT_SUPABASE_ANON_KEY
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}
