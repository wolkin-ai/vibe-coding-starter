# 🤝 Vibe Coding Starter への貢献

このガイドは、**人間の開発者**と**AIアシスタント**の両方がこのプロジェクトに効果的に貢献するためのものです。

## 🎯 基本原則

1. **Feature-first組織** - ファイルタイプではなく機能でグループ化
2. **型安全性** - TypeScript strict mode、`any`は禁止
3. **一貫性** - 確立されたパターンに従う
4. **シンプルさ** - シンプルで読みやすいソリューションを優先
5. **AI対応** - AIが理解・拡張できる明確な構造

## 📁 プロジェクト構造ルール

### ディレクトリ構成

```
src/
  app/                 # ✅ ページとルーティングのみ
  features/            # ✅ 機能固有のコード（メインワークスペース）
    <feature-name>/
      components/      # この機能のUIコンポーネント
      api.ts          # データベース/API呼び出し（Supabase）
      hooks.ts        # React Queryフック
      schema.ts       # バリデーションスキーマ（zod）
      types.ts        # TypeScript型定義
      index.ts        # 機能のエクスポート
  shared/             # ✅ 共有ユーティリティとコンポーネント
    ui/               # 再利用可能なUIコンポーネント
    lib/              # ユーティリティと設定
    config.ts         # グローバル定数（他の場所でハードコーディング禁止）
    types/            # 共有型定義
```

### ✅ 何をどこに置くか

| ファイルタイプ | 場所                    | 目的                                             |
| -------------- | ----------------------- | ------------------------------------------------ |
| ページ         | `src/app/`              | ルートコンポーネント、レイアウト、ナビゲーション |
| 機能ロジック   | `src/features/*/`       | ビジネスロジック、機能固有のコンポーネント       |
| 再利用可能UI   | `src/shared/ui/`        | Button、Input、Cardなど                          |
| 設定           | `src/shared/lib/env.ts` | 環境変数（zod検証済み）                          |
| 定数           | `src/shared/config.ts`  | グローバル定数と設定                             |
| 型             | `src/shared/types/`     | 共有型定義                                       |

## 🔒 厳格なルール（絶対に破ってはいけない）

### 1. ハードコーディング禁止

❌ **間違い:**

```typescript
const apiUrl = 'https://api.example.com';
const pageSize = 20;
```

✅ **正しい:**

```typescript
import { env } from '@/shared/lib/env';
import { ui } from '@/shared/config';

const apiUrl = env.VITE_API_URL;
const pageSize = ui.defaultPageSize;
```

### 2. `any`型の禁止

❌ **間違い:**

```typescript
function handleData(data: any) {
  return data.whatever;
}
```

✅ **正しい:**

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

### 3. データベースアクセスは`api.ts`経由

❌ **間違い（コンポーネント内で）:**

```typescript
const { data } = await supabase.from('todos').select('*');
```

✅ **正しい:**

```typescript
// features/todo/api.ts 内
export async function listTodos() {
  const { data, error } = await supabase.from('todos').select('*');
  if (error) throw error;
  return data;
}

// コンポーネント内
import { useTodos } from './hooks';
const { data } = useTodos();
```

### 4. Zodによるバリデーション

❌ **間違い:**

```typescript
function createTodo(title: string) {
  // titleが有効であることを祈る...
  return api.create({ title });
}
```

✅ **正しい:**

```typescript
import { todoInputSchema } from './schema';

function createTodo(input: unknown) {
  const validated = todoInputSchema.parse(input);
  return api.create(validated);
}
```

## 🎨 コーディング規約

### TypeScript設定

- **strict mode**を使用 - `"strict": true`
- 追加の厳格チェックを有効化:
  - `"exactOptionalPropertyTypes": true`
  - `"noUncheckedIndexedAccess": true`
  - `"useUnknownInCatchVariables": true`

### インポート組織

インポートは以下の順序で整理する（ESLintで強制）:

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

### 命名規約

| タイプ              | 規約             | 例                         |
| ------------------- | ---------------- | -------------------------- |
| ファイル            | kebab-case       | `todo-form.tsx`            |
| コンポーネント      | PascalCase       | `TodoForm`                 |
| 変数/関数           | camelCase        | `fetchTodos`, `isLoading`  |
| 定数                | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`        |
| 型/インターフェース | PascalCase       | `TodoInput`, `ApiResponse` |

## 🚀 新機能の追加

### ステップバイステップのプロセス

1. **機能ディレクトリの作成:**

   ```bash
   mkdir src/features/my-feature
   cd src/features/my-feature
   ```

2. **コアファイルの作成:**

   ```bash
   touch api.ts hooks.ts schema.ts types.ts index.ts
   mkdir components
   ```

3. **最初に型を定義（`types.ts`）:**

   ```typescript
   export interface MyFeatureItem {
     id: string;
     name: string;
     createdAt: string;
   }
   ```

4. **バリデーションスキーマの作成（`schema.ts`）:**

   ```typescript
   import { z } from 'zod';

   export const myFeatureInputSchema = z.object({
     name: z.string().min(1).max(100),
   });

   export type MyFeatureInput = z.infer<typeof myFeatureInputSchema>;
   ```

5. **API呼び出しの実装（`api.ts`）:**

   ```typescript
   import { supabase } from '@/shared/lib/supabase';
   import { myFeatureInputSchema } from './schema';

   export async function listItems() {
     const { data, error } = await supabase.from('my_feature_items').select('*');
     if (error) throw error;
     return data;
   }
   ```

6. **React Queryフックの作成（`hooks.ts`）:**

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
