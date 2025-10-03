# システムアーキテクチャ概要

## 全体構成

- **フロントエンド**：Next.js (App Router)。SSRは認証済みページのみ。生成パラメータUIや比較ビューをクライアント側でレンダリング。
- **バックエンドAPI**：Next.js API RoutesでRESTエンドポイントを提供。プロジェクト管理、生成ジョブ投入、承認操作を担う。
- **ジョブワーカー**：Node.js + BullMQでRedisキューを処理。Google Gemini（Nano Banana）APIを呼び出し、複数スタイル案を生成。
- **データベース**：Supabase PostgreSQL。主なテーブル：
  - `salons`, `users`, `projects`
  - `assets`（アップロード原画像）
  - `style_presets`（保存済みパラメータ）
  - `generation_jobs`（Gemini呼び出し単位）
  - `variations`（生成結果）
  - `reviews`（承認/却下・コメント）
  - `audit_logs`
- **ストレージ**：S3互換（Supabase Storage）。原画像は`raw/`、生成案は`variations/`、エクスポートは`snapshots/`等に分離。
- **外部サービス**：Google Gemini API（公式APIキー認証）。βでは外部通知なし。

## データフロー

1. ユーザーがプロジェクトを選択し、原画像をアップロード。`assets`レコードと`raw/`バケットに保存。
2. スタイルパラメータ（プリセットまたはカスタム）を設定し、生成ジョブをAPIに送信。
3. ジョブワーカーがGoogle Gemini Image APIを呼び出し、複数のスタイル案を生成。各案を`variations`レコードとして保存し、画像は`variations/`バケットに配置。
4. UIはSupabase Realtimeまたはポーリングで生成完了を検知し、ギャラリーに表示。
5. スタイリストが各案に対して承認/却下/メモを付与。結果は`reviews`テーブルに保存。
6. 承認済み案だけをエクスポートAPIでダウンロードURL化し、顧客共有やSNS出力に利用。

## 認証・権限

- Supabase Authのメールリンク認証を利用。
- ロールは`owner`, `manager`, `stylist`, `external_collaborator`をenumで管理。承認権限は`manager`以上。
- APIアクセス時にミドルウェアでトークン検証し、各エンドポイントでロールを再チェック。

## 設定・環境変数（例）

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`, `GOOGLE_VERTEX_PROJECT_ID`, `GOOGLE_VERTEX_LOCATION`
- `GOOGLE_GEMINI_IMAGE_MODEL`（例：`gemini-2.5-flash-image`）
- `REDIS_URL`
- `RAW_BUCKET`, `VARIATION_BUCKET`, `SNAPSHOT_BUCKET`
- `GENERATION_VARIATION_LIMIT`（例：3〜5枚）
- `MAX_IMAGE_SIZE_MB`

## ログ・監査

- アプリログ：構造化JSONを採用し、生成ジョブID・ユーザーIDを必ず記録。
- 生成ログ：`generation_jobs`にリクエストパラメータ、レスポンス`responseId`、ステータス、処理時間を保存。
- 操作ログ：`audit_logs`に承認/却下やエクスポート操作を記録。

## セキュリティ方針

- アップロード画像はSSE-KMS相当で暗号化。署名URLの有効期限は5分以下に制限。
- Google APIキーはサーバー側にのみ配置し、Secret Managerから読み込む。
- 生成画像にGoogleのSynthID透かしが付与される点を利用規約に明記し、除去は行わない。
- 不要な生成案はプロジェクト終了時に自動削除するポリシーを検討。
