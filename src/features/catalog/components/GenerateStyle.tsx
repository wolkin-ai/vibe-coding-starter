import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useCatalogStore } from '../store/catalog';
import {
  generateStyleWithModel,
  generateStylesBatch,
  generateStyleTransfer,
  type StyleMoodHint,
} from '../api/gemini';
import type {
  HairParameters,
  HairLength,
  HairVolume,
  HairTexture,
  HairQuality,
  HairThickness,
  BangsStyle,
  HairColorType,
  HairStyle,
} from '../types';

type MoodPreset = StyleMoodHint & { description: string };

const STYLE_PRESETS: MoodPreset[] = [
  {
    id: 'free',
    label: 'おまかせ',
    description: 'テーマを指定せずランダムに提案。',
  },
  {
    id: 'salon-classic',
    label: 'サロン定番',
    description: '王道のサロン仕上がり。',
    keywords: ['王道', '清潔感', 'バランス'],
    colorPalette: ['#f5f5f5', '#d6ccc2', '#cdb4db'],
    makeupStyle: 'ナチュラルでツヤのあるメイク',
    backgroundStyle: '明るいサロンのセット面',
    targetAudience: '幅広い年代',
  },
  {
    id: 'cool-mode',
    label: 'モード系',
    description: 'シャープでスタイリッシュ。',
    keywords: ['モード', '都会的', 'スタイリッシュ'],
    colorPalette: ['#1f1f1f', '#444', '#999'],
    makeupStyle: 'コントラスト強めのクールメイク',
    backgroundStyle: 'ミニマルなスタジオ',
    targetAudience: '20代〜30代',
  },
  {
    id: 'soft-feminine',
    label: 'フェミニン',
    description: '柔らかな質感と優しい色味。',
    keywords: ['ふんわり', '柔らかい', 'フェミニン'],
    colorPalette: ['#ffe5ec', '#ffd7ba', '#cdb4db'],
    makeupStyle: '血色感を意識したソフトメイク',
    backgroundStyle: '自然光が入るスタジオ',
    targetAudience: '20代〜40代',
  },
  {
    id: 'street-gal',
    label: 'ギャル/ストリート',
    description: 'エッジの効いたトレンドスタイル。',
    keywords: ['ギャル', 'トレンド', '大胆'],
    colorPalette: ['#ffb6c1', '#ffd700', '#87ceeb'],
    makeupStyle: 'しっかり発色させたメイク',
    backgroundStyle: 'ポップな背景や夜景',
    targetAudience: '10代〜20代',
  },
];

const DEFAULT_PRESET: MoodPreset = STYLE_PRESETS[0]!;

const LENGTH_OPTIONS: { value: HairLength; label: string }[] = [
  { value: 'very_short', label: 'ベリーショート' },
  { value: 'short', label: 'ショート' },
  { value: 'bob', label: 'ボブ' },
  { value: 'medium', label: 'ミディアム' },
  { value: 'semi_long', label: 'セミロング' },
  { value: 'long', label: 'ロング' },
  { value: 'super_long', label: 'スーパーロング' },
];

const COLOR_OPTIONS: { value: HairColorType; label: string }[] = [
  { value: 'black', label: 'ブラック系' },
  { value: 'dark_brown', label: 'ダークブラウン系' },
  { value: 'brown', label: 'ブラウン系' },
  { value: 'light_brown', label: 'ライトブラウン系' },
  { value: 'blonde', label: 'ブロンド系' },
  { value: 'ash', label: 'アッシュ系' },
  { value: 'pink', label: 'ピンク系' },
  { value: 'red', label: 'レッド系' },
];

const TEXTURE_OPTIONS: { value: HairTexture; label: string }[] = [
  { value: 'none', label: 'クセなし' },
  { value: 'slight', label: 'クセ少し' },
  { value: 'strong', label: 'クセ強め' },
];

