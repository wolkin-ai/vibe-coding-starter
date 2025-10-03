import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { mockAssets, mockVariations, mockReviews } from '../mock-data';
import { useGenerationStore } from '../store/generation';
import type { VariationStatus, Review } from '../types';

export function GenerationGallery() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const {
    currentAsset,
    currentJob,
    variations: storeVariations,
    setVariations,
  } = useGenerationStore();

  const asset = currentAsset || mockAssets.find((a) => a.id === assetId);
  // ストアのバリエーションがあればそれを使用、なければmockを使用
  const variations = storeVariations.length > 0 ? storeVariations : mockVariations;

  const isGenerating = currentJob?.status === 'processing';

  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>(mockReviews);

  if (!asset) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">画像が見つかりません</p>
      </div>
    );
  }

  const selectedVar = variations.find((v) => v.id === selectedVariation);
  const existingReview = selectedVar
    ? reviews.find((r) => r.variation_id === selectedVar.id)
    : null;

  const handleApprove = () => {
    if (!selectedVariation) return;

    // バリエーションのステータスを更新
    const updatedVariations = variations.map((v) =>
      v.id === selectedVariation ? { ...v, status: 'approved' as const } : v,
    );
    setVariations(updatedVariations);

    // レビューを追加
    const newReview: Review = {
      id: `review-${Date.now()}`,
      variation_id: selectedVariation,
      reviewed_by: 'user-1',
      status: 'approved',
      ...(reviewComment ? { comment: reviewComment } : {}),
      reviewed_at: new Date().toISOString(),
    };
    setReviews([...reviews, newReview]);

    setSelectedVariation(null);
    setReviewComment('');
  };

  const handleReject = () => {
    if (!selectedVariation) return;

    // バリエーションのステータスを更新
    const updatedVariations = variations.map((v) =>
      v.id === selectedVariation ? { ...v, status: 'rejected' as const } : v,
    );
    setVariations(updatedVariations);

    // レビューを追加
    const newReview: Review = {
      id: `review-${Date.now()}`,
      variation_id: selectedVariation,
      reviewed_by: 'user-1',
      status: 'rejected',
      ...(reviewComment ? { comment: reviewComment } : {}),
      reviewed_at: new Date().toISOString(),
    };
    setReviews([...reviews, newReview]);

    setSelectedVariation(null);
    setReviewComment('');
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

  const approvedCount = variations.filter((v) => v.status === 'approved').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* ヘッダー */}
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

      {/* 統計 */}
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
        {/* ギャラリー */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">スタイルバリエーション</h2>

            {/* 元画像 */}
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
                  ({variations.length}/{currentJob?.variation_count || 4} 生成中...)
                </span>
              )}
            </h3>

            {isGenerating && variations.length === 0 && (
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
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                    }`}
                    onClick={() => setSelectedVariation(variation.id)}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                      <img
                        src={variation.image_url}
                        alt={`Variation ${variation.variation_rank}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-2 top-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(variation.status)}`}
                        >
                          {getStatusLabel(variation.status)}
                        </span>
                      </div>
                      {variation.status === 'approved' && (
                        <div className="absolute left-2 top-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium">案 #{variation.variation_rank}</p>
                      {review && review.comment && (
                        <p className="mt-1 text-sm text-gray-600">💬 {review.comment}</p>
                      )}
                      {variation.safety_flags && variation.safety_flags.length > 0 && (
                        <p className="mt-1 text-xs text-yellow-600">
                          ⚠️ {variation.safety_flags.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* レビューパネル */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 p-6">
            {selectedVar ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    案 #{selectedVar.variation_rank} をレビュー
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    現在のステータス:{' '}
                    <span
                      className={`font-medium ${
                        selectedVar.status === 'approved'
                          ? 'text-green-600'
                          : selectedVar.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    >
                      {getStatusLabel(selectedVar.status)}
                    </span>
                  </p>
                </div>

                <div className="aspect-[4/5] overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={selectedVar.image_url}
                    alt="Selected variation"
                    className="h-full w-full object-cover"
                  />
                </div>

                {existingReview && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium">既存のレビュー</p>
                    <p className="mt-1 text-sm text-gray-600">{existingReview.comment}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(existingReview.reviewed_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium">コメント（オプション）</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="このスタイルについてのコメント..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    className="flex-1"
                    disabled={selectedVar.status === 'approved'}
                  >
                    ✓ 承認
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1"
                    disabled={selectedVar.status === 'rejected'}
                  >
                    ✗ 却下
                  </Button>
                </div>

                {selectedVar.status === 'approved' && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    ✓ この案は承認済みです。エクスポート時に含まれます。
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <p>左のギャラリーから</p>
                <p>スタイル案を選択してください</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {variations.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          <p className="mb-4">まだスタイルが生成されていません</p>
          <Button onClick={() => navigate(`/salon/assets/${assetId}/style-parameters`)}>
            スタイルを生成する
          </Button>
        </div>
      )}
    </div>
  );
}
