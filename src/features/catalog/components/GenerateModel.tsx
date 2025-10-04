import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useCatalogStore } from '../store/catalog';
import { generateCutModels, type StyleMoodHint } from '../api/gemini';
import type { ModelAgeRange, ModelFaceType, ModelGender } from '../types';

type MoodPreset = StyleMoodHint & { description: string };

const STYLE_PRESETS: MoodPreset[] = [
  {
    id: 'free',
    label: 'おまかせ',
    description: '特定の方向性を与えず、AIにバリエーション豊かな提案をさせます。',
  },
  {
    id: 'gyaru',
    label: 'ギャル風',
    description: '明るく華やかでポップな雰囲気。',
    keywords: ['明るい', '華やか', 'トレンド', 'ポップ'],
    colorPalette: ['#FFB6C1', '#FFD700', '#87CEEB', '#FFA07A'],
    makeupStyle: '大胆でカラーを効かせたメイク',
    backgroundStyle: '都会的でポップなスタジオセット',
    targetAudience: '10代〜20代',
  },
  {
    id: 'mode',
    label: 'モード系',
    description: 'シャープで洗練されたモードな印象。',
    keywords: ['モード', '洗練', 'シャープ'],
    colorPalette: ['#111111', '#444444', '#CCCCCC'],
    makeupStyle: 'コントラストを強調したクールメイク',
    backgroundStyle: 'ミニマルなスタジオ背景',
    targetAudience: '20代〜30代',
  },
  {
    id: 'feminine',
    label: 'ナチュラルフェミニン',
    description: '柔らかく親しみやすい雰囲気。',
    keywords: ['ナチュラル', '優しい', '透明感'],
    colorPalette: ['#FFE4E1', '#F5DEB3', '#E6E6FA'],
    makeupStyle: 'ツヤ感のあるナチュラルメイク',
    backgroundStyle: '柔らかな自然光が入るスタジオ',
    targetAudience: '20代〜40代',
  },
  {
    id: 'korean',
    label: 'K-ビューティ',
    description: '韓国トレンドを意識した洗練スタイル。',
    keywords: ['韓国風', 'トレンド', 'クリーン'],
    colorPalette: ['#A0C4FF', '#FFD6E0', '#BBD0FF'],
    makeupStyle: '透明感のあるグロウメイク',
    backgroundStyle: '明るくシンプルな背景',
    targetAudience: '10代〜30代',
  },
];

const DEFAULT_PRESET: MoodPreset = STYLE_PRESETS[0]!;

const GENDER_OPTIONS: { value: ModelGender; label: string }[] = [
  { value: 'female', label: '女性' },
  { value: 'male', label: '男性' },
];

const AGE_RANGE_OPTIONS: { value: ModelAgeRange; label: string }[] = [
  { value: 'teen', label: '10代' },
  { value: '20s', label: '20代' },
  { value: '30s', label: '30代' },
  { value: '40s', label: '40代' },
  { value: '50s', label: '50代以上' },
];

const FACE_TYPE_OPTIONS: { value: ModelFaceType; label: string }[] = [
  { value: 'oval', label: '卵型' },
  { value: 'round', label: '丸型' },
  { value: 'square', label: '四角型' },
  { value: 'long', label: '面長' },
  { value: 'heart', label: 'ハート型' },
];

interface GenerationParams {
  gender: ModelGender;
  age_range: ModelAgeRange;
  face_type: ModelFaceType;
  count: number;
  style_preset: string;
}

export function GenerateModel() {
  const navigate = useNavigate();
  const { addModel } = useCatalogStore();

  const [params, setParams] = useState<GenerationParams>({
    gender: 'female',
    age_range: '20s',
    face_type: 'oval',
    count: 4,
    style_preset: 'free',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModels, setGeneratedModels] = useState<
    Array<{ url: string; params: GenerationParams }>
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedPreset = useMemo<MoodPreset>(() => {
    const found = STYLE_PRESETS.find((preset) => preset.id === params.style_preset);
    return found ?? DEFAULT_PRESET;
  }, [params.style_preset]);

  const moodForGeneration = selectedPreset.id === 'free' ? null : selectedPreset;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedModels([]);
    setSelectedIndex(null);

    try {
      await generateCutModels(
        moodForGeneration,
        params.gender,
        params.age_range,
        params.face_type,
        params.count,
        (imageUrl) => {
          setGeneratedModels((prev) => [...prev, { url: imageUrl, params: { ...params } }]);
        },
      );
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveModel = () => {
    if (selectedIndex === null) return;
    const selected = generatedModels[selectedIndex];
    if (!selected) return;

    const newModel = {
      id: `model-${Date.now()}`,
      gender: selected.params.gender,
      age_range: selected.params.age_range,
      face_type: selected.params.face_type,
      image_url: selected.url,
      generation_prompt: '',
      generation_params: {
        style_preset: selected.params.style_preset,
      },
      synthid_metadata: null,
      is_favorite: false,
      tags:
        moodForGeneration && moodForGeneration.id === selected.params.style_preset
          ? (moodForGeneration.keywords ?? [])
          : [],
      created_at: new Date().toISOString(),
      created_by: 'local-user',
    };

    addModel(newModel);
    navigate('/catalog');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate('/catalog')}>
          ← 戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold">カットモデル生成</h1>
          <p className="mt-1 text-gray-600">ムードと基本プロフィールを選んで生成します。</p>
        </div>
      </div>

      <Card className="border-l-4 border-l-blue-500 bg-blue-50 p-4">
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-blue-800">ムードを選んで自由に生成</p>
            <p className="text-blue-700">
              年齢・性別・顔型に加えてムード（ギャル、モードなど）を選ぶと、カタログに使える多様なモデルを用意できます。
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">生成パラメータ</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ムード・スタイル
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {STYLE_PRESETS.map((preset) => {
                  const isActive = params.style_preset === preset.id;
                  return (
                    <Card
                      key={preset.id}
                      className={`cursor-pointer border transition ${
                        isActive ? 'border-blue-500 shadow-sm' : 'hover:border-blue-300'
                      }`}
                      onClick={() =>
                        !isGenerating && setParams((prev) => ({ ...prev, style_preset: preset.id }))
                      }
                    >
                      <div className="p-3">
                        <p className="font-semibold">{preset.label}</p>
                        <p className="mt-1 text-xs text-gray-600">{preset.description}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">性別</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={params.gender === option.value ? 'primary' : 'outline'}
                    onClick={() => setParams((prev) => ({ ...prev, gender: option.value }))}
                    disabled={isGenerating}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
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
                  const presetLabel =
                    STYLE_PRESETS.find((preset) => preset.id === model.params.style_preset)
                      ?.label ?? 'おまかせ';
                  const ageLabel =
                    AGE_RANGE_OPTIONS.find((option) => option.value === model.params.age_range)
                      ?.label ?? '年齢不明';

                  return (
                    <div
                      key={`${model.url}-${index}`}
                      className={`overflow-hidden rounded border transition ${
                        selectedIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'hover:border-blue-400'
                      }`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <img
                        src={model.url}
                        alt={`Generated model ${index + 1}`}
                        className="h-64 w-full object-cover"
                      />
                      <div className="p-2 text-xs text-gray-600">
                        {presetLabel} / {ageLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                className="h-12 w-full"
                onClick={handleSaveModel}
                disabled={selectedIndex === null}
              >
                選択したモデルを保存
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
