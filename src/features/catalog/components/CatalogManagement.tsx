import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useCatalogModelsQuery, useCatalogStylesQuery } from '../hooks';
import { useCatalogStore } from '../store/catalog';
import type {
  CutModel,
  HairLength,
  HairParameters,
  HairQuality,
  HairStyleStatus,
  HairTexture,
  HairThickness,
  HairVolume,
} from '../types';

const STATUS_LABELS: Record<HairStyleStatus, string> = {
  draft: '下書き',
  reviewing: 'レビュー中',
  approved: '掲載中',
  archived: 'アーカイブ',
};

type FilterStatus = 'all' | HairStyleStatus;

type CatalogTab = 'styles' | 'models';

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'draft', label: STATUS_LABELS.draft },
  { value: 'reviewing', label: STATUS_LABELS.reviewing },
  { value: 'approved', label: STATUS_LABELS.approved },
  { value: 'archived', label: STATUS_LABELS.archived },
];

const TAB_OPTIONS: { value: CatalogTab; label: string }[] = [
  { value: 'styles', label: 'スタイル' },
  { value: 'models', label: 'モデル' },
];

const HAIR_LENGTH_TEXT: Record<HairLength, string> = {
  very_short: 'ベリーショート',
  short: 'ショート',
  bob: 'ボブ',
  medium: 'ミディアム',
  semi_long: 'セミロング',
  long: 'ロング',
  super_long: 'スーパーロング',
};

const HAIR_VOLUME_TEXT: Record<HairVolume, string> = {
  low: '少ない',
  normal: '普通',
  high: '多い',
};

const HAIR_QUALITY_TEXT: Record<HairQuality, string> = {
  soft: '柔らかい',
  normal: '普通',
  firm: '硬い',
};

const HAIR_THICKNESS_TEXT: Record<HairThickness, string> = {
  thin: '細い',
  normal: '普通',
  thick: '太い',
};

const HAIR_TEXTURE_TEXT: Record<HairTexture, string> = {
  none: 'クセなし',
  slight: 'クセ少し',
  strong: 'クセ強め',
};

function formatHairProfile(profile?: Partial<HairParameters> | null): string {
  if (!profile) return 'ヘア情報なし';

  const parts: string[] = [];
  if (profile.length)
    parts.push(`長さ:${HAIR_LENGTH_TEXT[profile.length as HairLength] ?? profile.length}`);
  if (profile.volume)
    parts.push(`量:${HAIR_VOLUME_TEXT[profile.volume as HairVolume] ?? profile.volume}`);
  if (profile.quality)
    parts.push(`質:${HAIR_QUALITY_TEXT[profile.quality as HairQuality] ?? profile.quality}`);
  if (profile.thickness)
    parts.push(
      `太さ:${HAIR_THICKNESS_TEXT[profile.thickness as HairThickness] ?? profile.thickness}`,
    );
  if (profile.texture)
    parts.push(`クセ:${HAIR_TEXTURE_TEXT[profile.texture as HairTexture] ?? profile.texture}`);
  return parts.length ? parts.join(' / ') : 'ヘア情報なし';
}

