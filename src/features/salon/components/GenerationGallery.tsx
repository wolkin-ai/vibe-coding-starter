import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import {
  useAsset,
  useCreateReviewMutation,
  useLatestGenerationJob,
  useReviews,
  useVariationStatusMutation,
  useVariations,
} from '../hooks';
import { useGenerationStore } from '../store/generation';
import type { VariationStatus } from '../types';

export function GenerationGallery() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const {
    currentAsset,
    currentJob,
    variations: storeVariations,
    setVariations,
    setCurrentJob,
  } = useGenerationStore();

  const { data: assetFromDb, isLoading: isAssetLoading } = useAsset(assetId);
  const { data: latestJobData } = useLatestGenerationJob(assetId);

  useEffect(() => {
    if (!currentJob && latestJobData) {
      const { variations: _unused, ...jobWithoutVariations } = latestJobData;
      setCurrentJob(jobWithoutVariations);
      if (latestJobData.variations.length > 0 && storeVariations.length === 0) {
        setVariations(latestJobData.variations);
      }
    }
  }, [currentJob, latestJobData, setCurrentJob, setVariations, storeVariations.length]);

  const job = currentJob ?? latestJobData ?? null;
  const jobId = job?.id;

  const { data: variationsFromQuery = [], isLoading: isVariationsLoading } = useVariations(jobId);

  const variations = useMemo(() => {
    if (storeVariations.length > 0) return storeVariations;
    if (variationsFromQuery.length > 0) return variationsFromQuery;
    if (latestJobData?.variations.length) return latestJobData.variations;
    return [];
  }, [storeVariations, variationsFromQuery, latestJobData]);

  const variationIds = useMemo(() => variations.map((variation) => variation.id), [variations]);
  const { data: reviews = [] } = useReviews(variationIds);
  const createReviewMutation = useCreateReviewMutation(variationIds);
  const variationStatusMutation = useVariationStatusMutation();

  const asset = currentAsset ?? assetFromDb;
  const isGenerating = job?.status === 'processing';

  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  if (isAssetLoading) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center text-gray-500">読み込み中です...</Card>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>画像が見つかりません</p>
      </div>
    );
  }

  const selectedVar = variations.find((variation) => variation.id === selectedVariation);
  const existingReview = selectedVar
    ? reviews.find((review) => review.variation_id === selectedVar.id)
    : null;

  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!selectedVariation || !jobId) return;

    try {
      await variationStatusMutation.mutateAsync({
        variationId: selectedVariation,
        jobId,
        projectId: asset.project_id,
        status: status === 'approved' ? 'approved' : 'rejected',
      });

      await createReviewMutation.mutateAsync({
        variationId: selectedVariation,
        status,
        ...(reviewComment ? { comment: reviewComment } : {}),
      });

      setVariations((prev) =>
        prev.map((variation) =>
          variation.id === selectedVariation
            ? { ...variation, status: status as VariationStatus }
            : variation,
        ),
      );

      setSelectedVariation(null);
      setReviewComment('');
    } catch (error) {
      console.error('レビュー処理に失敗しました', error);
      alert(error instanceof Error ? error.message : 'レビュー処理に失敗しました');
    }
  };

  const getStatusLabel = (status: VariationStatus) => {
    const labels: Record<VariationStatus, string> = {
      draft: '未レビュー',
      reviewing: 'レビュー中',
      approved: '承認済み',
      rejected: '却下',
    };
    return labels[status];
  };

  const getStatusColor = (status: VariationStatus) => {
    const colors: Record<VariationStatus, string> = {
      draft: 'bg-gray-100 text-gray-700',
      reviewing: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status];
  };

  const approvedCount = variations.filter((variation) => variation.status === 'approved').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">生成結果ギャラリー</h1>
          <p className="mt-2 text-sm text-gray-600">生成されたスタイル案を比較・承認してください</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            戻る
          </Button>
          <Button onClick={() => navigate(`/salon/assets/${assetId}/style-parameters`)}>
            別のスタイルを生成
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">生成されたバリエーション</p>
            <p className="text-3xl font-bold">{variations.length}案</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">承認済み</p>
            <p className="text-3xl font-bold text-green-600">{approvedCount}案</p>
          </div>
          <div>
            <Button
              disabled={approvedCount === 0}
              onClick={() => navigate(`/salon/projects/${asset.project_id}/approved-export`)}
            >
              承認済み案をエクスポート ({approvedCount})
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">スタイルバリエーション</h2>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-gray-600">元画像</h3>
              <div className="aspect-[4/5] max-w-xs overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
                <img
                  src={asset.original_url}
                  alt="Original"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <h3 className="mb-3 text-sm font-medium text-gray-600">
              生成されたスタイル
              {isGenerating && (
                <span className="ml-2 text-blue-600">
                  ({variations.length}/{job?.variation_count ?? 4} 生成中...)
                </span>
              )}
            </h3>

            {(isGenerating || isVariationsLoading) && variations.length === 0 && (
              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="text-sm text-blue-800">
                    スタイルを生成中です... 生成されたものから順に表示されます
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {variations.map((variation) => {
                const review = reviews.find((r) => r.variation_id === variation.id);
                const isSelected = selectedVariation === variation.id;

                return (
                  <div
                    key={variation.id}
                    className={`group cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVariation(isSelected ? null : variation.id)}
                  >
                    <div className="relative aspect-[4/5] bg-gray-100">
                      <img
                        src={variation.image_url}
                        alt={`Variation ${variation.variation_rank}`}
                        className="h-full w-full object-cover"
                      />
                      <span
                        className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(variation.status)}`}
                      >
                        {getStatusLabel(variation.status)}
                      </span>
                    </div>
                    <div className="space-y-2 p-3 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">案 #{variation.variation_rank}</p>
                        {review && (
                          <span className="text-xs text-blue-600">
                            {new Date(review.reviewed_at).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                      {review?.comment && (
                        <p className="line-clamp-2 text-xs">💬 {review.comment}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6 space-y-4 p-6">
            <h2 className="text-lg font-semibold">レビュー</h2>
            {selectedVar ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">案 #{selectedVar.variation_rank}</p>
                  <img
                    src={selectedVar.image_url}
                    alt="Selected variation"
                    className="mt-2 w-full rounded-lg border"
                  />
                </div>
                <textarea
                  className="h-24 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="レビューコメントを入力してください"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                {existingReview && (
                  <p className="rounded bg-gray-100 p-2 text-xs text-gray-600">
                    既存レビュー: {existingReview.status === 'approved' ? '承認済み' : '却下'} /{' '}
                    {existingReview.comment ?? 'コメントなし'}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handleReviewAction('approved')}>
                    承認する
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleReviewAction('rejected')}
                  >
                    却下する
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">レビューするスタイルを選択してください</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
