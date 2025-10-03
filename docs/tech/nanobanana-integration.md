# Google Gemini（Nano Banana）連携設計

## 役割と目的

- アップロード画像をもとに、長さ・カラー・前髪・質感などのパラメータを反映したスタイル案を複数生成する。
- 一つの生成ジョブから複数バリエーションを取得し、比較・承認のワークフローに連携する。
- Google公式のAPIキー（Google AI StudioまたはVertex AI）で認証し、安定したSLAと安全対策を活用する。

## 接続構成

```
Front → API Route → Job Queue → Worker → Google Gemini Image API → Worker → DB / Storage
```

- ジョブワーカーはBullMQ上で`StyleGenerationJob`を処理し、Gemini APIから取得した各バリエーションを`variations`テーブルとストレージに保存。
- APIキーはサーバー側環境変数`GOOGLE_API_KEY`（またはサービスアカウント認証）で管理し、クライアントからは参照不可。
- Vertex AIへ移行する場合も同じアダプターインターフェースを利用できるよう、インフラ層を抽象化する。

## API呼び出し仕様

- エンドポイント（REST）
  - `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
  - 公式SDK（`@google/generative-ai`）利用を推奨。gRPC/RESTを切り替えられる。
- リクエスト組み立て
  - ベース画像を`inline_data`で送信（JPEG/PNG）。
  - パラメータUIで指定された値をプロンプトテンプレートに埋め込み、髪の長さ・カラー・前髪・質感などを自然言語で指示。
  - `generationConfig.responseMimeType`で戻りの形式を指定（例：`image/png`）。
- マルチバリエーション
  - `candidateCount`（SDK）または複数回の呼び出しで3〜5案を取得。
  - 各案に`variation_rank`を付与し保存。
- レスポンス処理
  - `candidates[*].content.parts[].inline_data.data`から画像データを取り出しBase64デコード。
  - `safetyRatings`は不適切コンテンツの検知に利用し、`variations`に警告フラグを保存。

## ジョブ設計とリトライ

- タイムアウト：標準30秒。`retry=2`（指数バックオフ）。
- 制限レスポンス (`429`, `503`) は`Retry-After`を尊重。
- ジョブ結果は`generation_jobs`に`status`, `started_at`, `finished_at`, `response_id`を保存。
- 連続失敗時は運用アラート（Slack通知は後続フェーズ）とログレビューを実施。

## 環境変数・設定

- `GOOGLE_API_KEY`
- `GOOGLE_VERTEX_PROJECT_ID`, `GOOGLE_VERTEX_LOCATION`（Vertex利用時）
- `GOOGLE_GEMINI_IMAGE_MODEL`（既定：`gemini-2.5-flash-image`）
- `GOOGLE_GEMINI_VARIATION_COUNT`（生成枚数）
- `GOOGLE_GEMINI_STYLE_PROMPT_TEMPLATE`（JSON or YAMLで管理し、デプロイ時に読み込む）
- `GOOGLE_GEMINI_SAFETY_LEVEL`（安全設定プリセット）

## ログ・モニタリング

- `responseId`を`generation_jobs`および`audit_logs`に紐付ける。
- 生成時間やエラー率をメトリクス化し、ダッシュボードで可視化。
- コスト監視のため、Google CloudのUsageレポートを週次で確認。

## リージョンと制約

- 利用可能リージョンはGoogle Cloud公式ドキュメントを参照。提供地域が限定される可能性があるため、接続時にバリデーションを行う。
- `PERMISSION_DENIED`など地域制限が示唆されるレスポンスを受け取った際はジョブを`failed`にし、ユーザーへ警告を表示。
- セーフティ設定で検出された不適切カテゴリは`variations.safety_flags`に保存し、承認画面に表示。

## セキュリティ

- APIキーはSecret Managerや1Passwordで管理し、実行時に環境変数へ注入。
- 署名URLの有効期限は短く設定し、生成完了後に不要な原画像を消去できるオプションを提供。
- Geminiが付与するSynthID透かしは保持し、顧客向け共有時に明示する。

## 今後の拡張

- サービスアカウントベースのVertex AI接続（企業アカウント向け）。
- 生成案のバッチ比較やA/Bテスト機能。
- 追加の制御（例：髪以外の領域固定、背景差し替え）をGemini Tools/Functionsで実現。