function extractCustomNote(model: CutModel): string {
  const params = model.generation_params as { custom_note?: unknown };
  const note = params?.custom_note;
  if (typeof note === 'string') {
    const trimmed = note.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
}

function formatStyleSummary(params?: HairParameters | null): string {
  if (!params) return 'パラメータなし';
  const parts: string[] = [];
  if (params.length) parts.push(HAIR_LENGTH_TEXT[params.length] ?? params.length);
  if (params.texture) parts.push(HAIR_TEXTURE_TEXT[params.texture] ?? params.texture);
  if (params.color) parts.push(`カラー:${params.color}`);
  if (params.bangs) parts.push(`前髪:${params.bangs}`);
  return parts.length ? parts.join(' / ') : 'パラメータなし';
}

export function CatalogManagement() {
  const navigate = useNavigate();
  const { styles, models, updateStyle, approveStyle, removeStyle, getModelStyles } =
    useCatalogStore();
  const {
    isLoading: isLoadingModels,
    isError: isModelsError,
    error: modelsError,
    refetch: refetchModels,
  } = useCatalogModelsQuery();
  const {
    isLoading: isLoadingStyles,
    isError: isStylesError,
    error: stylesError,
    refetch: refetchStyles,
  } = useCatalogStylesQuery();

  const [activeTab, setActiveTab] = useState<CatalogTab>('styles');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null;
    return models.find((model) => model.id === selectedModelId) ?? null;
  }, [models, selectedModelId]);

  const relatedStyles = useMemo(() => {
    if (!selectedModel) return [];
    return getModelStyles(selectedModel.id);
  }, [selectedModel, getModelStyles]);

  useEffect(() => {
    if (!selectedModelId) return;
    if (!models.some((model) => model.id === selectedModelId)) {
      setSelectedModelId(null);
    }
  }, [models, selectedModelId]);

  useEffect(() => {
    if (activeTab !== 'styles') {
      setSelectedIds(new Set());
    }
    if (activeTab === 'models' && !selectedModelId && models.length > 0) {
      setSelectedModelId(models[0]?.id ?? null);
    }
  }, [activeTab, models, selectedModelId]);

  const filteredStyles = useMemo(() => {
    if (filterStatus === 'all') return styles;
    return styles.filter((s) => s.status === filterStatus);
  }, [styles, filterStatus]);

  const styleStats = useMemo(() => {
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

  const modelStats = useMemo(() => {
    const total = models.length;
    const favorites = models.filter((model) => model.is_favorite).length;
    const latest = models
      .map((model) => model.created_at)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];
    return {
      total,
      favorites,
      latest,
    };
  }, [models]);

  const toggleStyleSelection = (id: string) => {
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

      <div className="flex flex-wrap gap-2">
        {TAB_OPTIONS.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'primary' : 'outline'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'styles' ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">総スタイル数</p>
              <p className="text-3xl font-bold">{styleStats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">下書き</p>
              <p className="text-3xl font-bold text-blue-600">{styleStats.draft}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">レビュー中</p>
              <p className="text-3xl font-bold text-yellow-600">{styleStats.reviewing}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">掲載中</p>
              <p className="text-3xl font-bold text-emerald-600">{styleStats.approved}</p>
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

          {isLoadingStyles ? (
            <Card className="p-6 text-center text-gray-500">スタイル情報を読み込み中です...</Card>
          ) : isStylesError ? (
            <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-center justify-between">
                <p>
                  スタイルの取得に失敗しました:{' '}
                  {stylesError instanceof Error ? stylesError.message : '不明なエラー'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchStyles()}>
                  再読み込み
                </Button>
              </div>
            </Card>
          ) : filteredStyles.length === 0 ? (
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
                <Button onClick={() => navigate('/catalog/generate-model')}>
                  カットモデルを作成
                </Button>
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
                  onClick={() => toggleStyleSelection(style.id)}
                >
                  <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                    <img
                      src={style.image_url}
                      alt={style.id}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        {STATUS_LABELS[style.status]}
                      </span>
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
                        {formatStyleSummary(style.parameters)}
                      </div>
                    )}
                    {style.reference_image_url && (
                      <p className="text-xs text-blue-500">参考画像あり</p>
                    )}
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
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-gray-600">総モデル数</p>
              <p className="text-3xl font-bold">{modelStats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">お気に入り</p>
              <p className="text-3xl font-bold text-pink-600">{modelStats.favorites}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">最新追加日</p>
              <p className="text-2xl font-semibold">
                {modelStats.latest
                  ? new Date(modelStats.latest).toLocaleDateString('ja-JP')
                  : '---'}
              </p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
            <Card className="p-4">
              <h2 className="mb-3 text-lg font-semibold">モデル一覧</h2>
              {isLoadingModels ? (
                <p className="text-sm text-gray-500">モデル情報を読み込み中です...</p>
              ) : isModelsError ? (
                <div className="space-y-3 text-sm text-red-600">
                  <p>
                    モデルの取得に失敗しました:{' '}
                    {modelsError instanceof Error ? modelsError.message : '不明なエラー'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetchModels()}>
                    再読み込み
                  </Button>
                </div>
              ) : models.length === 0 ? (
                <p className="text-sm text-gray-500">保存済みのモデルがありません。</p>
              ) : (
                <div className="space-y-3">
                  {models.map((model) => {
                    const isActive = selectedModelId === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`flex cursor-pointer gap-3 rounded border p-3 text-sm transition ${
                          isActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedModelId(model.id)}
                      >
                        <img
                          src={model.image_url}
                          alt={model.id}
                          className="h-16 w-12 rounded object-cover"
                        />
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{model.id}</span>
                            {model.is_favorite && <span className="text-xs text-pink-500">★</span>}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatHairProfile(model.hair_profile)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(model.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-4">
              {selectedModel ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">モデル詳細</h2>
                      <p className="text-xs text-gray-500">ID: {selectedModel.id}</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/catalog/generate-style')}>
                      このモデルでスタイル生成
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,240px)_1fr]">
                    <div className="overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={selectedModel.image_url}
                        alt={selectedModel.id}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-3 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold text-gray-900">性別:</span> 女性
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">年齢帯:</span>{' '}
                        {selectedModel.age_range}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">顔型:</span>{' '}
                        {selectedModel.face_type ?? '未設定'}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">ベースヘア:</span>{' '}
                        {formatHairProfile(selectedModel.hair_profile)}
                      </p>
                      {extractCustomNote(selectedModel) && (
                        <p>
                          <span className="font-semibold text-gray-900">メモ:</span>{' '}
                          {extractCustomNote(selectedModel)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        保存日: {new Date(selectedModel.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                      紐づくスタイル ({relatedStyles.length})
                    </h3>
                    {relatedStyles.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        このモデルを使ったスタイルはまだありません。
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedStyles.map((style) => (
                          <Card key={style.id} className="overflow-hidden">
                            <div className="aspect-[4/5] bg-gray-100">
                              <img
                                src={style.image_url}
                                alt={style.id}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="space-y-1 p-2 text-xs text-gray-600">
                              <p className="font-semibold text-gray-800">
                                {STATUS_LABELS[style.status]}
                              </p>
                              <p>{formatStyleSummary(style.parameters)}</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(style.created_at).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-500">
                  <p>左の一覧からモデルを選択してください。</p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
