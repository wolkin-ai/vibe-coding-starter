import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { generateStyleVariations } from '../api/gemini';
import { mockStylePresets } from '../mock-data';
import {
  useAsset,
  useCreateGenerationJobMutation,
  useGenerationJobStatusMutation,
  useSaveVariationMutation,
} from '../hooks';
import { useGenerationStore } from '../store/generation';
import type { GenerationJob, StyleParameters as StyleParams, Variation } from '../types';

const HAIR_LENGTH_OPTIONS = [
  'ベリーショート',
  'ショート',
  'ボブ',
  'ミディアム',
  'セミロング',
  'ロング',
  'スーパーロング',
];
const COLOR_OPTIONS = [
  'ブラック系',
  'ブラウン系',
  'アッシュ系',
  'ベージュ系',
  'ピンク系',
  'レッド系',
  'オレンジ系',
  'イエロー系',
  '金髪',
];
const BANGS_OPTIONS = [
  'ぱっつん前髪',
  '流し前髪',
  'センターパート',
  '斜め前髪',
  '前髪なし',
  'シースルーバング',
];
const TEXTURE_OPTIONS = [
  'ストレート',
  'ゆるふわ',
  'ふんわり',
  'しっかりカール',
  'ウェーブ',
  'シャープ',
];
const IMAGE_STYLE_OPTIONS = [
  'ナチュラル',
  'カジュアル',
  'モード',
  'エレガント',
  'キュート',
  'クール',
  'フェミニン',
];

const HPB_CATEGORY_OPTIONS = [
  { value: 'FRONT' as const, label: 'FRONT', description: '正面ビュースタイル' },
  { value: 'SIDE' as const, label: 'SIDE', description: '横顔・サイドビュー' },
  { value: 'BACK' as const, label: 'BACK', description: 'バックショット' },
  { value: 'ARRANGE' as const, label: 'ARRANGE', description: 'アレンジスタイル' },
  { value: 'BEFORE' as const, label: 'BEFORE', description: '施術前のビフォー写真' },
  { value: 'FASHION' as const, label: 'FASHION', description: 'ファッションスナップ' },
];

const IDENTITY_SHIFT_OPTIONS = [
  {
    value: 'keep_similar' as const,
    label: '雰囲気はそのまま',
    description: '本人とわかる範囲で軽く整える',
  },
  {
    value: 'soft_change' as const,
    label: '少し別人風',
    description: '面影を残しつつ匿名化できる程度に変える',
  },
  {
    value: 'distinct_new' as const,
    label: '全く別人に',
    description: '本人と特定されないよう顔立ちを大きく変更',
  },
];

const MAKEUP_STYLE_OPTIONS = [
  {
    value: 'bare' as const,
    label: 'すっぴん風',
    description: 'メイクはほぼ加えず自然体に仕上げる',
  },
  { value: 'natural' as const, label: 'ナチュラル', description: '清潔感のある自然メイクで整える' },
  {
    value: 'glam' as const,
    label: 'しっかりメイク',
    description: '撮影向けに目元やリップを際立たせる',
  },
];

const RETOUCH_LEVEL_OPTIONS = [
  { value: 'none' as const, label: '補正なし', description: '肌補正などは行わない' },
  { value: 'light' as const, label: '控えめ', description: '肌を整える程度の軽い補正' },
  {
    value: 'full' as const,
    label: 'しっかり補正',
    description: 'レタッチや明るさ調整を積極的に行う',
  },
];

