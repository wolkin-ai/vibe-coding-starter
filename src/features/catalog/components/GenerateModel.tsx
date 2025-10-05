import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useSaveCatalogModelsMutation, useCatalogModelsQuery } from '../hooks';
import { generateCutModels } from '../api/gemini';
import type {
  HairParameters,
  HairLength,
  HairQuality,
  HairTexture,
  HairThickness,
  HairVolume,
  ModelAgeRange,
  ModelFaceType,
  ModelGender,
} from '../types';

const AGE_RANGE_OPTIONS: { value: ModelAgeRange; label: string }[] = [
  { value: 'kids', label: 'キッズ' },
  { value: 'teen', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代' },
  { value: '60s', label: '60代以上' },
];

const FACE_TYPE_OPTIONS: { value: ModelFaceType; label: string }[] = [
  { value: 'oval', label: '卵型' },
  { value: 'round', label: '丸型' },
  { value: 'square', label: '四角型' },
  { value: 'long', label: '面長' },
  { value: 'heart', label: 'ハート型' },
  { value: 'inverted_triangle', label: '逆三角型' },
  { value: 'base', label: 'ベース型' },
];

const HAIR_LENGTH_OPTIONS: { value: HairLength; label: string }[] = [
  { value: 'very_short', label: 'ベリーショート' },
  { value: 'short', label: 'ショート' },
  { value: 'bob', label: 'ボブ' },
  { value: 'medium', label: 'ミディアム' },
  { value: 'semi_long', label: 'セミロング' },
  { value: 'long', label: 'ロング' },
  { value: 'super_long', label: 'スーパーロング' },
];

const HAIR_VOLUME_OPTIONS: { value: HairVolume; label: string }[] = [
  { value: 'low', label: '少ない' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '多い' },
];

const HAIR_QUALITY_OPTIONS: { value: HairQuality; label: string }[] = [
  { value: 'soft', label: '柔らかい' },
  { value: 'normal', label: '普通' },
  { value: 'firm', label: '硬い' },
];

const HAIR_THICKNESS_OPTIONS: { value: HairThickness; label: string }[] = [
  { value: 'thin', label: '細い' },
  { value: 'normal', label: '普通' },
  { value: 'thick', label: '太い' },
];

const HAIR_TEXTURE_OPTIONS: { value: HairTexture; label: string }[] = [
  { value: 'none', label: 'クセなし' },
  { value: 'slight', label: 'クセ少し' },
  { value: 'strong', label: 'クセ強め' },
];

interface GenerationParams {
  gender: ModelGender;
  age_range: ModelAgeRange;
  face_type: ModelFaceType;
  count: number;
}

interface GeneratedModelEntry {
  url: string;
  params: GenerationParams;
  hair: Partial<HairParameters>;
  note?: string;
}

export function GenerateModel() {
  const navigate = useNavigate();
  useCatalogModelsQuery();
  const saveModelsMutation = useSaveCatalogModelsMutation();

  const [params, setParams] = useState<GenerationParams>({
    gender: 'female',
    age_range: '20s',
    face_type: 'oval',
    count: 4,
  });

  const [hairPreferences, setHairPreferences] = useState<Partial<HairParameters>>({
    length: 'medium',
    volume: 'normal',
    quality: 'normal',
    thickness: 'normal',
    texture: 'slight',
  });
  const [customNote, setCustomNote] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModels, setGeneratedModels] = useState<GeneratedModelEntry[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  const moodForGeneration = null;

  const updateHairPreference = <K extends keyof HairParameters>(
    key: K,
    value: HairParameters[K] | undefined,
  ) => {
    setHairPreferences((prev) => {
      const next = { ...prev } as Partial<HairParameters>;
      if (value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const getLabel = (value: string | undefined, options: { value: string; label: string }[]) => {
    if (!value) return undefined;
    return options.find((option) => option.value === value)?.label;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedModels([]);
    setSelectedIndexes(new Set());
    setHasSaved(false);

    try {
      const hairSnapshot = { ...hairPreferences };
      const trimmedNote = customNote.trim();
      const options = {
        hairPreferences: hairSnapshot,
        ...(trimmedNote ? { additionalNote: trimmedNote } : {}),
        ...(referenceImage ? { referenceImage } : {}),
        onModelGenerated: (imageUrl: string) => {
          const baseEntry = {
            url: imageUrl,
            params: { ...params },
            hair: { ...hairSnapshot },
          };
          const entry: GeneratedModelEntry =
            trimmedNote.length > 0 ? { ...baseEntry, note: trimmedNote } : baseEntry;
          setGeneratedModels((prev) => [...prev, entry]);
        },
      };

      await generateCutModels(
        moodForGeneration,
        params.gender,
        params.age_range,
        params.face_type,
        params.count,
        options,
      );
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const [hasSaved, setHasSaved] = useState(false);

  const handleSaveModel = async () => {
    if (selectedIndexes.size === 0 || saveModelsMutation.isPending) return;

    const payloads = Array.from(selectedIndexes).flatMap((index) => {
      const selected = generatedModels[index];
      if (!selected) return [];

      const hairProfile = { ...selected.hair };
      const generationParams: Record<string, unknown> = {
        hair_preferences: hairProfile,
      };
      if (selected.note) {
        generationParams.custom_note = selected.note;
      }

      return [
        {
          imageUrl: selected.url,
          gender: selected.params.gender,
          ageRange: selected.params.age_range,
          faceType: selected.params.face_type,
          hairProfile,
          generationParams,
          generationPrompt: '',
          tags: [],
        },
      ];
    });

    if (payloads.length === 0) return;

    try {
      await saveModelsMutation.mutateAsync(payloads);
      setHasSaved(true);
      setSelectedIndexes(new Set());
    } catch (error) {
      console.error('モデル保存に失敗しました:', error);
      alert(error instanceof Error ? error.message : 'モデルの保存に失敗しました');
    }
  };

  const handleGoToCatalog = () => {
    navigate('/catalog');
  };

  const toggleSelection = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReferenceImage(null);
      setReferenceImagePreview(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('画像サイズは10MB以下にしてください');
      return;
    }

    setReferenceImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate('/catalog')}>
          ← 戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold">カットモデル生成</h1>
          <p className="mt-1 text-gray-600">
            基本プロフィールと補足メモを入力して女性モデルを生成します。
          </p>
        </div>
      </div>

      <Card className="border-l-4 border-l-blue-500 bg-blue-50 p-4">
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-blue-800">生成ガイド</p>
            <p className="text-blue-700">
              現状は「おまかせ」仕様で、女性モデルのみ生成します。雰囲気の微調整は下部のフリーメモに記入してください。
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">生成パラメータ</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">性別</label>
              <p className="rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
                女性モデルのみを生成します。
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">年齢層</label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={params.age_range === option.value ? 'primary' : 'outline'}
                    onClick={() => setParams((prev) => ({ ...prev, age_range: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                人物イメージメモ
              </label>
              <textarea
                className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="例：柔らかい笑顔で、透明感のある雰囲気。"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                rows={3}
              />
              <p className="mt-1 text-xs text-gray-500">
                任意。人物の雰囲気や撮影意図を自由に書けます。
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">顔型</label>
              <div className="flex flex-wrap gap-2">
                {FACE_TYPE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={params.face_type === option.value ? 'primary' : 'outline'}
                    onClick={() => setParams((prev) => ({ ...prev, face_type: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-md border border-gray-200 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">ベースヘア設定</span>
                <span className="text-xs text-gray-500">
                  生成されるモデルの初期ヘア状態をあらかじめ指定できます。
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600">長さ</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {HAIR_LENGTH_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={hairPreferences.length === option.value ? 'primary' : 'outline'}
                        onClick={() => updateHairPreference('length', option.value)}
                        disabled={isGenerating}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600">髪量</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {HAIR_VOLUME_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={hairPreferences.volume === option.value ? 'primary' : 'outline'}
                        onClick={() => updateHairPreference('volume', option.value)}
                        disabled={isGenerating}
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button
                      variant={hairPreferences.volume === undefined ? 'primary' : 'outline'}
                      onClick={() => updateHairPreference('volume', undefined)}
                      disabled={isGenerating}
                    >
                      設定しない
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600">髪質</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {HAIR_QUALITY_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={hairPreferences.quality === option.value ? 'primary' : 'outline'}
                        onClick={() => updateHairPreference('quality', option.value)}
                        disabled={isGenerating}
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button
                      variant={hairPreferences.quality === undefined ? 'primary' : 'outline'}
                      onClick={() => updateHairPreference('quality', undefined)}
                      disabled={isGenerating}
                    >
                      設定しない
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600">太さ</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {HAIR_THICKNESS_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={hairPreferences.thickness === option.value ? 'primary' : 'outline'}
                        onClick={() => updateHairPreference('thickness', option.value)}
                        disabled={isGenerating}
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button
                      variant={hairPreferences.thickness === undefined ? 'primary' : 'outline'}
                      onClick={() => updateHairPreference('thickness', undefined)}
                      disabled={isGenerating}
                    >
                      設定しない
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600">クセ</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {HAIR_TEXTURE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={hairPreferences.texture === option.value ? 'primary' : 'outline'}
                        onClick={() => updateHairPreference('texture', option.value)}
                        disabled={isGenerating}
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button
                      variant={hairPreferences.texture === undefined ? 'primary' : 'outline'}
                      onClick={() => updateHairPreference('texture', undefined)}
                      disabled={isGenerating}
                    >
                      設定しない
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                参考画像（オプション）
              </label>
              <p className="mb-3 text-xs text-gray-500">
                モデルの外見の一貫性を保つために参考画像をアップロードできます。同じモデルとして認識できるレベルで生成されます。
              </p>
              {referenceImagePreview ? (
                <div className="space-y-2">
                  <div className="relative w-32 overflow-hidden rounded border border-gray-200 bg-gray-100">
                    <div className="aspect-[4/5] w-full">
                      <img
                        src={referenceImagePreview}
                        alt="Reference"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={clearReferenceImage} disabled={isGenerating}>
                    画像を削除
                  </Button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400 hover:bg-blue-50">
                  <span className="text-sm text-gray-600">📷 画像をアップロード</span>
                  <span className="mt-1 text-xs text-gray-400">JPG, PNG (最大10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceImageChange}
                    disabled={isGenerating}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">生成枚数</label>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map((count) => (
                  <Button
                    key={count}
                    variant={params.count === count ? 'primary' : 'outline'}
                    onClick={() => setParams((prev) => ({ ...prev, count }))}
                    disabled={isGenerating}
                  >
                    {count}枚
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? '生成中…' : 'モデルを生成'}
            </Button>
            <p className="text-center text-xs text-gray-500">
              推定コスト: ${(params.count * 0.039).toFixed(2)}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">生成結果</h2>

          {generatedModels.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-400">
              モデルを生成するとここに表示されます
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {generatedModels.map((model, index) => {
                  const ageLabel =
                    AGE_RANGE_OPTIONS.find((option) => option.value === model.params.age_range)
                      ?.label ?? '年齢不明';
                  const hair = model.hair;
                  const lengthLabel = getLabel(
                    hair.length as string | undefined,
                    HAIR_LENGTH_OPTIONS,
                  );
                  const volumeLabel = getLabel(
                    hair.volume as string | undefined,
                    HAIR_VOLUME_OPTIONS,
                  );
                  const qualityLabel = getLabel(
                    hair.quality as string | undefined,
                    HAIR_QUALITY_OPTIONS,
                  );
                  const thicknessLabel = getLabel(
                    hair.thickness as string | undefined,
                    HAIR_THICKNESS_OPTIONS,
                  );
                  const textureLabel = getLabel(
                    hair.texture as string | undefined,
                    HAIR_TEXTURE_OPTIONS,
                  );
                  const hairSummary = [
                    lengthLabel && `長さ: ${lengthLabel}`,
                    volumeLabel && `髪量: ${volumeLabel}`,
                    qualityLabel && `髪質: ${qualityLabel}`,
                    thicknessLabel && `太さ: ${thicknessLabel}`,
                    textureLabel && `クセ: ${textureLabel}`,
                  ]
                    .filter(Boolean)
                    .join(' / ');

                  const isSelected = selectedIndexes.has(index);

                  return (
                    <div
                      key={`${model.url}-${index}`}
                      className={`relative overflow-hidden rounded border transition ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'hover:border-blue-400'
                      }`}
                      onClick={() => toggleSelection(index)}
                    >
                      <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100">
                        <img
                          src={model.url}
                          alt={`Generated model ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {isSelected && <div className="absolute inset-0 bg-blue-500/20" />}
                      <div className="relative p-2 text-xs text-gray-600">
                        <div>年齢: {ageLabel}</div>
                        {hairSummary && (
                          <div className="mt-1 text-[10px] text-gray-500">{hairSummary}</div>
                        )}
                        {model.note && (
                          <div className="mt-1 text-[10px] text-gray-500">メモ: {model.note}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  className="h-12 flex-1"
                  onClick={handleSaveModel}
                  disabled={selectedIndexes.size === 0 || saveModelsMutation.isPending}
                >
                  {saveModelsMutation.isPending ? '保存中...' : '選択したモデルを保存'}
                </Button>
                <Button
                  className="h-12 flex-1"
                  variant="outline"
                  onClick={handleGoToCatalog}
                  disabled={!hasSaved}
                >
                  一覧へ進む
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
