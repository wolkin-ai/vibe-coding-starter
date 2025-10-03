# 承認スタイル出力仕様（β）

## 出力形態

- 画像ファイル：`<projectId>_<variationId>_approved.jpg`
- 共有用パッケージ（任意）：承認案をまとめたZIP（`<projectId>_approved_bundle.zip`）
- メタ情報JSON（オプション）：`<projectId>_<variationId>.json`

## 画像仕様

- 解像度：生成結果をそのまま保持（既定は1024〜1536pxの長辺）。必要に応じてダウンスケール。
- カラープロファイル：sRGBを強制。
- EXIF：個人情報に該当するタグは削除。生成情報（モデル名など）は`software`タグに簡潔に記録。
- ファイル形式：JPEG（品質90）またはPNG。ユーザーが選択可能。

## メタ情報JSONフォーマット

| Field           | Type     | Description                                  |
| --------------- | -------- | -------------------------------------------- |
| `variation_id`  | string   | 生成案ID                                     |
| `project_id`    | string   | プロジェクトID                               |
| `base_asset_id` | string   | 元画像ID                                     |
| `parameters`    | object   | 使用したスタイルパラメータ（長さ、カラー等） |
| `prompt`        | string   | 実際に送信したプロンプト全文                 |
| `safety_flags`  | array    | GeminiのSafety警告コード                     |
| `approved_by`   | string   | 承認者ユーザーID                             |
| `approved_at`   | datetime | ISO8601                                      |
| `notes`         | string   | 承認時のメモ                                 |

## エクスポートフロー

1. UIで承認したタイミングで`reviews`が`approved`になり、`export_jobs`レコードを生成。
2. ジョブワーカーが対象`variation`の画像を`variations/`から取得し、フォーマット変換・リサイズを実施。
3. JSONメタ情報を生成して`snapshots/`バケットに保管。ZIP出力時は画像+JSONを同梱。
4. 完了後に署名付きURLを生成し、UIに表示。メール/共有リンク連携は後続フェーズで対応。

## エラー処理

- バケット書き込み失敗時は`export_jobs.status`を`failed`にし、ユーザーへ再試行を促す。
- 生成画像が失われている場合は`variations`のステータスを`missing`に更新し、再生成を提示。
- Safetyフラグが`disallowed`の場合はエクスポートを許可しない。