const VOLUME_OPTIONS: { value: HairVolume; label: string }[] = [
  { value: 'low', label: '少ない' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '多い' },
];

const QUALITY_OPTIONS: { value: HairQuality; label: string }[] = [
  { value: 'soft', label: '柔らかい' },
  { value: 'normal', label: '普通' },
  { value: 'firm', label: '硬い' },
];

const THICKNESS_OPTIONS: { value: HairThickness; label: string }[] = [
  { value: 'thin', label: '細い' },
  { value: 'normal', label: '普通' },
  { value: 'thick', label: '太い' },
];

const BANGS_OPTIONS: { value: BangsStyle; label: string }[] = [
  { value: 'none', label: '前髪なし' },
  { value: 'center_part', label: 'センターパート' },
  { value: 'side_swept', label: 'サイド流し' },
  { value: 'see_through', label: 'シースルー' },
  { value: 'blunt', label: 'ぱっつん' },
  { value: 'curtain', label: 'カーテンバング' },
];

type GenerationMode = 'with-model' | 'batch' | 'style-transfer';

const MODE_LABELS: Record<GenerationMode, { title: string; desc: string }> = {
  'with-model': {
    title: 'モデル指定',
    desc: '保存済みのカットモデルを選んでスタイル生成',
  },
  batch: {
    title: 'バッチ生成',
    desc: 'モデルを指定せずムードに沿ったスタイルを一括生成',
  },
  'style-transfer': {
    title: 'スタイル転写',
    desc: '参考画像をアップロードしてスタイルをアレンジ',
  },
};

