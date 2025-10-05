import { supabase } from '@/shared/lib/supabase';
import type { Json, Tables, TablesInsert } from '@/shared/types/supabase';

import {
  dataUrlToBlob,
  mimeToExtension,
  requireAuthUser,
  sanitizeFileName,
} from '@/features/salon/api/helpers';

import type { HairParameters, HairStyle, HairStyleStatus } from '../types';

const STYLE_BUCKET = 'catalog-styles';

function randomSuffix(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

function buildStylePath(
  userId: string,
  fileName: string,
  mimeType: string,
  type: 'styles' | 'references',
) {
  const sanitized = sanitizeFileName(fileName || 'style');
  const ext = mimeToExtension(mimeType);
  const suffix = randomSuffix();
  return `${userId}/${type}/${suffix}-${sanitized}.${ext}`;
}

async function imageUrlToBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    return dataUrlToBlob(url);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('生成画像データの取得に失敗しました');
  }
  return response.blob();
}

export interface SaveCatalogStyleInput {
  imageUrl: string;
  parameters: HairParameters;
  status: HairStyleStatus;
  tags?: string[];
  generationParams?: Record<string, unknown>;
  generationPrompt?: string;
  generationJobId?: string;
  cutModelId?: string;
  referenceImageFile?: File;
  referenceImageUrl?: string;
  title?: string;
  description?: string;
}

function mapRowToHairStyle(row: Tables<'catalog_hair_styles'>): HairStyle {
  const parameters = row.parameters as unknown as HairParameters;
  const generationParams = row.generation_params
    ? (row.generation_params as Record<string, unknown>)
    : undefined;

  const style: HairStyle = {
    id: row.id,
    parameters,
    image_url: row.image_url,
    status: row.status as HairStyleStatus,
    is_favorite: row.is_favorite,
    tags: row.tags ?? [],
    generation_job_id: row.generation_job_id ?? `job-${row.id}`,
    created_at: row.created_at,
    created_by: row.created_by,
  };

  if (row.cut_model_id) {
    style.cut_model_id = row.cut_model_id;
  }
  if (row.reference_image_url) {
    style.reference_image_url = row.reference_image_url;
  }
  if (row.thumbnail_url) {
    style.thumbnail_url = row.thumbnail_url;
  }
  if (row.storage_path) {
    style.storage_path = row.storage_path;
  }
  if (generationParams) {
    style.generation_params = generationParams;
  }
  if (row.generation_prompt) {
    style.generation_prompt = row.generation_prompt;
  }
  if (row.synthid_metadata) {
    style.synthid_metadata = row.synthid_metadata;
  }
  if (row.title) {
    style.title = row.title;
  }
  if (row.description) {
    style.description = row.description;
  }
  if (row.approved_at !== null) {
    style.approved_at = row.approved_at;
  }
  if (row.updated_at) {
    style.updated_at = row.updated_at;
  }

  return style;
}

export async function listCatalogStyles(): Promise<HairStyle[]> {
  const { data, error } = await supabase
    .from('catalog_hair_styles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`カタログスタイルの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToHairStyle(row as Tables<'catalog_hair_styles'>));
}

export async function saveCatalogStyles(inputs: SaveCatalogStyleInput[]): Promise<HairStyle[]> {
  if (inputs.length === 0) {
    return [];
  }

  const user = await requireAuthUser();
  const savedStyles: HairStyle[] = [];

  for (const input of inputs) {
    const blob = await imageUrlToBlob(input.imageUrl);
    const mimeType = blob.type || 'image/png';
    const stylePath = buildStylePath(user.id, 'generated-style', mimeType, 'styles');

    const { error: uploadError } = await supabase.storage
      .from(STYLE_BUCKET)
      .upload(stylePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`スタイル画像のアップロードに失敗しました: ${uploadError.message}`);
    }

    const { data: styleUrlData } = supabase.storage.from(STYLE_BUCKET).getPublicUrl(stylePath);
    if (!styleUrlData?.publicUrl) {
      throw new Error('スタイル画像の公開URLを取得できませんでした');
    }

    let referenceImageUrl: string | null = input.referenceImageUrl ?? null;
    if (input.referenceImageFile) {
      const referenceBlob = input.referenceImageFile;
      const refMime = referenceBlob.type || 'image/png';
      const referencePath = buildStylePath(
        user.id,
        input.referenceImageFile.name,
        refMime,
        'references',
      );
      const { error: refUploadError } = await supabase.storage
        .from(STYLE_BUCKET)
        .upload(referencePath, referenceBlob, { cacheControl: '3600', upsert: false });
      if (refUploadError) {
        console.warn('参考画像のアップロードに失敗しました:', refUploadError.message);
      } else {
        const { data: refUrlData } = supabase.storage
          .from(STYLE_BUCKET)
          .getPublicUrl(referencePath);
        if (refUrlData?.publicUrl) {
          referenceImageUrl = refUrlData.publicUrl;
        }
      }
    }

    const insertPayload: TablesInsert<'catalog_hair_styles'> = {
      parameters: input.parameters as unknown as Json,
      image_url: styleUrlData.publicUrl,
      storage_path: stylePath,
      thumbnail_url: null,
      status: input.status,
      is_favorite: false,
      tags: input.tags && input.tags.length > 0 ? input.tags : [],
      generation_params: input.generationParams ? (input.generationParams as Json) : null,
      generation_prompt: input.generationPrompt ?? null,
      generation_job_id: input.generationJobId ?? null,
      cut_model_id: input.cutModelId ?? null,
      reference_image_url: referenceImageUrl,
      title: input.title ?? null,
      description: input.description ?? null,
      approved_at: null,
      synthid_metadata: null,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('catalog_hair_styles')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      throw new Error(`スタイル情報の保存に失敗しました: ${error.message}`);
    }

    savedStyles.push(mapRowToHairStyle(data as Tables<'catalog_hair_styles'>));
  }

  return savedStyles;
}
