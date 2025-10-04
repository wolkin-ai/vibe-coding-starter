import { supabase } from '@/shared/lib/supabase';
import type { Json, TablesInsert } from '@/shared/types/supabase';

import { dataUrlToBlob, mimeToExtension, requireAuthUser } from './helpers';
import type {
  GenerationJob,
  GenerationJobStatus,
  GenerationJobWithVariations,
  StyleParameters,
  Variation,
  VariationStatus,
} from '../types';

const VARIATION_BUCKET = 'salon-variations';

function randomSuffix(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

function buildVariationPath(jobId: string, variationRank: number, mimeType: string): string {
  const ext = mimeToExtension(mimeType);
  const suffix = randomSuffix();
  return `jobs/${jobId}/variation-${variationRank}-${suffix}.${ext}`;
}

export async function createGenerationJob({
  assetId,
  projectId,
  parameters,
  variationCount,
}: {
  assetId: string;
  projectId: string;
  parameters: StyleParameters;
  variationCount: number;
}): Promise<GenerationJob> {
  const user = await requireAuthUser();

  const payload: TablesInsert<'salon_generation_jobs'> = {
    asset_id: assetId,
    project_id: projectId,
    parameters: parameters as unknown as Json,
    status: 'processing',
    variation_count: variationCount,
    created_by: user.id,
    started_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('salon_generation_jobs')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`生成ジョブの作成に失敗しました: ${error.message}`);
  }

  const job: GenerationJob = {
    id: data.id,
    asset_id: data.asset_id,
    project_id: data.project_id,
    parameters: data.parameters as StyleParameters,
    status: data.status as GenerationJobStatus,
    variation_count: data.variation_count,
    created_by: data.created_by,
    created_at: data.created_at,
  };

  if (data.started_at) {
    job.started_at = data.started_at;
  }
  if (data.completed_at) {
    job.completed_at = data.completed_at;
  }
  if (data.error_message) {
    job.error_message = data.error_message;
  }
  if (data.response_id) {
    job.response_id = data.response_id;
  }

  return job;
}

export async function updateGenerationJobStatus(
  jobId: string,
  status: GenerationJobStatus,
  options?: { errorMessage?: string; responseId?: string },
): Promise<void> {
  const update: Partial<TablesInsert<'salon_generation_jobs'>> = {
    status,
  };

  if (status === 'completed') {
    update.completed_at = new Date().toISOString();
  }

  if (status === 'failed' && options?.errorMessage) {
    update.error_message = options.errorMessage;
  }

  if (options?.responseId) {
    update.response_id = options.responseId;
  }

  const { error } = await supabase.from('salon_generation_jobs').update(update).eq('id', jobId);

  if (error) {
    throw new Error(`生成ジョブの更新に失敗しました: ${error.message}`);
  }
}

export async function saveGeneratedVariation({
  jobId,
  variationRank,
  dataUrl,
  status = 'draft',
  safetyFlags,
}: {
  jobId: string;
  variationRank: number;
  dataUrl: string;
  status?: VariationStatus;
  safetyFlags?: string[];
}): Promise<Variation> {
  let blob: Blob;
  if (dataUrl.startsWith('data:')) {
    blob = dataUrlToBlob(dataUrl);
  } else {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error('生成画像データの取得に失敗しました');
    }
    blob = await response.blob();
  }

  const mimeType = blob.type || 'image/png';
  const storagePath = buildVariationPath(jobId, variationRank, mimeType);

  const { error: uploadError } = await supabase.storage
    .from(VARIATION_BUCKET)
    .upload(storagePath, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`生成画像のアップロードに失敗しました: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(VARIATION_BUCKET).getPublicUrl(storagePath);
  if (!publicUrlData?.publicUrl) {
    throw new Error('生成画像の公開URLを取得できませんでした');
  }

  const payload: TablesInsert<'salon_variations'> = {
    generation_job_id: jobId,
    variation_rank: variationRank,
    image_url: publicUrlData.publicUrl,
    storage_path: storagePath,
    status,
    ...(safetyFlags ? { safety_flags: safetyFlags } : {}),
  };

  const { data, error } = await supabase.from('salon_variations').insert(payload).select().single();

  if (error) {
    throw new Error(`生成画像レコードの保存に失敗しました: ${error.message}`);
  }

  const variation: Variation = {
    id: data.id,
    generation_job_id: data.generation_job_id,
    variation_rank: data.variation_rank,
    image_url: data.image_url,
    storage_path: data.storage_path,
    status: data.status as VariationStatus,
    created_at: data.created_at,
  };

  if (data.safety_flags) {
    variation.safety_flags = data.safety_flags;
  }

  return variation;
}

export async function listVariationsByJob(jobId: string): Promise<Variation[]> {
  const { data, error } = await supabase
    .from('salon_variations')
    .select('*')
    .eq('generation_job_id', jobId)
    .order('variation_rank', { ascending: true });

  if (error) {
    throw new Error(`生成画像の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const variation: Variation = {
      id: row.id,
      generation_job_id: row.generation_job_id,
      variation_rank: row.variation_rank,
      image_url: row.image_url,
      storage_path: row.storage_path,
      status: row.status as VariationStatus,
      created_at: row.created_at,
    };

    if (row.safety_flags) {
      variation.safety_flags = row.safety_flags;
    }

    return variation;
  });
}

export async function updateVariationStatus(
  variationId: string,
  status: VariationStatus,
): Promise<void> {
  const { error } = await supabase
    .from('salon_variations')
    .update({ status })
    .eq('id', variationId);

  if (error) {
    throw new Error(`生成画像ステータスの更新に失敗しました: ${error.message}`);
  }
}

export async function fetchLatestJobByAsset(
  assetId: string,
): Promise<GenerationJobWithVariations | null> {
  const { data, error } = await supabase
    .from('salon_generation_jobs')
    .select(
      `
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
      `,
    )
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`最新の生成ジョブ取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const job: GenerationJobWithVariations = {
    id: data.id,
    asset_id: data.asset_id,
    project_id: data.project_id,
    parameters: data.parameters as StyleParameters,
    status: data.status as GenerationJobStatus,
    variation_count: data.variation_count,
    created_by: data.created_by,
    created_at: data.created_at,
    variations: (data.salon_variations ?? []).map((variation) => {
      const mapped: Variation = {
        id: variation.id,
        generation_job_id: variation.generation_job_id,
        variation_rank: variation.variation_rank,
        image_url: variation.image_url,
        storage_path: variation.storage_path,
        status: variation.status as VariationStatus,
        created_at: variation.created_at,
      };
      if (variation.safety_flags) {
        mapped.safety_flags = variation.safety_flags;
      }
      return mapped;
    }),
  };

  if (data.started_at) {
    job.started_at = data.started_at;
  }
  if (data.completed_at) {
    job.completed_at = data.completed_at;
  }
  if (data.error_message) {
    job.error_message = data.error_message;
  }
  if (data.response_id) {
    job.response_id = data.response_id;
  }

  return job;
}