export function GenerateStyle() {
  const navigate = useNavigate();
  const { getAllModels, addStyle } = useCatalogStore();
  const models = getAllModels();

  const [mode, setMode] = useState<GenerationMode>('with-model');
  const [selectedPresetId, setSelectedPresetId] = useState('free');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);

  const [hairParams, setHairParams] = useState<HairParameters>({
    length: 'medium',
    color: 'brown',
    texture: 'slight',
    volume: 'normal',
    quality: 'normal',
    thickness: 'normal',
    bangs: 'see_through',
  });
  const [batchCount, setBatchCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStyles, setGeneratedStyles] = useState<Array<{ url: string; modelId?: string }>>(
    [],
  );
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  const selectedPreset = useMemo<MoodPreset>(() => {
    const found = STYLE_PRESETS.find((preset) => preset.id === selectedPresetId);
    return found ?? DEFAULT_PRESET;
  }, [selectedPresetId]);

  const moodForGeneration = selectedPreset.id === 'free' ? null : selectedPreset;

  const clearHairParam = (key: keyof HairParameters) => {
    setHairParams((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest as HairParameters;
    });
  };

  const getLabel = (value: string | undefined, options: { value: string; label: string }[]) => {
    if (!value) return undefined;
    return options.find((option) => option.value === value)?.label;
  };

  const handleGenerate = async () => {
    if (mode === 'with-model' && !selectedModelId) {
      alert('生成に使用するモデルを選択してください');
      return;
    }
    if (mode === 'style-transfer' && !referenceImage) {
      alert('参考画像をアップロードしてください');
      return;
    }

    setIsGenerating(true);
    setGeneratedStyles([]);
    setSelectedIndexes(new Set());

    try {
      if (mode === 'with-model' && selectedModelId) {
        const model = models.find((m) => m.id === selectedModelId);
        if (!model) {
          alert('モデルが見つかりません');
          return;
        }

        await generateStyleWithModel(moodForGeneration, model, hairParams, 4, (imageUrl) => {
          setGeneratedStyles((prev) => [...prev, { url: imageUrl, modelId: selectedModelId }]);
        });
      } else if (mode === 'batch') {
        await generateStylesBatch(moodForGeneration, batchCount, (imageUrl) => {
          setGeneratedStyles((prev) => [...prev, { url: imageUrl }]);
        });
      } else if (mode === 'style-transfer' && referenceImage) {
        await generateStyleTransfer(
          moodForGeneration,
          hairParams,
          referenceImage,
          4,
          (imageUrl) => {
            setGeneratedStyles((prev) => [...prev, { url: imageUrl }]);
          },
        );
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStyles = () => {
    if (selectedIndexes.size === 0) return;

    const paramsSnapshot: HairParameters = { ...hairParams };

    selectedIndexes.forEach((index) => {
      const style = generatedStyles[index];
      if (!style) return;

      const snapshot: HairParameters = { ...paramsSnapshot };

      const newStyle: HairStyle = {
        id: `style-${Date.now()}-${index}`,
        parameters: snapshot,
        image_url: style.url,
        status: 'draft',
        is_favorite: false,
        tags: moodForGeneration?.keywords ?? [],
        generation_params: {
          style_preset: selectedPresetId,
          hair_parameters: snapshot,
        },
        generation_prompt: '',
        generation_job_id: `job-${Date.now()}`,
        created_at: new Date().toISOString(),
        created_by: 'local-user',
        approved_at: null,
      };

      if (style.modelId) {
        newStyle.cut_model_id = style.modelId;
      }
      if (mode === 'style-transfer' && referenceImage) {
        newStyle.reference_image_url = URL.createObjectURL(referenceImage);
      }

      addStyle(newStyle);
    });

    navigate('/catalog');
  };

  const toggleSelection = (index: number) => {
    const next = new Set(selectedIndexes);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndexes(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
    }
  };

  const canGenerate =
    mode === 'with-model'
      ? Boolean(selectedModelId)
      : mode === 'style-transfer'
        ? Boolean(referenceImage)
        : true;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate('/catalog')}>
          ← 戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold">ヘアスタイル生成</h1>
          <p className="mt-1 text-gray-600">ムードや参考画像を活用してスタイルを作成します。</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(MODE_LABELS) as GenerationMode[]).map((m) => (
          <Card
            key={m}
            className={`cursor-pointer p-4 transition ${
              mode === m
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border-2 border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              setMode(m);
              setSelectedIndexes(new Set());
            }}
          >
            <h3 className="font-semibold">{MODE_LABELS[m].title}</h3>
            <p className="mt-1 text-sm text-gray-600">{MODE_LABELS[m].desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">ムード・スタイル</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {STYLE_PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <Card
                    key={preset.id}
                    className={`cursor-pointer border transition ${
                      isActive ? 'border-blue-500 shadow-sm' : 'hover:border-blue-300'
                    }`}
                    onClick={() => !isGenerating && setSelectedPresetId(preset.id)}
                  >
                    <div className="p-3">
                      <p className="font-semibold">{preset.label}</p>
                      <p className="mt-1 text-xs text-gray-600">{preset.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {mode === 'with-model' && (
            <Card className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">カットモデル選択</h2>
              {models.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                  保存済みのカットモデルがありません。まずは「カットモデル生成」でモデルを作成してください。
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {models.map((model) => {
                    const isActive = selectedModelId === model.id;
                    const hairProfile = model.hair_profile ?? {};
                    const lengthLabel = getLabel(
                      hairProfile.length as string | undefined,
                      LENGTH_OPTIONS,
                    );
                    const volumeLabel = getLabel(
                      hairProfile.volume as string | undefined,
                      VOLUME_OPTIONS,
                    );
                    const qualityLabel = getLabel(
                      hairProfile.quality as string | undefined,
                      QUALITY_OPTIONS,
                    );
                    const thicknessLabel = getLabel(
                      hairProfile.thickness as string | undefined,
                      THICKNESS_OPTIONS,
                    );
                    const textureLabel = getLabel(
                      hairProfile.texture as string | undefined,
                      TEXTURE_OPTIONS,
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
                    return (
                      <Card
                        key={model.id}
                        className={`cursor-pointer overflow-hidden border transition ${
                          isActive ? 'border-blue-500 shadow-sm' : 'hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedModelId(model.id)}
                      >
                        <img
                          src={model.image_url}
                          alt={model.id}
                          className="h-40 w-full object-cover"
                        />
                        <div className="space-y-1 p-3 text-xs text-gray-600">
                          <div>{model.tags?.slice(0, 3).join(' / ') || 'タグなし'}</div>
                          {hairSummary && (
                            <div className="text-[10px] text-gray-500">{hairSummary}</div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">ヘアパラメータ</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">長さ</label>
              <div className="flex flex-wrap gap-2">
                {LENGTH_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.length === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, length: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">カラー</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.color === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, color: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">クセ</label>
              <div className="flex flex-wrap gap-2">
                {TEXTURE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.texture === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, texture: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  variant={hairParams.texture ? 'outline' : 'primary'}
                  onClick={() => clearHairParam('texture')}
                  disabled={isGenerating}
                >
                  設定しない
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">髪量</label>
              <div className="flex flex-wrap gap-2">
                {VOLUME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.volume === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, volume: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  variant={hairParams.volume ? 'outline' : 'primary'}
                  onClick={() => clearHairParam('volume')}
                  disabled={isGenerating}
                >
                  設定しない
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">髪質</label>
              <div className="flex flex-wrap gap-2">
                {QUALITY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.quality === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, quality: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  variant={hairParams.quality ? 'outline' : 'primary'}
                  onClick={() => clearHairParam('quality')}
                  disabled={isGenerating}
                >
                  設定しない
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">太さ</label>
              <div className="flex flex-wrap gap-2">
                {THICKNESS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.thickness === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, thickness: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  variant={hairParams.thickness ? 'outline' : 'primary'}
                  onClick={() => clearHairParam('thickness')}
                  disabled={isGenerating}
                >
                  設定しない
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">前髪</label>
              <div className="flex flex-wrap gap-2">
                {BANGS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={hairParams.bangs === option.value ? 'primary' : 'outline'}
                    onClick={() => setHairParams((prev) => ({ ...prev, bangs: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {mode === 'batch' && (
            <Card className="p-6">
              <h2 className="mb-3 text-lg font-semibold">バッチ設定</h2>
              <div className="flex gap-2">
                {[4, 6, 8, 10].map((count) => (
                  <Button
                    key={count}
                    variant={batchCount === count ? 'primary' : 'outline'}
                    onClick={() => setBatchCount(count)}
                    disabled={isGenerating}
                  >
                    {count}枚
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {mode === 'style-transfer' && (
            <Card className="space-y-3 p-6">
              <h2 className="text-lg font-semibold">参考画像</h2>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {referenceImage && <p className="text-xs text-gray-600">{referenceImage.name}</p>}
            </Card>
          )}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? '生成中…' : 'スタイルを生成'}
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">生成結果</h2>

          {generatedStyles.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-400">
              スタイルを生成するとここに表示されます
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {generatedStyles.map((style, index) => {
                  const presetLabel =
                    STYLE_PRESETS.find((preset) => preset.id === selectedPresetId)?.label ??
                    'おまかせ';
                  return (
                    <div
                      key={`${style.url}-${index}`}
                      className={`overflow-hidden rounded border transition ${
                        selectedIndexes.has(index)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'hover:border-blue-400'
                      }`}
                      onClick={() => toggleSelection(index)}
                    >
                      <img
                        src={style.url}
                        alt={`Generated style ${index + 1}`}
                        className="h-64 w-full object-cover"
                      />
                      <div className="p-2 text-xs text-gray-600">
                        {presetLabel}
                        {style.modelId ? ' / モデル指定' : ' / バッチ'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                className="h-12 w-full"
                onClick={handleSaveStyles}
                disabled={selectedIndexes.size === 0}
              >
                選択したスタイルを保存
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
