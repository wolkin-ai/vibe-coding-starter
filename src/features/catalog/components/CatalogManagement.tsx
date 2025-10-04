import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useCatalogStore } from '../store/catalog';
import type { HairStyleStatus } from '../types';

const STATUS_LABELS: Record<HairStyleStatus, string> = {
  draft: '下書き',
  reviewing: 'レビュー中',
  approved: '掲載中',
  archived: 'アーカイブ',
};

type FilterStatus = 'all' | HairStyleStatus;

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'draft', label: STATUS_LABELS.draft },
  { value: 'reviewing', label: STATUS_LABELS.reviewing },
  { value: 'approved', label: STATUS_LABELS.approved },
  { value: 'archived', label: STATUS_LABELS.archived },
];

export function CatalogManagement() {
  const navigate = useNavigate();
  const { styles, updateStyle, approveStyle, removeStyle } = useCatalogStore();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredStyles = useMemo(() => {
    if (filterStatus === 'all') return styles;
    return styles.filter((s) => s.status === filterStatus);
  }, [styles, filterStatus]);

  const stats = useMemo(() => {
    const base: Record<HairStyleStatus, number> & { total: number } = {
      total: styles.length,
      draft: 0,
      reviewing: 0,
      approved: 0,
      archived: 0,
    };

    styles.forEach((style) => {
      base[style.status] += 1;
    });

    return base;
  }, [styles]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkUpdateStatus = (status: HairStyleStatus) => {
    selectedIds.forEach((id) => {
      if (status === 'approved') {
        approveStyle(id);
        return;
      }

      updateStyle(id, {
        status,
        approved_at: null,
      });
    });
    clearSelection();
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}件のスタイルを削除しますか？`)) return;
    selectedIds.forEach((id) => removeStyle(id));
    clearSelection();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">カタログ管理</h1>
          <p className="mt-1 text-gray-600">生成したスタイルやモデルをまとめて管理できます。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/catalog/generate-model')}>カットモデル生成</Button>
          <Button onClick={() => navigate('/catalog/generate-style')} variant="outline">
            ヘアスタイル生成
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">総スタイル数</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">下書き</p>
          <p className="text-3xl font-bold text-blue-600">{stats.draft}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">レビュー中</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.reviewing}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">掲載中</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={filterStatus === option.value ? 'primary' : 'outline'}
                onClick={() => setFilterStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">{selectedIds.size}件選択中</span>
              <Button onClick={() => bulkUpdateStatus('approved')}>掲載にする</Button>
              <Button variant="outline" onClick={() => bulkUpdateStatus('reviewing')}>
                レビューへ戻す
              </Button>
              <Button variant="outline" onClick={() => bulkUpdateStatus('archived')}>
                アーカイブ
              </Button>
              <Button variant="outline" onClick={handleDelete}>
                削除
              </Button>
              <Button variant="secondary" onClick={clearSelection}>
                選択解除
              </Button>
            </div>
          )}
        </div>
      </Card>

      {filteredStyles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center text-gray-600">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            📸
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-800">まだカタログがありません</p>
            <p className="text-sm text-gray-500">
              カットモデルやヘアスタイルを生成するとここに一覧が表示されます。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/catalog/generate-model')}>カットモデルを作成</Button>
            <Button variant="outline" onClick={() => navigate('/catalog/generate-style')}>
              ヘアスタイルを作成
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredStyles.map((style) => (
            <Card
              key={style.id}
              className={`overflow-hidden transition-shadow hover:shadow-lg ${
                selectedIds.has(style.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => toggleSelection(style.id)}
            >
              <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                <img src={style.image_url} alt={style.id} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{STATUS_LABELS[style.status]}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(style.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                  {style.tags?.length
                    ? style.tags.map((tag) => (
                        <span key={tag} className="rounded bg-gray-200 px-2 py-0.5">
                          {tag}
                        </span>
                      ))
                    : 'タグなし'}
                </div>
                {style.parameters && (
                  <div className="text-xs text-gray-500">
                    <span>{style.parameters.length}</span> / <span>{style.parameters.texture}</span>{' '}
                    /<span>{style.parameters.color}</span>
                  </div>
                )}
                {style.reference_image_url && <p className="text-xs text-blue-500">参考画像あり</p>}
              </div>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 text-xs">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (style.status === 'approved') {
                      updateStyle(style.id, { status: 'draft', approved_at: null });
                    } else {
                      approveStyle(style.id);
                    }
                  }}
                >
                  {style.status === 'approved' ? '下書きへ' : '掲載する'}
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStyle(style.id, { status: 'archived', approved_at: null });
                  }}
                >
                  アーカイブ
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStyle(style.id, { status: 'reviewing', approved_at: null });
                  }}
                >
                  レビュー
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStyle(style.id);
                  }}
                >
                  削除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
