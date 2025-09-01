import { z } from 'zod';

/**
 * Todo validation schemas
 *
 * This is the single source of truth for todo data validation.
 * Used for both client-side forms and API validation.
 */

export const todoInputSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください')
    .trim(),
});

export const todoUpdateSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください')
    .trim()
    .optional(),
  completed: z.boolean().optional(),
});

// Inferred types for use throughout the app
export type TodoInput = z.infer<typeof todoInputSchema>;
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;
