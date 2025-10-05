// ============================================================================
// Cut Model (カットモデル)
// ============================================================================

export type ModelGender = 'female' | 'male';

export type ModelAgeRange = 'kids' | 'teen' | '20s' | '30s' | '40s' | '50s' | '60s';

export type ModelFaceType =
  | 'oval'
  | 'round'
  | 'square'
  | 'long'
  | 'heart'
  | 'inverted_triangle'
  | 'base';

export interface CutModel {
  id: string;

  // モデル属性
  gender: ModelGender;
  age_range: ModelAgeRange;
  face_type?: ModelFaceType; // 顔型（卵型、丸型等）
  skin_tone?: string; // 肌トーン
  expression?: string; // 表情
  hair_profile?: Partial<HairParameters>; // ベースヘア情報

  // 生成情報
  image_url: string;
  thumbnail_url?: string;
  seed?: string; // 再現用シード値
  generation_params: Record<string, unknown>; // 生成時のパラメータ
  generation_prompt?: string;
  synthid_metadata?: unknown;
  storage_path?: string;
  updated_at?: string;

  // メタデータ
  is_favorite: boolean; // お気に入り
  tags: string[];

  created_at: string;
  created_by: string;
}

// ============================================================================
// Hair Style (ヘアスタイル)
// ============================================================================

export type HairLength =
  | 'very_short'
  | 'short'
  | 'bob'
  | 'medium'
  | 'semi_long'
  | 'long'
  | 'super_long';

export type HairVolume = 'low' | 'normal' | 'high';

export type HairTexture = 'none' | 'slight' | 'strong';

export type HairQuality = 'soft' | 'normal' | 'firm';

export type HairThickness = 'thin' | 'normal' | 'thick';

export type BangsStyle =
  | 'none'
  | 'blunt'
  | 'side_swept'
  | 'center_part'
  | 'see_through'
  | 'curtain';

export type HairColorType =
  | 'black'
  | 'dark_brown'
  | 'brown'
  | 'light_brown'
  | 'blonde'
  | 'ash'
  | 'beige'
  | 'pink'
  | 'red'
  | 'purple'
  | 'blue'
  | 'green'
  | 'gray'
  | 'white';

export interface HairParameters {
  length: HairLength;
  volume?: HairVolume;
  texture?: HairTexture;
  bangs?: BangsStyle;
  color?: HairColorType;
  color_technique?: string; // カラー技法（グラデーション、ハイライト等）
  styling?: string; // スタイリング方法
  styling_keywords?: string[];
  perm?: string;
  quality?: HairQuality;
  thickness?: HairThickness;
}

export type HairStyleStatus = 'draft' | 'reviewing' | 'approved' | 'archived';

export interface HairStyle {
  id: string;

  // 関連モデル
  cut_model_id?: string; // 指定モデル（nullの場合はモデル指定なし生成）
  reference_image_url?: string; // 参照ヘア画像

  // ヘアパラメータ
  parameters: HairParameters;

  // 生成結果
  image_url: string;
  thumbnail_url?: string;
  storage_path?: string;
  generation_params?: Record<string, unknown>;
  generation_prompt?: string;
  synthid_metadata?: unknown;

  // カタログ管理
  status: HairStyleStatus;
  is_favorite: boolean;
  tags: string[];
  title?: string;
  description?: string;
  approved_at?: string | null;

  // メタデータ
  generation_job_id: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

// ============================================================================
// Generation Job (生成ジョブ)
// ============================================================================

export type GenerationType = 'cut_model' | 'hair_style' | 'style_transfer';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  type: GenerationType;

  // リクエスト情報
  cut_model_id?: string;
  reference_image_url?: string;
  parameters: Record<string, unknown>;

  // バッチ設定
  batch_size: number; // 生成枚数

  // ステータス
  status: GenerationStatus;
  progress: number; // 0-100

  // コスト
  cost_estimate?: number;
  actual_cost?: number;

  // タイムスタンプ
  created_at: string;
  created_by: string;
  started_at?: string;
  completed_at?: string;

  // エラー情報
  error_message?: string;

  // Gemini API response ID
  response_id?: string;
}

// ============================================================================
// Asset (生成アセット)
// ============================================================================

export type AssetType = 'cut_model' | 'hair_style';

export interface Asset {
  id: string;
  type: AssetType;

  // ストレージ
  storage_url: string;
  thumbnail_url?: string;

  // 関連情報
  generation_job_id: string;
  cut_model_id?: string;
  hair_style_id?: string;

  // 生成メタデータ
  synth_id?: string; // SynthID (AI生成マーカー)
  prompt_snapshot?: string; // 生成時のプロンプト
  seed?: string;

  // 出力フォーマット
  width: number;
  height: number;
  format: string; // 'png', 'jpeg', etc.

  created_at: string;
}

// ============================================================================
// Prompt Recipe (プロンプトテンプレート)
// ============================================================================

export interface PromptRecipe {
  id: string;
  name: string;
  type: 'cut_model' | 'hair_style';

  // テンプレートブロック
  model_attributes_block?: string;
  hair_parameters_block?: string;
  technical_settings_block?: string;

  // 変数
  variables: Record<string, string>;

  is_default: boolean;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// Export Format (出力フォーマット)
// ============================================================================

export type ExportPlatform = 'instagram' | 'hot_pepper_beauty' | 'x_twitter';

export interface ExportFormat {
  platform: ExportPlatform;
  aspect_ratio: string; // '1:1', '4:5', '3:4', etc.
  width: number;
  height: number;
}

export const EXPORT_FORMATS: Record<ExportPlatform, ExportFormat> = {
  instagram: {
    platform: 'instagram',
    aspect_ratio: '1:1',
    width: 1080,
    height: 1080,
  },
  hot_pepper_beauty: {
    platform: 'hot_pepper_beauty',
    aspect_ratio: '3:4',
    width: 600,
    height: 800,
  },
  x_twitter: {
    platform: 'x_twitter',
    aspect_ratio: '16:9',
    width: 1200,
    height: 675,
  },
};
