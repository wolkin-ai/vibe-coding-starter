# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vibe Coding Starter** is a beginner-friendly React + TypeScript template optimized for AI-assisted development. It uses a **Feature-first Lite** architecture that organizes code by feature rather than by file type, making it easier for both humans and AI to navigate and extend.

## Architecture: Feature-first Lite

```
src/
  app/           # Pages and routing (UI outlets)
  features/      # Feature folders (main workspace)
    <feature>/
      api.ts      # Supabase API calls
      hooks.ts    # React Query hooks
      schema.ts   # Zod validation
      types.ts    # TypeScript type definitions
      components/ # Feature-specific UI components
      index.ts    # Public exports
  shared/        # Shared components and utilities
    ui/          # Reusable UI components (Button, Input, Card)
    lib/         # Configuration (env.ts, supabase.ts, utils.ts)
    config.ts    # Global constants
    types/       # Common type definitions (including supabase.ts)
```

### Existing Features

- **todo**: Example todo application with full CRUD operations
- **auth**: Authentication utilities
- **salon**: Beauty salon project management (legacy)
- **catalog**: AI-powered beauty catalog with Gemini integration for image generation

## Technology Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** - Fast development server
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend (database, auth, real-time)
- **React Query** (@tanstack/react-query) - Data fetching and caching
- **React Hook Form** + **Zod** - Form handling and validation
- **React Router** - Client-side routing
- **Google GenAI** (@google/genai) - AI image generation (catalog feature)

## Development Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production (runs typecheck first)
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check for lint errors
npm run lint:fix     # Auto-fix lint errors
npm run typecheck    # Run TypeScript type checking
npm run format       # Format code with Prettier

# Database (Supabase)
npm run db:link      # Link to Supabase project
npm run db:types     # Generate TypeScript types from database schema
npm run db:status    # List Supabase projects
```

## Critical Rules (MUST Follow)

### 1. No Hardcoding

- Environment variables: Use `src/shared/lib/env.ts` only
- Constants: Use `src/shared/config.ts`
- Never embed API keys, URLs, or magic numbers directly

### 2. No `any` Type

- `@typescript-eslint/no-explicit-any: error` is enforced
- Use `unknown` with proper type guards if type is unclear
- All functions must have explicit return types

### 3. No Direct Supabase Access in Components

- Components must never import `supabase` directly
- Always use `features/*/api.ts` → `features/*/hooks.ts` pattern
- React Query handles all data fetching

### 4. Feature Independence

- Features cannot directly import from other features (except via `shared/`)
- Each feature is a self-contained module
- Shared code belongs in `shared/`

## Adding a New Feature

Follow this exact order:

1. **Create folder**: `src/features/<feature-name>/`
2. **Create files in order**:
   - `types.ts` - Type definitions from Supabase + business logic types
   - `schema.ts` - Zod validation schemas
   - `api.ts` - CRUD operations with error handling
   - `hooks.ts` - React Query hooks (useQuery, useMutation)
   - `components/` - UI components
   - `index.ts` - Export public API
3. **Create page**: `src/app/<feature-name>/` for routing
4. **Update database**: Add Supabase table and RLS policies if needed

### Example API Pattern

```typescript
// features/<name>/api.ts
import { supabase } from '@/shared/lib/supabase';
import type { Item } from './types';

export async function fetchItems(): Promise<Item[]> {
  // Always check authentication
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.from('items').select('*').eq('user_id', user.user.id);

  // Always handle errors explicitly
  if (error) {
    throw new Error(`Failed to fetch items: ${error.message}`);
  }

  return data ?? [];
}
```

### Example React Query Hook Pattern

```typescript
// features/<name>/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchItems, addItem } from './api';

const ITEMS_KEY = ['items'] as const;

export function useItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: fetchItems,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}
```

## Catalog Feature (AI Image Generation)

The `catalog` feature uses Google's Gemini API for generating beauty salon catalog images:

- **Image generation**: Uses `@google/genai` SDK with `gemini-2.5-flash-image` model
- **Diversity system**: 9 variation categories (expressions, poses, accessories, lighting, backgrounds, makeup, environments, storytelling, camera settings) with 10-12 options each
- **Uniqueness**: Generates 21+ trillion unique combinations using randomization + UUID + timestamp
- **Generation patterns**:
  - `generateCutModel()`: Generate model photos
  - `generateStyleWithModel()`: Generate hairstyle variations on existing models
  - `generateStylesBatch()`: Batch generate multiple styles
  - `generateStyleTransfer()`: Transfer style to reference image

Key files:

- `src/features/catalog/api/gemini.ts`: Core generation logic with diversity system
- `src/features/catalog/types.ts`: Type definitions for models, styles, moods
- `src/features/catalog/components/`: UI components for catalog management

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Set Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. For catalog feature, add:
   ```env
   VITE_GOOGLE_API_KEY=your-google-api-key
   ```

## Database Schema Updates

When updating Supabase schema:

1. Make changes in Supabase dashboard or via SQL
2. Regenerate types: `npm run db:types`
3. Update affected `features/*/types.ts` files
4. Update API functions in `features/*/api.ts`
5. Test with TypeScript: `npm run typecheck`

## Code Quality Enforcement

- **Pre-commit hooks** (husky + lint-staged):
  - Auto-fix ESLint errors
  - Format with Prettier
  - Run TypeScript type checking
  - Fails commit if errors exist

## Import Conventions

```typescript
// 1. External dependencies
import React from 'react';
import { z } from 'zod';

// 2. Internal imports with @/ alias
import { Button } from '@/shared/ui';
import { useTodos } from '@/features/todo/hooks';

// 3. Relative imports
import type { LocalType } from './types';
```

## Styling

- **Tailwind CSS only** - No custom CSS except in `src/styles/globals.css`
- Use `cn()` utility from `@/shared/lib/utils` for conditional classes
- Follow Tailwind plugin order enforced by ESLint

## Common Patterns

### Error Handling in Components

```typescript
export function ItemList() {
  const { data, isLoading, error } = useItems();

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          Failed to load items. Please try again.
        </p>
      </div>
    );
  }

  return <div>{/* Render items */}</div>;
}
```

### Form Validation with Zod

```typescript
// schema.ts
export const itemInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
});

export type ItemInput = z.infer<typeof itemInputSchema>;

// In component
const validatedData = itemInputSchema.parse(formData);
```

## Tasks Requiring Approval

Before implementing, ask the user first:

- Supabase schema changes or RLS policy modifications
- Feature-first architecture changes
- Adding new external dependencies
- Security-related changes
- Major refactoring affecting multiple features
