# 🤝 Contributing to Vibe Coding Starter

This guide helps both **human developers** and **AI assistants** contribute to this project effectively.

## 🎯 Core Principles

1. **Feature-first organization** - Group by features, not file types
2. **Type safety** - TypeScript strict mode, no `any` allowed
3. **Consistency** - Follow established patterns
4. **Simplicity** - Prefer simple, readable solutions
5. **AI-friendly** - Clear structure that AI can understand and extend

## 📁 Project Structure Rules

### Directory Organization

```
src/
  app/                 # ✅ Pages and routing only
  features/            # ✅ Feature-specific code (main workspace)
    <feature-name>/
      components/      # UI components for this feature
      api.ts          # Database/API calls (Supabase)
      hooks.ts        # React Query hooks
      schema.ts       # Validation schemas (zod)
      types.ts        # TypeScript type definitions
      index.ts        # Feature exports
  shared/             # ✅ Shared utilities and components
    ui/               # Reusable UI components
    lib/              # Utilities and configuration
    config.ts         # Global constants (NO hardcoding elsewhere)
    types/            # Shared type definitions
```

### ✅ What Goes Where

| File Type     | Location                | Purpose                                     |
| ------------- | ----------------------- | ------------------------------------------- |
| Pages         | `src/app/`              | Route components, layout, navigation        |
| Feature logic | `src/features/*/`       | Business logic, feature-specific components |
| Reusable UI   | `src/shared/ui/`        | Button, Input, Card, etc.                   |
| Configuration | `src/shared/lib/env.ts` | Environment variables (zod-validated)       |
| Constants     | `src/shared/config.ts`  | Global constants and settings               |
| Types         | `src/shared/types/`     | Shared type definitions                     |

## 🔒 Strict Rules (Never Break These)

### 1. No Hardcoding

❌ **Wrong:**

```typescript
const apiUrl = 'https://api.example.com';
const pageSize = 20;
```

✅ **Correct:**

```typescript
import { env } from '@/shared/lib/env';
import { ui } from '@/shared/config';

const apiUrl = env.VITE_API_URL;
const pageSize = ui.defaultPageSize;
```

### 2. No `any` Type

❌ **Wrong:**

```typescript
function handleData(data: any) {
  return data.whatever;
}
```

✅ **Correct:**

```typescript
import { z } from 'zod';

const dataSchema = z.object({
  whatever: z.string(),
});

function handleData(data: unknown) {
  const parsed = dataSchema.parse(data);
  return parsed.whatever;
}
```

### 3. Database Access Through `api.ts`

❌ **Wrong (in a component):**

```typescript
const { data } = await supabase.from('todos').select('*');
```

✅ **Correct:**

```typescript
// In features/todo/api.ts
export async function listTodos() {
  const { data, error } = await supabase.from('todos').select('*');
  if (error) throw error;
  return data;
}

// In component
import { useTodos } from './hooks';
const { data } = useTodos();
```

### 4. Validation with Zod

❌ **Wrong:**

```typescript
function createTodo(title: string) {
  // Hope title is valid...
  return api.create({ title });
}
```

✅ **Correct:**

```typescript
import { todoInputSchema } from './schema';

function createTodo(input: unknown) {
  const validated = todoInputSchema.parse(input);
  return api.create(validated);
}
```

## 🎨 Coding Standards

### TypeScript Configuration

- Use **strict mode** - `"strict": true`
- Enable additional strict checks:
  - `"exactOptionalPropertyTypes": true`
  - `"noUncheckedIndexedAccess": true`
  - `"useUnknownInCatchVariables": true`

### Import Organization

Imports should be organized in this order (enforced by ESLint):

```typescript
// 1. Node modules
import React from 'react';
import { z } from 'zod';

// 2. Internal imports (with @/ alias)
import { Button } from '@/shared/ui';
import { useTodos } from './hooks';

// 3. Relative imports
import './styles.css';
```

### Naming Conventions

