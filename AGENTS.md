# Repository Guidelines

## プロジェクト構造とモジュール配置

- `src/app/` はルーティングとトップレベルページ専用です。`page.tsx` でルートを宣言し、機能実装は他ディレクトリに委譲します。
- `src/features/<name>/` が主要な作業単位です。各フォルダに `components/`、`api.ts`、`hooks.ts`、`schema.ts`、`types.ts`、`index.ts` を揃えてビジネスロジックを内包してください。例: `src/features/todo/`。
- `src/shared/` には再利用資産を集約します。UIは `ui/`、設定・ユーティリティは `lib/`、共通型は `types/`、定数は `config.ts` で集中管理し、環境値は必ず `shared/lib/env.ts` 経由で参照します。
- `src/styles/` がTailwindとグローバルCSSのエントリーポイント、`docs/` がレファレンス資料、`supabase/` がCLI設定・マイグレーション、`dist/` はビルド出力です。`node_modules/` や `dist/` の変更はコミットしないでください。

## ビルド・テスト・開発コマンド

- `npm run dev` : Vite開発サーバーをポート5173で起動。
- `npm run build` : TypeScriptチェック後に本番ビルドを生成し、成果物を `dist/` に配置。
- `npm run preview` : 生成済みビルドをローカルで確認。
- `npm run lint` / `npm run lint:fix` : ESLint（import/react-hooks/tailwindcssプラグイン含む）で静的解析。`lint:fix` は安全な自動修正を試行。
- `npm run typecheck` : エミットなしで型検証。プリコミットフックでも実行されるので事前に通してください。
- `npm run format` : Prettier + `prettier-plugin-tailwindcss` による整形。
- Supabase連携には `npm run db:link`、`npm run db:types`、`npm run db:status` を使用し、出力は必要に応じてコミットします。

## コーディングスタイルと命名規則

- TypeScript strict mode を前提とし、`any` の使用は禁止です。未知の入力は `unknown` + zodでパースしてください。
- Reactコンポーネント/ファイル名は PascalCase（例: `TodoList.tsx`）、カスタムフックは `useXxx`、ユーティリティは camelCase に統一します。ディレクトリは機能名のローワーケース（`todo`, `auth` など）で作成。
- インポートは `@/` エイリアス（`tsconfig.json` の `paths` 設定）を優先し、相対パスのネストを避けます。
- Tailwindユーティリティを基本とし、クラス結合には `clsx`／`tailwind-merge` を使用。複雑なスタイルは `src/styles` に切り出します。
- Prettierのデフォルト（2スペース、シングルクォート、末尾セミコロン）と ESLint の警告ゼロポリシーを守り、ディレクティブでの無効化は最小限に抑えてください。

## テストガイドライン

- 既定のテストランナーは未同梱です。ユニット/コンポーネントテストを追加する場合は Vitest + React Testing Library の導入を推奨し、`src/features/<feature>/__tests__/`、または `*.test.tsx` で機能ごとに配置してください。
- テスト名は英語で期待挙動を明示する文（`should ...`）にし、Supabase連携は API レイヤーをモックすることで外部依存を避けます。
- 回帰防止の最低ラインとして、PR前に `npm run lint` と `npm run typecheck` を実行し、結果をPR本文に記載してください。追加したテストがあればコマンドと結果も明記します。

## コミットとプルリクエスト

- コミットは Conventional Commits（例: `feat: add todo summary panel`、`fix: handle empty todo state`、`chore: update eslint config`）を使用し、1コミット1目的を意識します。
- ブランチ名は `feature/xxx`、`fix/xxx`、`chore/xxx` 形式で要約語を短く保ってください。
- PR本文には概要、主要変更点、テスト結果、関連Issue（`Fixes #123` など）を箇条書きで記載し、UI更新時はスクリーンショットや動作キャプチャを添付します。
- Supabaseスキーマや環境変数を変更した場合は、`supabase/migrations/` や `shared/lib/env.ts` の差分を説明し、必要なら `docs/ops` に手順メモを追加してください。
- レビュー前に `CONTRIBUTING.md` の厳格ルール（ハードコーディング禁止、データアクセスは `api.ts` 経由）が守られているか再確認し、セルフレビューコメントで論点を共有します。

## Supabase と環境設定

- `.env.local` を `.env.example` から作成し、`VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定します。機密値はGitに含めず、共有は1password等の安全なチャネルで行ってください。
- 新しい環境変数は必ず `src/shared/lib/env.ts` の zod スキーマに追加し、利用側では `@/shared/config.ts` などのラッパー経由で参照します。
- 型更新が必要な場合は `npm run db:types` を実行し、生成された `src/shared/types/supabase.ts` の差分をコミットしてください。生成が失敗した場合はスクリプトが警告を出すので、手動で更新した旨をPRに記載します。
- マイグレーションは `supabase/migrations/` に新規ファイルを追加し、`supabase/config.toml` を変更した場合は適用方法を `docs/tech` またはPR本文に明記します。
