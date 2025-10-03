export type UserRole = 'owner' | 'manager' | 'stylist' | 'external_collaborator';

export type AssetStatus = 'uploaded' | 'ready_for_generation';

export type GenerationJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type VariationStatus = 'draft' | 'reviewing' | 'approved' | 'rejected';

export interface Project {
  id: string;
  name: string;
  salon_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export interface Asset {
  id: string;
  project_id: string;
  original_url: string;
  status: AssetStatus;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

export interface StylePreset {
  id: string;
  name: string;
  hair_length?: string;
  color?: string;
  bangs?: string;
  texture?: string;
  image_style?: string;
  is_custom: boolean;
}

export interface StyleParameters {
  hair_length?: string;
  color?: string;
  bangs?: string;
  texture?: string;
  image_style?: string;
  custom_prompt?: string;
}

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
