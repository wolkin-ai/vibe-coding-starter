import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { mockAssets, mockStylePresets } from '../mock-data';
import { useGenerationStore } from '../store/generation';
import { generateStyleVariations } from '../api/gemini';
import type { StyleParameters as StyleParams, GenerationJob, Variation } from '../types';

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
  {
    value: 'FRONT' as const,
    label: 'FRONT',
    description: '正面ビュースタイル',
  },
  {
    value: 'SIDE' as const,
    label: 'SIDE',
    description: '横顔・サイドビュー',
  },
  {
    value: 'BACK' as const,
    label: 'BACK',
    description: 'バックショット',
  },
  {
    value: 'ARRANGE' as const,
    label: 'ARRANGE',
    description: 'アレンジスタイル',
  },
  {
    value: 'BEFORE' as const,
    label: 'BEFORE',
    description: '施術前のビフォー写真',
  },
  {
    value: 'FASHION' as const,
    label: 'FASHION',
    description: 'ファッションスナップ',
  },
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
  {
    value: 'natural' as const,
    label: 'ナチュラル',
    description: '清潔感のある自然メイクで整える',
  },
  {
    value: 'glam' as const,
    label: 'しっかりメイク',
    description: '撮影向けに目元やリップを際立たせる',
  },
];

const RETOUCH_LEVEL_OPTIONS = [
  {
    value: 'none' as const,
    label: '補正なし',
    description: '肌補正などは行わない',
  },
  {
    value: 'light' as const,
    label: '控えめ',
    description: '肌を整える程度の軽い補正',
  },
  {
    value: 'full' as const,
    label: 'しっかり補正',
    description: 'レタッチや明るさ調整を積極的に行う',
  },
];

