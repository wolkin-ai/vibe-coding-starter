export type UserRole = 'owner' | 'manager' | 'stylist' | 'external_collaborator';

export type AssetStatus = 'uploaded' | 'ready_for_generation';

export type GenerationJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type VariationStatus = 'draft' | 'reviewing' | 'approved' | 'rejected';

export interface Project {
  id: string;
  name: string;
  salon_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export interface Asset {
  id: string;
  project_id: string;
  original_url: string;
  storage_path: string;
  status: AssetStatus;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface StylePreset {
  id: string;
  name: string;
  hair_length?: string;
  color?: string;
  bangs?: string;
  texture?: string;
  image_style?: string;
  identity_shift?: IdentityShift;
  makeup_style?: MakeupStyle;
  retouch_level?: RetouchLevel;
  hpb_category?: HpbStyleCategory;
  is_custom: boolean;
}

export interface StyleParameters {
  hair_length?: string;
  color?: string;
  bangs?: string;
  texture?: string;
  image_style?: string;
  custom_prompt?: string;
  identity_shift?: IdentityShift;
  makeup_style?: MakeupStyle;
  retouch_level?: RetouchLevel;
  hpb_category?: HpbStyleCategory;
}

export type IdentityShift = 'keep_similar' | 'soft_change' | 'distinct_new';
export type MakeupStyle = 'bare' | 'natural' | 'glam';
export type RetouchLevel = 'none' | 'light' | 'full';
export type HpbStyleCategory = 'FRONT' | 'SIDE' | 'BACK' | 'ARRANGE' | 'BEFORE' | 'FASHION';

export interface GenerationJob {
  id: string;
  asset_id: string;
  project_id: string;
  parameters: StyleParameters;
  status: GenerationJobStatus;
  variation_count: number;
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  response_id?: string;
}

export interface Variation {
  id: string;
  generation_job_id: string;
  variation_rank: number;
  image_url: string;
  storage_path: string;
  status: VariationStatus;
  safety_flags?: string[];
  created_at: string;
}

export interface Review {
  id: string;
  variation_id: string;
  reviewed_by: string;
  status: 'approved' | 'rejected';
  comment?: string;
  reviewed_at: string;
}

export interface ExportJob {
  id: string;
  project_id: string;
  variation_ids: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_url?: string;
  created_at: string;
  completed_at?: string;
}

export interface GenerationJobWithVariations extends GenerationJob {
  variations: Variation[];
}

export interface ProjectSummary extends Project {
  asset_count: number;
  variation_count: number;
  approved_variation_count: number;
}

export interface ProjectDetail extends ProjectSummary {
  assets: Asset[];
  jobs: GenerationJobWithVariations[];
}
