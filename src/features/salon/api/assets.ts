import { supabase } from '@/shared/lib/supabase';
import type { Json, TablesInsert } from '@/shared/types/supabase';

import { mimeToExtension, requireAuthUser, sanitizeFileName } from './helpers';
import type { Asset, AssetStatus } from '../types';

const ASSET_BUCKET = 'salon-assets';

function buildAssetPath(projectId: string, fileName: string, mimeType: string | undefined): string {
  const base = sanitizeFileName(fileName || 'asset');
  const extension = mimeType ? mimeToExtension(mimeType) : base.split('.').pop() || 'png';
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return `projects/${projectId}/${randomId}-${base}.${extension}`;
}

export async function uploadAsset({
  projectId,
  file,
  description,
  status = 'ready_for_generation',
}: {
  projectId: string;
  file: File;
  description?: string;
  status?: AssetStatus;
}): Promise<Asset> {
  const user = await requireAuthUser();
  const path = buildAssetPath(projectId, file.name, file.type);

  const { error: uploadError } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Supabaseストレージへのアップロードに失敗しました: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);

  if (!publicUrlData?.publicUrl) {
    throw new Error('ストレージの公開URLを取得できませんでした');
  }

  const metadata: Record<string, unknown> = {
    originalName: file.name,
    size: file.size,
    type: file.type,
  };

  const insertPayload: TablesInsert<'salon_assets'> = {
    project_id: projectId,
    original_url: publicUrlData.publicUrl,
    storage_path: path,
    status,
    uploaded_by: user.id,
    description: description ?? null,
    metadata: metadata as Json,
  };

  const { data, error } = await supabase
    .from('salon_assets')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`アセット情報の保存に失敗しました: ${error.message}`);
  }

  return mapAssetRow(data);
}

function mapAssetRow(row: {
  id: string;
  project_id: string;
  original_url: string;
  storage_path: string;
  status: string;
  uploaded_by: string;
  uploaded_at: string;
  description: string | null;
  metadata: unknown;
}): Asset {
  const base: Asset = {
    id: row.id,
    project_id: row.project_id,
    original_url: row.original_url,
    storage_path: row.storage_path,
    status: row.status as AssetStatus,
    uploaded_by: row.uploaded_by,
    uploaded_at: row.uploaded_at,
  };

  if (row.description) {
    base.description = row.description;
  }

  if (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)) {
    base.metadata = row.metadata as Record<string, unknown>;
  }

  return base;
}

export async function listAssets(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('salon_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(`アセット一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapAssetRow({
      id: row.id,
      project_id: row.project_id,
      original_url: row.original_url,
      storage_path: row.storage_path,
      status: row.status,
      uploaded_by: row.uploaded_by,
      uploaded_at: row.uploaded_at,
      description: row.description,
      metadata: row.metadata,
    }),
  );
}

export async function findAssetById(assetId: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('salon_assets')
    .select('*')
    .eq('id', assetId)
    .maybeSingle();

  if (error) {
    throw new Error(`アセットの取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapAssetRow({
    id: data.id,
    project_id: data.project_id,
    original_url: data.original_url,
    storage_path: data.storage_path,
    status: data.status,
    uploaded_by: data.uploaded_by,
    uploaded_at: data.uploaded_at,
    description: data.description,
    metadata: data.metadata,
  });
}

export async function updateAssetStatus(assetId: string, status: AssetStatus): Promise<void> {
  const { error } = await supabase.from('salon_assets').update({ status }).eq('id', assetId);

  if (error) {
    throw new Error(`アセットステータスの更新に失敗しました: ${error.message}`);
  }
}
