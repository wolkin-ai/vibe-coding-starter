import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { mockVariations, mockReviews } from '../mock-data';

export function ApprovedExport() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Set<string>>(new Set());

  // 承認済みのバリエーションのみを表示
  const approvedVariations = mockVariations.filter((v) => v.status === 'approved');

  const toggleVariation = (variationId: string) => {
    setSelectedVariations((prev) => {
      const next = new Set(prev);
      if (next.has(variationId)) {
        next.delete(variationId);
      } else {
        next.add(variationId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedVariations(new Set(approvedVariations.map((v) => v.id)));
  };

  const deselectAll = () => {
    setSelectedVariations(new Set());
  };

  const handleExport = async () => {
    if (selectedVariations.size === 0) return;

    setIsExporting(true);
    // モックエクスポート処理
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);

    alert(
      `${selectedVariations.size}案をエクスポートしました。\n\nエクスポート内容:\n- 高解像度画像 x${selectedVariations.size}\n- スタイル情報PDF\n- 共有用リンク`,
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">承認済み案のエクスポート</h1>
          <p className="mt-2 text-sm text-gray-600">
            お客様への提案や共有用に承認済みスタイルをエクスポート
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          戻る
        </Button>
      </div>

      {/* 情報カード */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 p-4">
        <div className="flex gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-800">エクスポート内容</p>
            <ul className="ml-4 list-disc space-y-1 text-blue-700">
              <li>高解像度PNG/JPEG画像</li>
              <li>スタイルパラメータ詳細（PDF）</li>
              <li>顧客共有用のWebリンク（有効期限付き）</li>
              <li>SNS投稿用サイズの画像（オプション）</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 選択コントロール */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">承認済みスタイル: {approvedVariations.length}案</p>
            <p className="text-sm text-gray-600">選択中: {selectedVariations.size}案</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={selectAll}>
              すべて選択
            </Button>
            <Button variant="outline" onClick={deselectAll}>
              選択解除
            </Button>
          </div>
        </div>
      </Card>

      {/* ギャラリー */}
      {approvedVariations.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {approvedVariations.map((variation) => {
              const isSelected = selectedVariations.has(variation.id);
              const review = mockReviews.find((r) => r.variation_id === variation.id);

              return (
                <Card
                  key={variation.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-4 ring-blue-500' : 'hover:shadow-lg'
                  }`}
                  onClick={() => toggleVariation(variation.id)}
                >
                  <div className="relative">
                    <div className="aspect-[4/5] overflow-hidden rounded-t-lg bg-gray-100">
                      <img
                        src={variation.image_url}
                        alt={`Variation ${variation.variation_rank}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                        ✓
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        承認済み
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium">案 #{variation.variation_rank}</p>
                    {review && review.comment && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">💬 {review.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      承認日: {new Date(variation.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* エクスポートボタン */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">エクスポート準備完了</p>
                <p className="text-sm text-gray-600">
                  選択した{selectedVariations.size}
                  案をダウンロード・共有用に出力します
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={selectedVariations.size === 0 || isExporting}
                size="lg"
              >
                {isExporting ? 'エクスポート中...' : `${selectedVariations.size}案をエクスポート`}
              </Button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 text-sm font-semibold">エクスポート形式:</p>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">高解像度画像</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">詳細PDF</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">共有リンク</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm">SNS用画像</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm">印刷用A4</span>
                </label>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="py-12 text-center text-gray-500">
          <p className="mb-2">承認済みのスタイルがまだありません</p>
          <p className="text-sm">スタイルを生成して承認してからエクスポートしてください</p>
          <Button className="mt-4" onClick={() => navigate(`/salon/projects/${projectId}`)}>
            プロジェクトに戻る
          </Button>
        </div>
      )}
    </div>
  );
}