export function StyleParametersPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const { currentAsset, currentAssetFile, setCurrentJob, setVariations } = useGenerationStore();

  // currentAssetが存在すればそれを使用、なければmockから取得
  const asset = currentAsset || mockAssets.find((a) => a.id === assetId);

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [parameters, setParameters] = useState<StyleParams>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!asset) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">画像が見つかりません</p>
      </div>
    );
  }

  const handlePresetSelect = (presetId: string) => {
    const preset = mockStylePresets.find((p) => p.id === presetId);
    if (preset) {
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
    }
  };

  const handleGenerate = async () => {
    if (!currentAssetFile) {
      setError('画像ファイルが見つかりません。再度アップロードしてください。');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // 生成ジョブを作成
    const jobId = `job-${Date.now()}`;
    const job: GenerationJob = {
      id: jobId,
      asset_id: assetId || '',
      project_id: asset?.project_id || '',
      parameters: parameters,
      status: 'processing',
      variation_count: 4,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    };

    setCurrentJob(job);

    // 初期状態では空の配列をセット
    setVariations([]);

    // ギャラリー画面に即座に遷移（生成中の状態で）
    navigate(`/salon/assets/${assetId}/generation-gallery`);

    try {
      // Google Gemini APIで生成（バックグラウンドで実行）
      await generateStyleVariations(
        currentAssetFile,
        parameters,
        4, // 4つのバリエーションを生成
        // コールバック：1つ生成されるたびに呼ばれる
        (result) => {
          const newVariation: Variation = {
            id: `var-${Date.now()}-${result.variation_rank}`,
            generation_job_id: jobId,
            variation_rank: result.variation_rank,
            image_url: result.image_url,
            status: 'draft' as const,
            created_at: new Date().toISOString(),
          };

          // 既存のバリエーションに追加
          setVariations((prev) => [...prev, newVariation]);
        },
      );

      // すべて完了
      setCurrentJob({ ...job, status: 'completed', completed_at: new Date().toISOString() });
      setIsGenerating(false);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : '画像生成中にエラーが発生しました');
      setCurrentJob({ ...job, status: 'failed' });
      setIsGenerating(false);
    }
  };

  const isParametersSet =
    parameters.hair_length ||
    parameters.color ||
    parameters.bangs ||
    parameters.texture ||
    parameters.image_style ||
    parameters.identity_shift ||
    parameters.makeup_style ||
    parameters.retouch_level ||
    parameters.hpb_category ||
    (parameters.custom_prompt && parameters.custom_prompt.trim().length > 0);

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* 画像プレビュー */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">元画像</h2>
          <div className="overflow-hidden rounded-lg bg-gray-100">
            <img src={asset.original_url} alt="Original" className="w-full object-cover" />
          </div>
          {asset.description && <p className="mt-3 text-sm text-gray-600">{asset.description}</p>}
        </Card>

        {/* プリセット選択 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">プリセットから選ぶ</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {mockStylePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  selectedPreset === preset.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold">{preset.name}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>長さ: {preset.hair_length}</p>
                  <p>カラー: {preset.color}</p>
                  <p>イメージ: {preset.image_style}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            💡 プリセットを選択後、下のパラメータで微調整できます
          </div>
        </Card>
      </div>

      {/* 詳細パラメータ */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">詳細パラメータ</h2>
        <div className="space-y-6">
          {/* 顔の匿名化レベル */}
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

          {/* 髪の長さ */}
          <div>
            <label className="mb-2 block font-medium">髪の長さ</label>
            <div className="flex flex-wrap gap-2">
              {HAIR_LENGTH_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setParameters((prev) => ({ ...prev, hair_length: option }))}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    parameters.hair_length === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* カラー */}
          <div>
            <label className="mb-2 block font-medium">カラー</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setParameters((prev) => ({ ...prev, color: option }))}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    parameters.color === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 前髪 */}
          <div>
            <label className="mb-2 block font-medium">前髪</label>
            <div className="flex flex-wrap gap-2">
              {BANGS_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setParameters((prev) => ({ ...prev, bangs: option }))}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    parameters.bangs === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 質感 */}
          <div>
            <label className="mb-2 block font-medium">質感</label>
            <div className="flex flex-wrap gap-2">
              {TEXTURE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setParameters((prev) => ({ ...prev, texture: option }))}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    parameters.texture === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* イメージ */}
          <div>
            <label className="mb-2 block font-medium">イメージ</label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_STYLE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setParameters((prev) => ({ ...prev, image_style: option }))}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    parameters.image_style === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Hot Pepperカテゴリ */}
          <div>
            <label className="mb-2 block font-medium">Hot Pepper掲載カテゴリ</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {HPB_CATEGORY_OPTIONS.map((option) => {
                const isSelected = parameters.hpb_category === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      setParameters((prev) => ({
                        ...prev,
                        hpb_category: option.value,
                      }))
                    }
                    className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
            <button
              className="mt-3 text-sm text-blue-600 hover:underline"
              onClick={() =>
                setParameters((prev) => {
                  const { hpb_category: _removed, ...rest } = prev;
                  return rest as StyleParams;
                })
              }
            >
              設定しない
            </button>
          </div>

          {/* メイクと補正 */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">メイクの雰囲気</label>
              <div className="space-y-2">
                {MAKEUP_STYLE_OPTIONS.map((option) => {
                  const isSelected = parameters.makeup_style === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setParameters((prev) => ({
                          ...prev,
                          makeup_style: option.value,
                        }))
                      }
                      className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">写真全体の補正</label>
              <div className="space-y-2">
                {RETOUCH_LEVEL_OPTIONS.map((option) => {
                  const isSelected = parameters.retouch_level === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        setParameters((prev) => ({
                          ...prev,
                          retouch_level: option.value,
                        }))
                      }
                      className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* カスタムプロンプト */}
          <div>
            <label className="mb-2 block font-medium">カスタム指示（オプション）</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="例: もっとふんわりとした印象にしたい、顔周りにレイヤーを入れて軽やかに..."
              value={parameters.custom_prompt || ''}
              onChange={(e) =>
                setParameters((prev) => ({
                  ...prev,
                  custom_prompt: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </Card>

      {/* 生成ボタン */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">スタイルバリエーション生成</p>
            <p className="text-sm text-gray-600">
              {isParametersSet
                ? '設定されたパラメータで3〜5枚のスタイル案を生成します'
                : 'パラメータを設定してください'}
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={!isParametersSet || isGenerating} size="lg">
            {isGenerating ? '生成中...' : '生成開始'}
          </Button>
        </div>

        {isGenerating && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-blue-800">
                Google Gemini APIでスタイルを生成しています... (30秒〜1分程度)
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">⚠️ {error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
