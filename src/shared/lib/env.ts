import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  VITE_APP_NAME: z.string().optional().default('Vibe Coding Starter'),
});

export const env = envSchema.parse(import.meta.env);

// Type-safe environment variables for Vibe Coding
export type Environment = z.infer<typeof envSchema>;
