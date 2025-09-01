import { createClient } from '@supabase/supabase-js';

import { env } from './env';

import type { Database } from '../types/supabase';

/**
 * Supabase client for Vibe Coding Starter
 *
 * This is the centralized Supabase client. All database interactions
 * should go through this client to ensure consistency.
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Export types for convenience
export type { Database } from '../types/supabase';
