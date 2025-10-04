import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import type { CutModel, HairParameters, ModelGender, ModelAgeRange, ModelFaceType } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Note: Gemini cannot generate images. This is a placeholder implementation.
// For actual image generation, use Google's Imagen API, DALL-E, or Stable Diffusion.
if (!API_KEY) {
  console.warn('Google API Key is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');
// Note: This model name is invalid. Gemini models don't support image generation.
// The code will fall back to mock/placeholder images.
const IMAGE_MODEL = 'gemini-2.5-flash-image';

export interface StyleMoodHint {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  colorPalette?: string[];
  makeupStyle?: string;
  backgroundStyle?: string;
  targetAudience?: string;
}

interface GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
}

interface BaseImageInput {
  data: string;
  mimeType: string;
}

const MODEL_GENDER_LABELS: Record<ModelGender, string> = {
  female: '女性',
  male: '男性',
};

const MODEL_AGE_LABELS: Record<ModelAgeRange, string> = {
  teen: '10代',
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代以上',
};

const MODEL_FACE_LABELS: Record<ModelFaceType, string> = {
  oval: '卵型',
  round: '丸型',
  square: '四角型',
  long: '面長',
  heart: 'ハート型',
};

const HAIR_LENGTH_LABELS: Record<string, string> = {
  very_short: 'ベリーショート',
  short: 'ショート',
  bob: 'ボブ',
  medium: 'ミディアム',
  semi_long: 'セミロング',
  long: 'ロング',
  super_long: 'スーパーロング',
};

const HAIR_VOLUME_LABELS: Record<string, string> = {
  flat: 'タイトでフラット',
  natural: '自然なボリューム',
  voluminous: 'しっかりボリューム',
  very_voluminous: '大きく膨らみのあるボリューム',
};

const HAIR_TEXTURE_LABELS: Record<string, string> = {
  straight: 'ストレート',
  wavy: 'ゆるやかなウェーブ',
  curly: '大きめのカール',
  tight_curls: 'タイトなカール',
};

const BANGS_LABELS: Record<string, string> = {
  none: '前髪なし',
  blunt: '重めのぱっつん前髪',
  side_swept: 'サイドに流した前髪',
  center_part: 'センターパート',
  see_through: 'シースルーバング',
  curtain: 'カーテンバング',
};

const HAIR_COLOR_LABELS: Record<string, string> = {
  black: 'ディープブラック',
  dark_brown: 'ダークブラウン',
  brown: 'ブラウン',
  light_brown: 'ライトブラウン',
  blonde: 'ブロンド',
  ash: 'アッシュベージュ',
  beige: 'ベージュトーン',
  pink: 'ピンク系',
  red: 'レッド系',
  purple: 'パープル系',
  blue: 'ブルー系',
  green: 'グリーン系',
  gray: 'グレー',
  white: 'ホワイトブロンド',
};

function describeValue(
  value: string | undefined | null,
  labels: Record<string, string>,
  fallback?: string,
): string | undefined {
  if (!value) return undefined;
  return labels[value] || fallback || value;
}

function formatHairParameters(params: HairParameters): string {
  const details: string[] = [];

  details.push(`- 長さ: ${describeValue(params.length, HAIR_LENGTH_LABELS, params.length)}`);

  const color = describeValue(params.color, HAIR_COLOR_LABELS, params.color);
  if (color) details.push(`- カラー: ${color}`);

  if (params.color_technique) details.push(`- カラーテクニック: ${params.color_technique}`);

  const texture = describeValue(params.texture, HAIR_TEXTURE_LABELS, params.texture);
  if (texture) details.push(`- テクスチャ: ${texture}`);

  const volume = describeValue(params.volume, HAIR_VOLUME_LABELS, params.volume);
  if (volume) details.push(`- ボリューム: ${volume}`);

  const bangs = describeValue(params.bangs, BANGS_LABELS, params.bangs);
  if (bangs) details.push(`- 前髪: ${bangs}`);

  if (params.perm) details.push(`- パーマ: ${params.perm}`);

  if (params.styling) details.push(`- スタイリング: ${params.styling}`);

  if (params.styling_keywords?.length) {
    details.push(`- スタイリングキーワード: ${params.styling_keywords.join('、')}`);
  }

  return details.join('\n');
}

