# システムアーキテクチャ

## 全体構成

- **フロントエンド**：Next.js (App Router) + Tailwind。ムードプリセットの選択、カットモデル／スタイル生成、カタログ管理UIを提供。
- **API層**：Next.js API Routes（またはFastAPI）で以下を担当。
  - Prompt Builder：ムードヒント・ヘアパラメータ・参照画像を統合したプロンプト生成。
  - Generation Controller：Gemini API呼び出し、ジョブ登録、コスト見積もり。
  - Asset Service：ストレージ署名URLの発行、SynthID・メタ情報の保存。
- **ジョブワーカー**：Node.js + BullMQ（Redis）。生成ジョブのキュー処理、完了後のアセット登録、コスト集計。
- **データベース**：PostgreSQL（Supabase想定）。主要テーブル：
  - `mood_presets`（システム提供のムードヒント、キーワード、カラーパレット）
  - `cut_models`（生成モデル情報、お気に入り、ムード／パラメータスナップショット）
  - `hair_styles`（カタログ項目、ステータス、参照画像リンク）
  - `generation_jobs`（type, batch_size, cost_estimate, status, response_id）
  - `assets`（ストレージURL、SynthID、出力フォーマット）
  - `prompt_recipes`（ムード／用途ごとのプロンプトブロック）
- **ストレージ**：S3互換（Supabase Storage想定）。`models/`, `catalog/`, `references/` など用途別にバケット分離。
- **外部サービス**：Google Gemini 2.5 Flash Image API、将来的にはコストモニタリング用BigQuery/Looker Studio。

## データフロー

1. ユーザーがムードプリセット（またはおまかせ）を選択し、カットモデル生成をリクエスト。
2. APIがムードヒント＋入力パラメータでプロンプトを生成し、ジョブキューへ投入。
3. ワーカーがGemini APIを呼び出し、生成画像をストレージへ保存。SynthIDとパラメータを`assets`/`generation_jobs`に記録。
4. ユーザーはギャラリーで候補を確認し、タグ・ステータスを付与してカタログへ登録。
5. ヘアスタイル生成（モデル指定／バッチ／スタイル転写）も同じフローで処理。
6. エクスポート時に指定フォーマット（1:1, 4:5, 16:9）に変換し、署名付きURLを発行。

## 認証・権限

- MVPは社内利用を想定。メールリンク認証（Supabase Auth）＋ワークスペース単位のロール（admin/designer/viewer）を提供。
- 将来的なマルチワークスペース化を見据え、`workspaces`でムードプリセット・生成資産のスコープを管理。

## ロギングとコスト管理

- 生成リクエスト／レスポンスの `response_id`・消費トークン・推定コストを `generation_jobs` に保存。
- バッチ生成では各バリエーションの採用フラグを記録し、採用単価を算出可能にする。
- アプリログは構造化JSONで記録し、エラー／再試行をトレースできるようにする。

## セキュリティ

- Gemini APIキーは Secret Manager または Supabase Edge Config に保管し、クライアントからは不可視。
- アップロードされた参照画像は社内用途限定。ライセンス区分・利用期限をメタ情報として保持。
- SynthIDや生成メタデータを保存し、外部共有時にAI生成であることを明示できるようにする。

## 今後の拡張余地

- ムードプリセットの編集・共有機能、A/Bテストによるプロンプトチューニング。
- 生成結果へのフィードバック学習（好みの傾向を学習し、ムードヒントを自動補正）。
- レイアウト自動生成（LOOK BOOK / SNSカルーセルなど）の追加。