| Type                | Convention       | Example                    |
| ------------------- | ---------------- | -------------------------- |
| Files               | kebab-case       | `todo-form.tsx`            |
| Components          | PascalCase       | `TodoForm`                 |
| Variables/Functions | camelCase        | `fetchTodos`, `isLoading`  |
| Constants           | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`        |
| Types/Interfaces    | PascalCase       | `TodoInput`, `ApiResponse` |

## 🚀 Adding New Features

### Step-by-Step Process

1. **Create feature directory:**

   ```bash
   mkdir src/features/my-feature
   cd src/features/my-feature
   ```

2. **Create core files:**

   ```bash
   touch api.ts hooks.ts schema.ts types.ts index.ts
   mkdir components
   ```

3. **Define types first (`types.ts`):**

   ```typescript
   export interface MyFeatureItem {
     id: string;
     name: string;
     createdAt: string;
   }
   ```

4. **Create validation schemas (`schema.ts`):**

   ```typescript
   import { z } from 'zod';

   export const myFeatureInputSchema = z.object({
     name: z.string().min(1).max(100),
   });

   export type MyFeatureInput = z.infer<typeof myFeatureInputSchema>;
   ```

5. **Implement API calls (`api.ts`):**

   ```typescript
   import { supabase } from '@/shared/lib/supabase';
   import { myFeatureInputSchema } from './schema';

   export async function listItems() {
     const { data, error } = await supabase.from('my_feature_items').select('*');
     if (error) throw error;
     return data;
   }
   ```

6. **Create React Query hooks (`hooks.ts`):**

   ```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { listItems, createItem } from './api';

   export function useItems() {
     return useQuery({
       queryKey: ['myFeature', 'items'],
       queryFn: listItems,
     });
   }
   ```

7. **Build components (`components/`):**

   ```typescript
   import { useItems } from '../hooks';

   export function ItemList() {
     const { data, isLoading } = useItems();
     // Component implementation...
   }
   ```

8. **Export from feature (`index.ts`):**

   ```typescript
   export * from './components';
   export * from './hooks';
   export * from './types';
   export * from './schema';
   ```

9. **Create page in `app/`:**

   ```typescript
   import { ItemList } from '@/features/my-feature';

   export default function MyFeaturePage() {
     return <ItemList />;
   }
   ```

## 🧪 Code Quality Checks

Before committing, ensure all checks pass:

```bash
npm run typecheck    # TypeScript compilation
npm run lint         # ESLint checks
npm run format       # Prettier formatting
```

### Pre-commit Hooks

This project uses **Husky** to run checks automatically:

1. **Type checking** - No TypeScript errors
2. **Linting** - ESLint passes with 0 warnings
3. **Formatting** - Code is properly formatted

## 🤖 AI Assistant Guidelines

When working with AI assistants on this project:

### ✅ Good AI Prompts

- "Add a new component in `src/features/todo/components/` that shows todo statistics using the existing `useTodos` hook"
- "Create a new feature for user profiles in `src/features/profile/` following the same pattern as the todo feature"
- "Add validation to the todo schema to require at least 3 characters for the title"

### 🎯 Helpful Context to Provide

When asking AI for help, include:

1. **Which feature** you're working on
2. **Existing patterns** to follow ("like the todo feature")
3. **Specific files** to modify or create
4. **Type requirements** ("make sure it's type-safe")

### 🚫 What to Avoid

- Don't ask AI to restructure the entire project
- Don't bypass the established patterns
- Don't create new architectural patterns without discussion
- Don't ignore TypeScript errors

## 🔧 Environment Setup

### Required Environment Variables

All environment variables must be defined in `src/shared/lib/env.ts`:

```typescript
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  // Add new variables here
});
```

### Global Configuration

All app-wide constants go in `src/shared/config.ts`:

```typescript
export const AppConfig = {
  // Add new constants here, never hardcode elsewhere
  api: {
    timeoutMs: 15000,
  },
  ui: {
    defaultPageSize: 20,
  },
} as const;
```

## 🐛 Error Handling

### Standard Error Handling Pattern

```typescript
// In API functions
export async function apiFunction() {
  const { data, error } = await supabase.from('table').select();
  if (error) {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
  return data;
}

// In React Query hooks
export function useData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: apiFunction,
    onError: (error) => {
      console.error('Data fetch error:', error);
    },
  });
}
```

## 📚 Git Workflow

### Commit Message Format

Use **Conventional Commits**:

```
feat: add todo filtering functionality
fix: resolve todo deletion bug
chore: update ESLint configuration
docs: add API documentation
```

### Branch Naming

```
feature/todo-filtering
fix/todo-deletion-bug
chore/eslint-update
```

## 🧪 Testing Guidelines

### File Organization

```
src/
  features/
    todo/
      __tests__/
        api.test.ts
        hooks.test.ts
        components/
          TodoForm.test.tsx
```

### Testing Patterns

```typescript
// API tests
describe('Todo API', () => {
  it('should fetch todos', async () => {
    const todos = await listTodos();
    expect(todos).toBeInstanceOf(Array);
  });
});

// Component tests
describe('TodoForm', () => {
  it('should submit valid todo', async () => {
    render(<TodoForm />);
    // Test implementation...
  });
});
```

## 🚨 Common Pitfalls

### For Beginners

1. **Don't mix concerns** - Keep pages in `app/`, logic in `features/`
2. **Don't skip validation** - Always use zod schemas
3. **Don't hardcode values** - Use `env.ts` and `config.ts`
4. **Don't ignore TypeScript errors** - Fix them, don't suppress them

### For AI Assistants

1. **Don't create files outside the established structure**
2. **Don't modify core configuration without explicit instruction**
3. **Don't use `any` type, ever**
4. **Don't skip import organization**

## 📞 Getting Help

1. **Check existing patterns** - Look at the todo feature for examples
2. **Read error messages** - TypeScript and ESLint provide helpful guidance
3. **Use the type system** - Let TypeScript guide you to correct usage
4. **Follow the file structure** - When in doubt, mimic existing organization

---

Remember: This project is designed to be **beginner-friendly** while maintaining **professional standards**. When in doubt, prefer simplicity and consistency over clever solutions.