function describeModelAge(age: ModelAgeRange): string {
  return MODEL_AGE_LABELS[age] || 'ターゲット層に合わせた年代';
}

function describeModelFace(face?: string | null): string {
  if (!face) return 'バランスの良い顔立ち';
  return MODEL_FACE_LABELS[face as ModelFaceType] || face;
}

function compileMoodHints(mood: StyleMoodHint | null): string {
  if (!mood) return '自由に新しい解釈を取り入れてください';

  const hints: string[] = [];
  if (mood.description) hints.push(`ムード参考: ${mood.description}`);
  if (mood.keywords?.length) hints.push(`キーワード参考: ${mood.keywords.join('、')}`);
  if (mood.colorPalette?.length)
    hints.push(`カラートーンのヒント: ${mood.colorPalette.join(', ')}`);
  if (mood.makeupStyle) hints.push(`メイクのヒント: ${mood.makeupStyle}`);
  if (mood.backgroundStyle) hints.push(`背景のヒント: ${mood.backgroundStyle}`);
  if (mood.targetAudience) hints.push(`想定ターゲット: ${mood.targetAudience}`);
  return hints.join('\n');
}

function buildModelPrompt(
  mood: StyleMoodHint | null,
  gender: ModelGender,
  ageRange: ModelAgeRange,
  faceType: ModelFaceType,
): string {
  const genderLabel = MODEL_GENDER_LABELS[gender];
  const ageLabel = describeModelAge(ageRange);
  const faceLabel = describeModelFace(faceType);
  const moodHints = compileMoodHints(mood);

  return `
画像を生成してください。
日本の美容室カタログに掲載するフォトリアルなモデル写真を制作します。

【目的】
- 日本人女性モデルの美容室カタログ撮影
- ターゲット層: ${mood?.targetAudience ?? '幅広い年代'}

【モデル条件】
- 国籍/人種: 日本人女性
- 性別: ${genderLabel}
- 年齢層: ${ageLabel}
- 顔型: ${faceLabel}
- 髪型: 後工程で多様なスタイルに活用できるナチュラルなベースカット
- メイク: ${mood?.makeupStyle ?? 'J-beautyらしい自然なメイク'}

【撮影ディレクション】
- 構図: バストアップ、カメラ目線、柔らかな微笑み
- カメラ: 85mmポートレートレンズ / F1.8 / 4:5縦構図 / 浅い被写界深度
- ライティング: 大型ソフトボックスと窓光で均一な美肌ライティング
- 背景: ${mood?.backgroundStyle ?? 'シンプルなスタジオ背景またはぼかした美容室インテリア'}
- 多様性: 生成ごとに髪色・アクセサリー・ポーズを微妙に変えてランダムさを出してよい

【仕上がり要件】
- 肌テクスチャは自然に保ち、過度なレタッチは禁止
- 文字やグラフィックは一切含めない
- 出力形式はPNG画像のみ。テキストや説明文は返さない

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

function buildStylePromptWithModel(
  mood: StyleMoodHint | null,
  model: CutModel,
  params: HairParameters,
): string {
  const hairDetails = formatHairParameters(params);
  const modelAge = describeModelAge(model.age_range as ModelAgeRange);
  const faceType = describeModelFace(model.face_type);
  const moodHints = compileMoodHints(mood);

  return `
画像を生成してください。
日本の美容室カタログに掲載するフォトリアルなヘアスタイル提案を作成します。

【モデル情報】
- 日本人${MODEL_GENDER_LABELS[model.gender]}モデル
- 年齢層: ${modelAge}
- 顔型: ${faceType}
- メイク: ${mood?.makeupStyle ?? '透明感のあるナチュラルメイク'}

【ヘアスタイル指示】
${hairDetails}

【撮影ディレクション】
- 構図: バストアップ、ヘア全体が映る角度で自然な笑顔
- カメラ: 85mmポートレートレンズ / F2.0付近 / 4:5縦構図 / 浅い被写界深度
- ライティング: ソフトボックス＋反射板で髪の質感を丁寧に描写
- 背景: ${mood?.backgroundStyle ?? 'サロンのセット面やニュートラルな背景'}
- 多様性: 生成ごとにスタイリング小物や髪色のニュアンスを変えてクリエイティブに

【仕上がり要件】
- 髪色と質感をフォトリアルに再現し、エアブラシ過多は避ける
- テキストや説明文は一切含めない
- 出力形式はPNG画像のみ

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

function buildBatchStylePrompt(mood: StyleMoodHint | null): string {
  const moodHints = compileMoodHints(mood);

  return `
画像を生成してください。
日本の美容室カタログに掲載する複数のフォトリアルなヘアスタイルを作成します。

【目的】
- 日本人女性を中心とした美容室カタログ用のスタイルバリエーション

【バリエーション指針】
- 年代や雰囲気を生成ごとに変化させる
- 長さ・カラー・質感・前髪・スタイリングを幅広く構成し、トレンド感を演出
- メイクは清潔感をキープしつつ、魅力的に

【撮影ディレクション】
- 構図: バストアップ中心、髪のディテールが明確に映る
- カメラ: 85mmまたは50mmポートレートレンズ / 浅い被写界深度 / 4:5縦構図
- ライティング: ソフトなディフューズ光＋リムライトで髪の艶を際立たせる
- 背景: ${mood?.backgroundStyle ?? 'サロンやスタジオの柔らかな背景をぼかして使用'}
- 多様性: スタイルごとにポーズ・表情・アクセサリーを変えて似通いを避ける

【仕上がり要件】
- 肌質は自然で、過度なレタッチやアニメ風表現は禁止
- テキスト・ロゴ・透かしは入れない
- 出力形式はPNG画像のみ

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

function buildStyleTransferPrompt(mood: StyleMoodHint | null, params: HairParameters): string {
  const hairDetails = formatHairParameters(params);
  const moodHints = compileMoodHints(mood);

  return `
画像を生成してください。
参考画像をベースに、日本の美容室カタログ向けのフォトリアルなスタイル転写を行います。

【スタイル転写の指示】
- 入力画像のモデルの顔立ちと骨格を尊重しつつ、日本人女性らしい雰囲気に最適化
- 以下のヘアディテールを忠実に表現
${hairDetails}
- ${mood?.colorPalette?.length ? `カラーパレット: ${mood.colorPalette.join(', ')}` : '色味は自然な肌トーンと髪色のバランスを保つ'}

【撮影ディレクション】
- 用途: 日本の美容室カタログ掲載用
- ライティング: 柔らかいソフトボックス照明で艶を強調
- 背景: ${mood?.backgroundStyle ?? 'シンプルでサロンらしい背景をぼかして使用'}
- 仕上がり: フォトリアル、肌や髪の質感を保持し、アニメ風表現は禁止

【出力要件】
- 文字や説明文は一切含めない
- 出力形式はPNG画像のみ

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

function createMockImageDataUrl(text: string, bgColor: string = '#E5E7EB'): string {
  // Create a simple SVG placeholder that always works (no network needed)
  const svg = `
    <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="500" fill="${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6B7280">
        ${text}
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9CA3AF">
        (モック画像)
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

async function generateImage(
  prompt: string,
  baseImage?: BaseImageInput,
  config: GenerationConfig = {},
): Promise<string> {
  console.log('Attempting Gemini image generation...');
  console.log('Prompt:', prompt.substring(0, 100) + '...');

  if (!API_KEY) {
    throw new Error('Google API Key is not configured');
  }

  const defaultConfig: Required<GenerationConfig> = {
    temperature: config.temperature ?? 0.7,
    topK: config.topK ?? 40,
    topP: config.topP ?? 0.95,
  };

  const model = genAI.getGenerativeModel({
    model: IMAGE_MODEL,
  });

  const parts: Part[] = [];

  if (baseImage) {
    parts.push({
      inlineData: {
        mimeType: baseImage.mimeType || 'image/jpeg',
        data: baseImage.data,
      },
    });
  }

  parts.push({ text: prompt });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        temperature: defaultConfig.temperature,
        topK: defaultConfig.topK,
        topP: defaultConfig.topP,
      },
    });

    const response = result.response;
    if (!response) {
      throw new Error('Gemini API returned no response');
    }

    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
      const candidateParts = candidate.content?.parts ?? [];
      for (const part of candidateParts) {
        if (part?.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
        if (part?.fileData?.fileUri) {
          return part.fileData.fileUri;
        }
      }
    }

    const textResponse = candidates
      .flatMap((candidate) => candidate.content?.parts ?? [])
      .find((part) => Boolean(part?.text));

    if (textResponse?.text) {
      console.warn('Gemini API returned text instead of image:', textResponse.text);
      const snippet = textResponse.text.slice(0, 120);
      throw new Error(`Gemini API returned text response: ${snippet}`);
    }

    throw new Error('Gemini API did not return image data');
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      if (!base64Data) {
        reject(new Error('Failed to convert file to base64'));
        return;
      }
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateCutModel(
  mood: StyleMoodHint | null,
  gender: ModelGender,
  ageRange: ModelAgeRange,
  faceType: ModelFaceType,
  onProgress?: (progress: number) => void,
): Promise<string> {
  onProgress?.(0);
  const prompt = buildModelPrompt(mood, gender, ageRange, faceType);
  onProgress?.(50);
  const imageUrl = await generateImage(prompt);
  onProgress?.(100);
  return imageUrl;
}

export async function generateCutModels(
  mood: StyleMoodHint | null,
  gender: ModelGender,
  ageRange: ModelAgeRange,
  faceType: ModelFaceType,
  count: number,
  onModelGenerated?: (imageUrl: string, index: number) => void,
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const imageUrl = await generateCutModel(mood, gender, ageRange, faceType);
      results.push(imageUrl);
      onModelGenerated?.(imageUrl, i);
    } catch (error) {
      console.error(`Failed to generate model ${i + 1}:`, error);
      const mockUrl = createMockImageDataUrl(`モデル ${i + 1}`, '#F3F4F6');
      results.push(mockUrl);
      onModelGenerated?.(mockUrl, i);
    }
  }

  return results;
}

export async function generateStyleWithModel(
  mood: StyleMoodHint | null,
  model: CutModel,
  params: HairParameters,
  count: number = 4,
  onStyleGenerated?: (imageUrl: string, index: number) => void,
): Promise<string[]> {
  const prompt = buildStylePromptWithModel(mood, model, params);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const imageUrl = await generateImage(prompt);
      results.push(imageUrl);
      onStyleGenerated?.(imageUrl, i);
    } catch (error) {
      console.error(`Failed to generate style ${i + 1}:`, error);
      const mockUrl = createMockImageDataUrl(`スタイル ${i + 1}`, '#DBEAFE');
      results.push(mockUrl);
      onStyleGenerated?.(mockUrl, i);
    }
  }

  return results;
}

export async function generateStylesBatch(
  mood: StyleMoodHint | null,
  count: number = 8,
  onStyleGenerated?: (imageUrl: string, index: number) => void,
): Promise<string[]> {
  const prompt = buildBatchStylePrompt(mood);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const imageUrl = await generateImage(prompt);
      results.push(imageUrl);
      onStyleGenerated?.(imageUrl, i);
    } catch (error) {
      console.error(`Failed to generate batch style ${i + 1}:`, error);
      const mockUrl = createMockImageDataUrl(`バッチ ${i + 1}`, '#DBEAFE');
      results.push(mockUrl);
      onStyleGenerated?.(mockUrl, i);
    }
  }

  return results;
}

export async function generateStyleTransfer(
  mood: StyleMoodHint | null,
  params: HairParameters,
  referenceImage: File,
  count: number = 4,
  onStyleGenerated?: (imageUrl: string, index: number) => void,
): Promise<string[]> {
  const prompt = buildStyleTransferPrompt(mood, params);
  const base64Image = await fileToBase64(referenceImage);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const imageUrl = await generateImage(prompt, {
        data: base64Image,
        mimeType: referenceImage.type || 'image/jpeg',
      });
      results.push(imageUrl);
      onStyleGenerated?.(imageUrl, i);
    } catch (error) {
      console.error(`Failed to generate style transfer ${i + 1}:`, error);
      const mockUrl = createMockImageDataUrl(`転写 ${i + 1}`, '#FDE68A');
      results.push(mockUrl);
      onStyleGenerated?.(mockUrl, i);
    }
  }

  return results;
}
