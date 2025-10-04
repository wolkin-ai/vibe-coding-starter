# システムアーキテクチャ

## 全体構成

- **フロントエンド**：Next.js (App Router) + Tailwind。ブランドテーマ設定、モデル生成操作、ギャラリー管理を提供。
- **API層**：Next.js API Routes（またはFastAPI）で以下の機能を提供。
  - Prompt Builder：ブランドテーマ・ヘアパラメータ・参照画像を統合したテンプレート生成
  - Generation Controller：Gemini API呼び出し、ジョブ登録、コスト見積り
  - Asset Service：ストレージ署名URLの発行、SynthIDメタ情報保存
- **ジョブワーカー**：Node.js + BullMQ（Redis）で非同期処理。生成リクエストのキューイング、完了後のアセット登録、コスト集計を担当。
- **データベース**：PostgreSQL（Supabase）。主要テーブル：
  - `brand_themes`（カラー/キーワード/ターゲット）
  - `cut_models`（生成モデル情報、favoriteフラグ、seed）
  - `hair_styles`（カタログエントリ、参照画像リンク、状態）
  - `generation_jobs`（type, batch_size, cost_estimate, status）
  - `assets`（ストレージURL、SynthID、出力形式）
  - `prompt_recipes`（ブランド共通プロンプトブロック）
- **ストレージ**：S3互換（Supabase Storage想定）。`models/`, `catalog/`, `references/` バケットで分離し、生成履歴を保持。
- **外部サービス**：Google Gemini 2.5 Flash Image API、（将来的に）コスト監視用BigQuery/Looker Studio。

## データフロー

1. ユーザーがブランドテーマを選択し、カットモデル生成をリクエスト。
2. APIがPrompt Builderでテンプレートを生成→ジョブキューへ投入。
3. ワーカーがGemini APIを呼び出し、生成画像をストレージへ保存。SynthIDとパラメータスナップショットを`assets`/`generation_jobs`に記録。
4. ユーザーはギャラリーで結果を確認し、お気に入り登録→カタログに昇格。
5. ヘアスタイル生成も同様に、モデル指定あり/なし、参照画像ありの場合は画像を追加で送信。
6. ダウンロード要求時に所定フォーマット（1:1、4:5、3:4など）に変換し、署名付きURLを発行。

## 認証・権限

- MVPでは社内利用想定のため、メールリンク認証（Supabase Auth）＋ワークスペース単位のRBAC（admin/designer/viewer）を予定。
- 将来のマルチテナント化に備え、`workspaces`テーブルでブランドテーマ／資産をスコープ管理。

## ロギングとコスト管理

- 生成リクエスト／レスポンスの`responseId`・消費トークン・推定コストを`generation_jobs`に保存。
- バッチ生成時は1枚ごとの採用フラグを保持し、採用単価を計算できるようにする。
- アプリログは構造化JSONで収集し、エラーハンドリング・再試行パターンを可視化。

## セキュリティ

- APIキーはSecret ManagerまたはSupabase Edge Configで管理し、クライアントからは参照不可。
- 参照画像は社内素材のみとし、利用のたびに権限チェック。OSS画像やユーザー提供素材を分離保管。
- SynthIDや生成メタデータを破棄せず、社外提出時に生成物であることを明示できるようにする。

## 今後の拡張余地

- 生成レシピのバージョン管理とABテスト
- 生成結果に対するフィードバック学習（好みの傾向を自動学習してプロンプト補正）
- Auto Layout機能（ブランドごとのLOOK BOOKやSNS投稿レイアウト生成）