export function StyleParametersPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const { currentAsset, currentAssetFile, setCurrentAsset, setCurrentJob, setVariations } =
    useGenerationStore();

  const { data: assetFromDb, isLoading: isAssetLoading } = useAsset(assetId);
  const asset = currentAsset ?? assetFromDb ?? null;

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [parameters, setParameters] = useState<StyleParams>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJobMutation = useCreateGenerationJobMutation();
  const saveVariationMutation = useSaveVariationMutation();
  const jobStatusMutation = useGenerationJobStatusMutation();

  useEffect(() => {
    if (!currentAsset && assetFromDb && currentAssetFile) {
      setCurrentAsset(assetFromDb, currentAssetFile);
    }
  }, [assetFromDb, currentAsset, currentAssetFile, setCurrentAsset]);

  const isParametersSet = useMemo(
    () =>
      Boolean(
        parameters.hair_length ||
          parameters.color ||
          parameters.bangs ||
          parameters.texture ||
          parameters.image_style ||
          parameters.identity_shift ||
          parameters.makeup_style ||
          parameters.retouch_level ||
          parameters.hpb_category ||
          (parameters.custom_prompt && parameters.custom_prompt.trim().length > 0),
      ),
    [parameters],
  );

  const ensureAssetFile = async (): Promise<File> => {
    if (currentAssetFile) {
      return currentAssetFile;
    }
    if (!asset) {
      throw new Error('画像情報が見つかりませんでした');
    }
    const response = await fetch(asset.original_url);
    if (!response.ok) {
      throw new Error('元画像の取得に失敗しました');
    }
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] ?? 'png';
    const fileName =
      typeof asset.metadata?.originalName === 'string'
        ? (asset.metadata.originalName as string)
        : `asset-${asset.id}.${extension}`;
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });
    setCurrentAsset(asset, file);
    return file;
  };

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

  const handlePresetSelect = (presetId: string) => {
    const preset = mockStylePresets.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setParameters((prev) => {
      const next: StyleParams = { ...prev };

      if (preset.hair_length) {
        next.hair_length = preset.hair_length;
      } else {
        delete next.hair_length;
      }

      if (preset.color) {
        next.color = preset.color;
      } else {
        delete next.color;
      }

      if (preset.bangs) {
        next.bangs = preset.bangs;
      } else {
        delete next.bangs;
      }

      if (preset.texture) {
        next.texture = preset.texture;
      } else {
        delete next.texture;
      }

      if (preset.image_style) {
        next.image_style = preset.image_style;
      } else {
        delete next.image_style;
      }

      if (preset.identity_shift) {
        next.identity_shift = preset.identity_shift;
      } else {
        delete next.identity_shift;
      }

      if (preset.makeup_style) {
        next.makeup_style = preset.makeup_style;
      } else {
        delete next.makeup_style;
      }

      if (preset.retouch_level) {
        next.retouch_level = preset.retouch_level;
      } else {
        delete next.retouch_level;
      }

      if (preset.hpb_category) {
        next.hpb_category = preset.hpb_category;
      } else {
        delete next.hpb_category;
      }

      return next;
    });
  };

  const handleGenerate = async () => {
    let createdJob: GenerationJob | null = null;
    try {
      setIsGenerating(true);
      setError(null);

      const file = await ensureAssetFile();

      const job = await createJobMutation.mutateAsync({
        assetId: asset.id,
        projectId: asset.project_id,
        parameters,
        variationCount: 4,
      });

      createdJob = job;

      setCurrentJob(job);
      setVariations([]);

      navigate(`/salon/assets/${asset.id}/generation-gallery`);

      const uploadPromises: Promise<void>[] = [];

      await generateStyleVariations(file, parameters, 4, (result) => {
        const tempId =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `tmp-${Date.now()}-${result.variation_rank}`;
        const placeholder: Variation = {
          id: tempId,
          generation_job_id: job.id,
          variation_rank: result.variation_rank,
          image_url: result.image_url,
          storage_path: 'pending',
          status: 'draft',
          created_at: new Date().toISOString(),
        };

        setVariations((prev) => [...prev, placeholder]);

        const upload = saveVariationMutation
          .mutateAsync({
            jobId: job.id,
            variationRank: result.variation_rank,
            dataUrl: result.image_url,
          })
          .then((saved) => {
            setVariations((prev) =>
              prev.map((variation) => (variation.id === placeholder.id ? saved : variation)),
            );
          })
          .catch((uploadError) => {
            console.error('生成画像の保存に失敗しました', uploadError);
          });

        uploadPromises.push(upload);
      });

      await Promise.all(uploadPromises);

      await jobStatusMutation.mutateAsync({ jobId: job.id, status: 'completed' });
      setCurrentJob({ ...job, status: 'completed', completed_at: new Date().toISOString() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像生成中にエラーが発生しました';
      setError(message);
      if (createdJob) {
        await jobStatusMutation.mutateAsync({
          jobId: createdJob.id,
          status: 'failed',
          options: { errorMessage: message },
        });
        setCurrentJob({ ...createdJob, status: 'failed', error_message: message });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">スタイルパラメータ設定</h1>
          <p className="mt-2 text-sm text-gray-600">
            希望のスタイルを設定して複数のバリエーションを生成します
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          戻る
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          生成処理でエラーが発生しました: {error}
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">元画像</h2>
          <div className="overflow-hidden rounded-lg bg-gray-100">
            <img src={asset.original_url} alt="Original" className="w-full object-cover" />
          </div>
          {asset.description && <p className="mt-3 text-sm text-gray-600">{asset.description}</p>}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">プリセットから選ぶ</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {mockStylePresets.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold">{preset.name}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p>長さ: {preset.hair_length ?? '未設定'}</p>
                    <p>カラー: {preset.color ?? '未設定'}</p>
                    <p>イメージ: {preset.image_style ?? '未設定'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            💡 プリセットを選択後、下のパラメータで微調整できます
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">詳細パラメータ</h2>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block font-medium">顔の匿名化レベル</label>
            <div className="grid gap-3 md:grid-cols-3">
              {IDENTITY_SHIFT_OPTIONS.map((option) => {
                const isSelected = parameters.identity_shift === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      setParameters((prev) => ({
                        ...prev,
                        identity_shift: option.value,
                      }))
                    }
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="mt-2 text-xs text-gray-600">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">髪の長さ</label>
            <div className="flex flex-wrap gap-2">
              {HAIR_LENGTH_OPTIONS.map((option) => {
                const isSelected = parameters.hair_length === option;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setParameters((prev) => {
                        const next: StyleParams = { ...prev };
                        if (prev.hair_length === option) {
                          delete next.hair_length;
                        } else {
                          next.hair_length = option;
                        }
                        return next;
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">カラー</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => {
                const isSelected = parameters.color === option;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setParameters((prev) => {
                        const next: StyleParams = { ...prev };
                        if (prev.color === option) {
                          delete next.color;
                        } else {
                          next.color = option;
                        }
                        return next;
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">前髪</label>
            <div className="flex flex-wrap gap-2">
              {BANGS_OPTIONS.map((option) => {
                const isSelected = parameters.bangs === option;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setParameters((prev) => {
                        const next: StyleParams = { ...prev };
                        if (prev.bangs === option) {
                          delete next.bangs;
                        } else {
                          next.bangs = option;
                        }
                        return next;
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">質感</label>
            <div className="flex flex-wrap gap-2">
              {TEXTURE_OPTIONS.map((option) => {
                const isSelected = parameters.texture === option;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setParameters((prev) => {
                        const next: StyleParams = { ...prev };
                        if (prev.texture === option) {
                          delete next.texture;
                        } else {
                          next.texture = option;
                        }
                        return next;
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">イメージスタイル</label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_STYLE_OPTIONS.map((option) => {
                const isSelected = parameters.image_style === option;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setParameters((prev) => {
                        const next: StyleParams = { ...prev };
                        if (prev.image_style === option) {
                          delete next.image_style;
                        } else {
                          next.image_style = option;
                        }
                        return next;
                      })
                    }
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">追加の要望</label>
            <textarea
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="全体の雰囲気や細かな希望を記入"
              value={parameters.custom_prompt ?? ''}
              onChange={(e) =>
                setParameters((prev) => {
                  const next: StyleParams = { ...prev };
                  if (e.target.value) {
                    next.custom_prompt = e.target.value;
                  } else {
                    delete next.custom_prompt;
                  }
                  return next;
                })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-gray-600">設定が完了したら生成を開始できます</p>
          <p className="text-xs text-gray-500">
            生成には数十秒ほどかかる場合があります。完了するとギャラリーで結果が確認できます。
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={!isParametersSet || isGenerating}>
          {isGenerating ? '生成中...' : 'スタイルを生成'}
        </Button>
      </Card>
    </div>
  );
}
