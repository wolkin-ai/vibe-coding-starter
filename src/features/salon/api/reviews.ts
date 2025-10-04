import { supabase } from '@/shared/lib/supabase';
import type { TablesInsert } from '@/shared/types/supabase';

import { requireAuthUser } from './helpers';
import type { Review } from '../types';

export async function listReviewsByVariations(variationIds: string[]): Promise<Review[]> {
  if (variationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('salon_reviews')
    .select('*')
    .in('variation_id', variationIds)
    .order('reviewed_at', { ascending: false });

  if (error) {
    throw new Error(`レビューの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const review: Review = {
      id: row.id,
      variation_id: row.variation_id,
      reviewed_by: row.reviewed_by,
      status: row.status,
      reviewed_at: row.reviewed_at,
    };

    if (row.comment) {
      review.comment = row.comment;
    }

    return review;
  });
}

export async function createReview({
  variationId,
  status,
  comment,
}: {
  variationId: string;
  status: 'approved' | 'rejected';
  comment?: string;
}): Promise<Review> {
  const user = await requireAuthUser();

  const payload: TablesInsert<'salon_reviews'> = {
    variation_id: variationId,
    status,
    reviewed_by: user.id,
    comment: comment ?? null,
  };

  const { data, error } = await supabase.from('salon_reviews').insert(payload).select().single();

  if (error) {
    throw new Error(`レビューの保存に失敗しました: ${error.message}`);
  }

  const review: Review = {
    id: data.id,
    variation_id: data.variation_id,
    reviewed_by: data.reviewed_by,
    status: data.status,
    reviewed_at: data.reviewed_at,
  };

  if (data.comment) {
    review.comment = data.comment;
  }

  return review;
}
