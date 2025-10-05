import { supabase } from '@/shared/lib/supabase';
import type { Json, Tables, TablesInsert } from '@/shared/types/supabase';

import {
  dataUrlToBlob,
  mimeToExtension,
  requireAuthUser,
  sanitizeFileName,
} from '@/features/salon/api/helpers';

import type { CutModel, HairParameters, ModelAgeRange, ModelFaceType, ModelGender } from '../types';

const MODEL_BUCKET = 'catalog-models';

function randomSuffix(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
}

function buildModelPath(userId: string, fileName: string, mimeType: string): string {
  const sanitized = sanitizeFileName(fileName || 'model');
  const ext = mimeToExtension(mimeType);
  const suffix = randomSuffix();
  return `${userId}/models/${suffix}-${sanitized}.${ext}`;
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

export interface SaveCutModelInput {
  imageUrl: string;
  gender: ModelGender;
  ageRange: ModelAgeRange;
  faceType?: ModelFaceType;
  hairProfile?: Partial<HairParameters> | null;
  generationParams: Record<string, unknown>;
  generationPrompt?: string;
  synthidMetadata?: unknown;
  tags?: string[];
}

function mapRowToCutModel(row: Tables<'catalog_cut_models'>): CutModel {
  const hairProfile = (row.hair_profile ?? undefined) as Partial<HairParameters> | undefined;
  const generationParams = (row.generation_params ?? {}) as Record<string, unknown>;
  const faceType = row.face_type as ModelFaceType | null;
  const gender = row.gender as ModelGender;
  const ageRange = row.age_range as ModelAgeRange;

  const model: CutModel = {
    id: row.id,
    gender,
    age_range: ageRange,
    image_url: row.image_url,
    generation_params: generationParams,
    storage_path: row.storage_path,
    is_favorite: row.is_favorite,
    tags: row.tags ?? [],
    created_at: row.created_at,
    created_by: row.created_by,
    updated_at: row.updated_at,
  };

  if (faceType) model.face_type = faceType;
  if (row.skin_tone) model.skin_tone = row.skin_tone;
  if (row.expression) model.expression = row.expression;
  if (hairProfile) model.hair_profile = hairProfile;
  if (row.thumbnail_url) model.thumbnail_url = row.thumbnail_url;
  if (row.generation_prompt) model.generation_prompt = row.generation_prompt;
  if (row.synthid_metadata) model.synthid_metadata = row.synthid_metadata;

  return model;
}

export async function listCatalogModels(): Promise<CutModel[]> {
  const { data, error } = await supabase
    .from('catalog_cut_models')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`カタログモデルの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToCutModel(row as Tables<'catalog_cut_models'>));
}

export async function saveCatalogModels(inputs: SaveCutModelInput[]): Promise<CutModel[]> {
  if (inputs.length === 0) {
    return [];
  }

  const user = await requireAuthUser();
  const savedModels: CutModel[] = [];

  for (const input of inputs) {
    const blob = await imageUrlToBlob(input.imageUrl);
    const mimeType = blob.type || 'image/png';
    const path = buildModelPath(user.id, 'generated-model', mimeType);

    const { error: uploadError } = await supabase.storage.from(MODEL_BUCKET).upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      throw new Error(`モデル画像のアップロードに失敗しました: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(MODEL_BUCKET).getPublicUrl(path);
    if (!publicUrlData?.publicUrl) {
      throw new Error('モデル画像の公開URLを取得できませんでした');
    }

    const insertPayload: TablesInsert<'catalog_cut_models'> = {
      image_url: publicUrlData.publicUrl,
      storage_path: path,
      thumbnail_url: null,
      gender: input.gender,
      age_range: input.ageRange,
      face_type: input.faceType ?? null,
      hair_profile: (input.hairProfile ?? {}) as Json,
      generation_params: (input.generationParams ?? {}) as Json,
      generation_prompt: input.generationPrompt ?? null,
      synthid_metadata: (input.synthidMetadata ?? null) as Json,
      is_favorite: false,
      tags: input.tags && input.tags.length > 0 ? input.tags : [],
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('catalog_cut_models')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      throw new Error(`モデル情報の保存に失敗しました: ${error.message}`);
    }

    savedModels.push(mapRowToCutModel(data as Tables<'catalog_cut_models'>));
  }

  return savedModels;
}

export async function updateCatalogModelFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('catalog_cut_models')
    .update({ is_favorite: isFavorite })
    .eq('id', id);

  if (error) {
    throw new Error(`お気に入り状態の更新に失敗しました: ${error.message}`);
  }
}

export async function deleteCatalogModel(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('catalog_cut_models')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`モデル情報の取得に失敗しました: ${error.message}`);
  }

  const storagePath = data?.storage_path ?? null;

  const { error: deleteError } = await supabase.from('catalog_cut_models').delete().eq('id', id);
  if (deleteError) {
    throw new Error(`モデル情報の削除に失敗しました: ${deleteError.message}`);
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(MODEL_BUCKET).remove([storagePath]);
    if (storageError) {
      console.warn('ストレージ画像の削除に失敗しました:', storageError.message);
    }
  }
}
