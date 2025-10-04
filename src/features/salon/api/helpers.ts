import { supabase } from '@/shared/lib/supabase';

import type { User } from '@supabase/supabase-js';

/**
 * 現在サインイン中のユーザーを必須として取得
 */
export async function requireAuthUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`サインイン情報の取得に失敗しました: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('サインインされていません');
  }

  return data.user;
}

/**
 * ストレージ用にファイル名をサニタイズ
 */
export function sanitizeFileName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Data URLからBlobを生成
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  if (!header || !base64) {
    throw new Error('不正なデータURLです');
  }

  const match = header.match(/data:(.*);base64/);
  const mimeType = match?.[1] ?? 'image/png';
  const binary = atob(base64);
  const length = binary.length;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }

  return new Blob([buffer], { type: mimeType });
}

/**
 * MIMEタイプから推奨拡張子を判断
 */
export function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'png';
}
