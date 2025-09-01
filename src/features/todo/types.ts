import type { Database } from '@/shared/types/supabase';

/**
 * Todo-related types
 *
 * These are derived from the Supabase schema and input schemas.
 */

// Extract todo types from Supabase schema
type Tables = Database['public']['Tables'];

export type Todo = Tables['todos']['Row'];
export type TodoInsert = Tables['todos']['Insert'];
export type TodoUpdate = Tables['todos']['Update'];

// Additional computed types
export interface TodoWithUser extends Todo {
  profiles?: {
    display_name: string | null;
  };
}

// UI state types
export interface TodoFormState {
  isSubmitting: boolean;
  error: string | null;
}
