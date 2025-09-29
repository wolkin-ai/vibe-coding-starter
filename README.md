# 🚀 Vibe Coding Starter

**Vibe Coding** スタイル（AIが開発を支援するプログラミング手法）に最適化された、初心者向けの React + TypeScript テンプレートです。作りたいものを説明するだけで、AIがその実装をサポートします。

## ✨ Vibe Coding とは？

Vibe Coding とは、作りたいものの「雰囲気」や「感覚」を言葉で表現し、AIを活用して実装を進める開発手法です。このスターターテンプレートは、初心者でもAIでも扱いやすい堅固な基盤を提供します。

## 🏗️ アーキテクチャ：Feature-first Lite

このプロジェクトは学習に最適化されたシンプルな「Feature-first」アーキテクチャを採用しています：

```
src/
  app/           # 📄 ページとルーティング
  features/      # 🎯 機能（メインワークスペース）
    todo/        # 例：Todo機能
      components/    # この機能専用のUIコンポーネント
      api.ts        # データベース呼び出し（Supabase）
      hooks.ts      # React Query フック
      schema.ts     # バリデーション（zod）
      types.ts      # TypeScript型定義
  shared/        # 🔧 共通ユーティリティ
    ui/          # 再利用可能なUIコンポーネント
    lib/         # 設定とユーティリティ
    config.ts    # グローバル定数
```

### 🎯 シンプルなルール

1. **ページは `app/` に配置** - ルーティングとレイアウト
2. **機能は `features/*` に配置** - すべてのビジネスロジック
3. **共通部分は `shared/` に配置** - 再利用可能なコンポーネントとユーティリティ
4. **ハードコーディング禁止** - 環境変数は `shared/lib/env.ts`、定数は `shared/config.ts` を使用

## 🛠️ 技術スタック

- **React 18** + **TypeScript** (strict mode)
- **Vite** - 高速開発サーバー
- **Tailwind CSS** - ユーティリティファーストCSS
- **Supabase** - Backend as a Service（データベース、認証、リアルタイム）
- **React Query** - データフェッチとキャッシュ
- **React Hook Form** + **Zod** - フォーム処理とバリデーション
- **React Router** - クライアントサイドルーティング
- **ESLint** + **Prettier** - コード品質とフォーマット

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
npm install
# または
pnpm install
```

### 2. 環境設定

サンプル環境ファイルをコピー：

```bash
cp env.example .env.local
```

`.env.local` を編集してSupabaseの認証情報を設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 開発開始

```bash
npm run dev
```

[http://localhost:5173](http://localhost:5173) にアクセスしてアプリを確認！

## 📊 データベースセットアップ（Supabase）

### todosテーブルの作成

```sql
-- todosテーブルを作成
create table public.todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Securityを有効化
alter table public.todos enable row level security;

-- ポリシーを作成
create policy "Users can read their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);
```

### TypeScript型の生成

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/shared/types/supabase.ts
```

## 🎨 Vibe Coding 初心者向け

### コーディングを始める場所

1. **新しいページを追加**: `src/app/` にファイルを作成
2. **新しい機能を追加**: `src/features/` にフォルダを作成
3. **todoサンプルを変更**: `src/features/todo/` を参照

### AI プロンプトのコツ

AIと作業する際は、構造を具体的に指定しましょう：

✅ **良いプロンプト例:**

- "`src/features/todo/components/` にtodo統計を表示する新しいコンポーネントを追加"
- "`src/features/auth/` にSupabaseを使ったユーザーログイン機能を作成"
- "TodoListコンポーネントにフィルタードロップダウンを追加"

❌ **避けるべき曖昧なプロンプト:**

- "アプリを良くして"
- "何か機能を追加して"
- "全部修正して"

### ファイル組織ルール

- **1つの機能 = 1つのフォルダ** を `src/features/` に
- **データベース呼び出し** は `api.ts` に
- **React Query フック** は `hooks.ts` に
- **バリデーションスキーマ** は `schema.ts` に
- **UIコンポーネント** は `components/` に

## 🧪 利用可能なスクリプト

```bash
# 開発
npm run dev          # 開発サーバーを起動
npm run build        # 本番用にビルド
npm run preview      # 本番ビルドをプレビュー

# コード品質
npm run lint         # lintエラーをチェック
npm run lint:fix     # lintエラーを修正
npm run typecheck    # TypeScript型をチェック
npm run format       # Prettierでコードをフォーマット
```

## 🛡️ コード品質と安全性

このテンプレートには複数の安全機能が含まれています：

- **TypeScript strict mode** - 型エラーをキャッチ
- **ESLint with `no-explicit-any`** - 緩い型付けを防止
- **Zod validation** - 実行時型チェック
- **Prettier** - 一貫したコードフォーマット
- **Import organization** - 整理されたインポート順序

## 📚 学習パス

### レベル1: 基本的な使用方法（ここから始めよう！）

- [ ] アプリを実行してtodo機能を探索する
- [ ] 新しいtodoを追加してデータベースで確認する
- [ ] TodoFormコンポーネントを変更する
- [ ] Tailwindスタイルを変更する

### レベル2: 機能追加

- [ ] 新しい機能を作成する（例：メモ、習慣）
- [ ] ユーザー認証を追加する
- [ ] `shared/ui/` にカスタムUIコンポーネントを作成する
- [ ] zodでフォームバリデーションを追加する

### レベル3: 高度なパターン

- [ ] Supabaseでリアルタイム更新を追加する
- [ ] オプティミスティック更新を実装する
- [ ] エラーバウンダリを追加する
- [ ] Vitestでテストを設定する

## 🔧 カスタマイズ

### 新機能の追加

1. `src/features/` に新しいフォルダを作成
2. 標準ファイルを追加：`api.ts`、`hooks.ts`、`schema.ts`、`types.ts`、`components/`
3. `index.ts` ファイルからすべてをエクスポート
4. その機能を使用するページを `src/app/` に作成

### スタイルの変更

- グローバルスタイルは `src/styles/globals.css` を編集
- コンポーネント内でTailwindクラスを直接変更
- 新しいUIコンポーネントを `src/shared/ui/` に追加

### 環境設定

- 新しい環境変数を `src/shared/lib/env.ts` に追加
- 新しい定数を `src/shared/config.ts` に追加

## 🆘 トラブルシューティング

### よくある問題

**型が見つからないというTypeScriptエラー:**

- Supabase型を生成していることを確認：`npx supabase gen types...`
- すべてのインポートが正しいパスを使用していることを確認

**Supabase接続の問題:**

- `.env.local` ファイルに正しい認証情報があることを確認
- Supabaseプロジェクトが実行されていることを確認
- RLSポリシーが正しく設定されていることを確認

**ビルドエラー:**

- `npm run typecheck` を実行して型の問題を確認
- `npm run lint` を実行してコードスタイルの問題を確認

## 📖 参考資料

- [Vibe Coding concept by Andrej Karpathy](https://twitter.com/karpathy)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 貢献

開発ガイドラインとコーディング規約については [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

---

**Happy Vibe Coding! 🎉**

作りたいものを説明することから始めて、AIに実装をステップバイステップでサポートしてもらいましょう。
