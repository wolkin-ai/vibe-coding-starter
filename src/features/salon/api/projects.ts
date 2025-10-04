import { supabase } from '@/shared/lib/supabase';

import type {
  Asset,
  AssetStatus,
  GenerationJobStatus,
  GenerationJobWithVariations,
  ProjectDetail,
  ProjectSummary,
  StyleParameters,
  Variation,
  VariationStatus,
} from '../types';

type ProjectQueryRow = {
  id: string;
  name: string;
  salon_id: string;
  owner_id: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  salon_assets?: Array<{
    id: string;
    project_id: string;
    original_url: string;
    storage_path: string;
    status: string;
    uploaded_at: string;
    uploaded_by: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  salon_generation_jobs?: Array<{
    id: string;
    asset_id: string;
    project_id: string;
    parameters: Record<string, unknown>;
    status: string;
    variation_count: number;
    created_by: string;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    error_message: string | null;
    response_id: string | null;
    salon_variations?: Array<{
      id: string;
      generation_job_id: string;
      variation_rank: number;
      image_url: string;
      storage_path: string;
      status: VariationStatus;
      safety_flags: string[] | null;
      created_at: string;
    }>;
  }>;
};

function aggregateProject(row: ProjectQueryRow): ProjectSummary {
  const assets = row.salon_assets ?? [];
  const jobs = row.salon_generation_jobs ?? [];
  const variationCount = jobs.reduce((acc, job) => acc + (job.salon_variations?.length ?? 0), 0);
  const approvedCount = jobs.reduce(
    (acc, job) =>
      acc +
      (job.salon_variations?.filter((variation) => variation.status === 'approved').length ?? 0),
    0,
  );

  return {
    id: row.id,
    name: row.name,
    salon_id: row.salon_id,
    owner_id: row.owner_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    asset_count: assets.length,
    variation_count: variationCount,
    approved_variation_count: approvedCount,
  };
}

function mapProjectDetail(row: ProjectQueryRow): ProjectDetail {
  const summary = aggregateProject(row);
  const assets = (row.salon_assets ?? []).map((asset) => {
    const mapped = {
      id: asset.id,
      project_id: asset.project_id,
      original_url: asset.original_url,
      storage_path: asset.storage_path,
      status: (asset.status === 'ready_for_generation'
        ? 'ready_for_generation'
        : 'uploaded') as AssetStatus,
      uploaded_by: asset.uploaded_by,
      uploaded_at: asset.uploaded_at,
    } satisfies Omit<Asset, 'description' | 'metadata'>;

    const extended: Asset = { ...mapped };
    if (asset.description) {
      extended.description = asset.description;
    }
    if (asset.metadata) {
      extended.metadata = asset.metadata;
    }

    return extended;
  });

  const jobs = (row.salon_generation_jobs ?? []).map((job) => {
    const baseJob = {
      id: job.id,
      asset_id: job.asset_id,
      project_id: job.project_id,
      parameters: job.parameters as StyleParameters,
      status: job.status as GenerationJobStatus,
      variation_count: job.variation_count,
      created_by: job.created_by,
      created_at: job.created_at,
      variations: (job.salon_variations ?? []).map((variation) => {
        const baseVariation: Variation = {
          id: variation.id,
          generation_job_id: variation.generation_job_id,
          variation_rank: variation.variation_rank,
          image_url: variation.image_url,
          storage_path: variation.storage_path,
          status: variation.status as VariationStatus,
          created_at: variation.created_at,
        };
        if (variation.safety_flags) {
          baseVariation.safety_flags = variation.safety_flags;
        }
        return baseVariation;
      }),
    } satisfies Omit<
      GenerationJobWithVariations,
      'started_at' | 'completed_at' | 'error_message' | 'response_id'
    >;

    const extended: GenerationJobWithVariations = { ...baseJob };

    if (job.started_at) {
      extended.started_at = job.started_at;
    }
    if (job.completed_at) {
      extended.completed_at = job.completed_at;
    }
    if (job.error_message) {
      extended.error_message = job.error_message;
    }
    if (job.response_id) {
      extended.response_id = job.response_id;
    }

    return extended;
  });

  return {
    ...summary,
    assets,
    jobs,
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from('salon_projects')
    .select(
      `
        id,
        name,
        salon_id,
        owner_id,
        status,
        created_at,
        updated_at,
        salon_assets (
          id,
          project_id,
          original_url,
          storage_path,
          status,
          uploaded_at,
          uploaded_by,
          description,
          metadata
        ),
        salon_generation_jobs (
          id,
          asset_id,
          project_id,
          parameters,
          status,
          variation_count,
          created_by,
          created_at,
          started_at,
          completed_at,
          error_message,
          response_id,
          salon_variations (
            id,
            generation_job_id,
            variation_rank,
            image_url,
            storage_path,
            status,
            safety_flags,
            created_at
          )
        )
      `,
    )
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`プロジェクト一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => aggregateProject(row as ProjectQueryRow));
}

export async function fetchProject(projectId: string): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from('salon_projects')
    .select(
      `
        id,
        name,
        salon_id,
        owner_id,
        status,
        created_at,
        updated_at,
        salon_assets (
          id,
          project_id,
          original_url,
          storage_path,
          status,
          uploaded_at,
          uploaded_by,
          description,
          metadata
        ),
        salon_generation_jobs (
          id,
          asset_id,
          project_id,
          parameters,
          status,
          variation_count,
          created_by,
          created_at,
          started_at,
          completed_at,
          error_message,
          response_id,
          salon_variations (
            id,
            generation_job_id,
            variation_rank,
            image_url,
            storage_path,
            status,
            safety_flags,
            created_at
          )
        )
      `,
    )
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`プロジェクト詳細の取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectDetail(data as ProjectQueryRow);
}
