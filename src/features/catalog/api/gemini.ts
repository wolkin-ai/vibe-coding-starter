import { GoogleGenAI } from '@google/genai';
import type { CutModel, HairParameters, ModelGender, ModelAgeRange, ModelFaceType } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn('Google API Key is not set in environment variables');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY || '' });
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

interface CutModelGenerationOptions {
  hairPreferences?: Partial<HairParameters>;
  onProgress?: (progress: number) => void;
  additionalNote?: string;
  referenceImage?: File;
}

interface CutModelBatchOptions extends CutModelGenerationOptions {
  onModelGenerated?: (imageUrl: string, index: number) => void;
}

const MODEL_GENDER_LABELS: Record<ModelGender, string> = {
  female: '女性',
  male: '男性',
};

const MODEL_AGE_LABELS: Record<ModelAgeRange, string> = {
  kids: 'キッズ',
  teen: '10代',
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60s': '60代以上',
};

const MODEL_FACE_LABELS: Record<ModelFaceType, string> = {
  oval: '卵型',
  round: '丸型',
  square: '四角型',
  long: '面長',
  heart: 'ハート型',
  inverted_triangle: '逆三角型',
  base: 'ベース型',
};

const HAIR_LENGTH_LABELS: Record<string, string> = {
  very_short: 'ベリーショート（耳が見える長さ）',
  short: 'ショート（耳下〜アゴ上）',
  bob: 'ボブ（アゴライン）',
  medium: 'ミディアム（肩ライン）',
  semi_long: 'セミロング（鎖骨〜胸上）',
  long: 'ロング（胸下〜腰）',
  super_long: 'スーパーロング（腰下）',
};

const HAIR_VOLUME_LABELS: Record<string, string> = {
  low: '少ない',
  normal: '普通',
  high: '多い',
};

const HAIR_TEXTURE_LABELS: Record<string, string> = {
  none: 'クセなし',
  slight: 'クセ少し',
  strong: 'クセ強め',
};

const HAIR_QUALITY_LABELS: Record<string, string> = {
  soft: '柔らかい',
  normal: '普通',
  firm: '硬い',
};

const HAIR_THICKNESS_LABELS: Record<string, string> = {
  thin: '細い',
  normal: '普通',
  thick: '太い',
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

  const length = describeValue(params.length, HAIR_LENGTH_LABELS, params.length);
  if (length) details.push(`- 長さ: ${length}`);

  const volume = describeValue(params.volume, HAIR_VOLUME_LABELS, params.volume);
  if (volume) details.push(`- 髪量: ${volume}`);

  const quality = describeValue(params.quality, HAIR_QUALITY_LABELS, params.quality);
  if (quality) details.push(`- 髪質: ${quality}`);

  const thickness = describeValue(params.thickness, HAIR_THICKNESS_LABELS, params.thickness);
  if (thickness) details.push(`- 太さ: ${thickness}`);

  const color = describeValue(params.color, HAIR_COLOR_LABELS, params.color);
  if (color) details.push(`- カラー: ${color}`);

  if (params.color_technique) details.push(`- カラーテクニック: ${params.color_technique}`);

  const texture = describeValue(params.texture, HAIR_TEXTURE_LABELS, params.texture);
  if (texture) details.push(`- クセ: ${texture}`);

  const bangs = describeValue(params.bangs, BANGS_LABELS, params.bangs);
  if (bangs) details.push(`- 前髪: ${bangs}`);

  if (params.perm) details.push(`- パーマ: ${params.perm}`);

  if (params.styling) details.push(`- スタイリング: ${params.styling}`);

  if (params.styling_keywords?.length) {
    details.push(`- スタイリングキーワード: ${params.styling_keywords.join('、')}`);
  }

  return details.join('\n');
}

function formatModelHairPreferences(
  preferences?: Partial<HairParameters> | null,
): string | undefined {
  if (!preferences) return undefined;

  const details: string[] = [];

  const length = describeValue(preferences.length, HAIR_LENGTH_LABELS, preferences.length);
  if (length) details.push(`  - 長さ: ${length}`);

  const volume = describeValue(preferences.volume, HAIR_VOLUME_LABELS, preferences.volume);
  if (volume) details.push(`  - 髪量: ${volume}`);

  const quality = describeValue(preferences.quality, HAIR_QUALITY_LABELS, preferences.quality);
  if (quality) details.push(`  - 髪質: ${quality}`);

  const thickness = describeValue(
    preferences.thickness,
    HAIR_THICKNESS_LABELS,
    preferences.thickness,
  );
  if (thickness) details.push(`  - 太さ: ${thickness}`);

  const texture = describeValue(preferences.texture, HAIR_TEXTURE_LABELS, preferences.texture);
  if (texture) details.push(`  - クセ: ${texture}`);

  const bangs = describeValue(preferences.bangs, BANGS_LABELS, preferences.bangs);
  if (bangs) details.push(`  - 前髪: ${bangs}`);

  const color = describeValue(preferences.color, HAIR_COLOR_LABELS, preferences.color);
  if (color) details.push(`  - ベースカラー: ${color}`);

  return details.length ? details.join('\n') : undefined;
}

function describeModelAge(age: ModelAgeRange): string {
  return MODEL_AGE_LABELS[age] || 'ターゲット層に合わせた年代';
}

function describeModelFace(face?: string | null): string {
  if (!face) return 'バランスの良い顔立ち';
  return MODEL_FACE_LABELS[face as ModelFaceType] || face;
}

/**
 * Random variation elements to add diversity to generated images.
 * 配列数を増やし、組み合わせの爆発的増加を狙う。
 */
const VARIATION_ELEMENTS = {
  expressions: [
    '柔らかな微笑み',
    '自然な笑顔',
    '穏やかな表情',
    '知的な微笑み',
    'リラックスした表情',
    '優しい眼差し',
    'いたずらっぽいウインク',
    'クールで洗練された視線',
    '穏やかなまなざし',
    '爽やかな笑顔',
    '落ち着いた微笑み',
    '自信に満ちた眼差し',
  ],
  poses: [
    '正面を向いた自然な姿勢',
    'わずかに顔を傾けたポーズ',
    '肩越しに振り向くポーズ',
    '髪を耳にかける仕草',
    '横顔が美しく見える角度',
    '髪を軽く触れるポーズ',
    '椅子に座って足を組むポーズ',
    '立った状態で軽く腰に手を添えるポーズ',
    '両手を前で優しく組むポーズ',
    '顎に手を添えて考える仕草',
    '背筋を伸ばした凛とした姿勢',
    '片手で髪を後ろへ流す仕草',
  ],
  accessories: [
    'シンプルなピアス',
    '小ぶりなネックレス',
    'ナチュラルなイヤリング',
    'アクセサリーなし',
    '細いチェーンのネックレス',
    '小さなスタッドピアス',
    '繊細なゴールドフープ',
    '大ぶりなイヤーカフ',
    '華奢なブレスレット',
    'クラシックなパールアクセサリー',
    'イヤーカフとリングのセット',
    '透明なアクリルアクセサリー',
  ],
  lighting: [
    'ソフトボックスによる均一な照明',
    '窓からの自然光を活かした柔らかい光',
    'リムライトで髪の輪郭を強調',
    'サイドライトで立体感を演出',
    'トップライトとフィルインの組み合わせ',
    '逆光を利用したシルエット強調',
    'ストリップライトで髪の艶を際立たせる',
    'スポットライトで顔の中心を明るく照らす',
    'レフ板を用いたハイキー照明',
    'ゴールデンアワーの自然光',
  ],
  backgrounds: [
    'ニュートラルグレーの背景',
    'クリームホワイトの背景',
    'ぼかしたサロンインテリア',
    '柔らかいベージュトーンの背景',
    '明るいナチュラルトーンの背景',
    '都会的なガラスウォールの背景',
    'カフェ風のウッドテクスチャ背景',
    '淡いグラデーション背景',
    '観葉植物をぼかしたグリーン背景',
    '夜景のボケを使った背景',
    '和モダンな障子モチーフ',
    'サロンのシャンプーブースをぼかした背景',
  ],
  makeupVariations: [
    'ナチュラルで透明感のあるメイク',
    '血色感を重視したヘルシーメイク',
    'マットな質感の大人メイク',
    'ツヤ感のあるフレッシュメイク',
    '上品で洗練されたメイク',
    'アイラインを強調したモードメイク',
    'ピーチカラーのチークを効かせたメイク',
    'ラメを抑えたマットリップメイク',
    '光沢感のあるガラススキン風メイク',
    'ミニマルなノーメイク風スタイル',
    '柔らかいピンクトーンのフェミニンメイク',
    'オレンジブラウンのトレンドメイク',
  ],
  environments: [
    '自然光が差し込むサロンの窓際',
    '白壁とドライフラワーが飾られたスタジオ',
    '都会の高層階ラウンジ',
    'ナチュラルウッド調のセット',
    'コンクリート打ちっぱなしのシンプルな空間',
    'シックなバーラウンジ',
    '海辺を感じさせるブルートーンの背景',
    'ライトグリーンのファブリック背景',
    'スモーキーなグラデーション背景',
    'アートパネルが飾られたギャラリー風空間',
    '春の花々をぼかした背景',
    '暖色系の間接照明が映える空間',
  ],
  storytelling: [
    '新しいサロンメニューの告知用に撮影',
    '春のトレンドスタイル特集',
    '都会で働く20代向けのスタイリッシュ提案',
    'ウェディング前撮り向けの上品スタイル',
    '就活ヘア特集の清楚スタイル',
    '夏フェスを意識したエッジィな提案',
    '成人式記念の華やかアレンジ',
    '40代向けの若見え提案',
    '韓国美容好き向けの最新スタイル',
    '学生向けプチプラカラー紹介',
    'ギャル誌コラボの撮影想定',
    'ナチュラル志向のオーガニックヘア特集',
  ],
  cameraSettings: [
    '50mm単焦点 / F1.4 / ISO200',
    '85mm単焦点 / F2.0 / ISO320',
    '70-200mmズーム / F2.8 / ISO400',
    '35mm単焦点 / F1.8 / ISO160',
    '105mmマクロ / F3.2 / ISO250',
    '中判カメラの雰囲気を再現 / F2.4 / ISO100',
    'シネライクカラー / シャッタースピード1/160',
    'フラッシュあり / F8 / ISO100',
    '連写で動きのある瞬間を捉える設定',
    'トーンカーブを意識したコントラスト設定',
    'HDRを抑えたフィルムライク設定',
    'ナチュラルカラー重視のカラープロファイル',
  ],
};

function randomPickMany<T>(array: T[], count: number): T[] {
  const pool = [...array];
  const picks: T[] = [];
  const limit = Math.min(count, pool.length);
  for (let i = 0; i < limit; i++) {
    const index = Math.floor(Math.random() * pool.length);
    const [value] = pool.splice(index, 1);
    if (value !== undefined) {
      picks.push(value);
    }
  }
  return picks;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function createUniqueSeed(context: string, parts: string[]): string {
  const uuid =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const timestamp = Date.now().toString(36);
  const blueprint = `${context}|${parts.join('|')}|${timestamp}|${uuid}`;
  const digest = simpleHash(blueprint);
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${context.toUpperCase()}-${timestamp}-${digest}-${randomSuffix}`;
}

function createRandomGenerationConfig(): GenerationConfig {
  const temperature = 0.65 + Math.random() * 0.25; // 0.65〜0.90
  const topP = 0.8 + Math.random() * 0.15; // 0.80〜0.95
  // GeminiのimageモデルはtopKの上限が50付近のため、安全な範囲に限定する
  const topKOptions = [24, 32, 40, 48];
  const topK = randomPick(topKOptions);
  return { temperature, topP, topK };
}

/**
 * Randomly selects one element from an array
 */
function randomPick<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index] as T;
}

interface RandomVariationResult {
  description: string;
  signatureParts: string[];
}

function generateRandomVariations(): RandomVariationResult {
  const expressions = randomPickMany(VARIATION_ELEMENTS.expressions, 2);
  const poses = randomPickMany(VARIATION_ELEMENTS.poses, 2);
  const accessories = randomPickMany(VARIATION_ELEMENTS.accessories, 2);
  const lighting = randomPickMany(VARIATION_ELEMENTS.lighting, 1);
  const backgrounds = randomPickMany(VARIATION_ELEMENTS.backgrounds, 2);
  const makeup = randomPickMany(VARIATION_ELEMENTS.makeupVariations, 2);
  const environments = randomPickMany(VARIATION_ELEMENTS.environments, 1);
  const storytelling = randomPickMany(VARIATION_ELEMENTS.storytelling, 1);
  const camera = randomPickMany(VARIATION_ELEMENTS.cameraSettings, 1);

  const variations: string[] = [];
  variations.push(`- 表情バリエーション: ${expressions.join(' / ')}`);
  variations.push(`- ポーズ案: ${poses.join(' / ')}`);
  variations.push(`- アクセサリー候補: ${accessories.join(' / ')}`);
  variations.push(`- 照明プラン: ${lighting.join(' / ')}`);
  variations.push(`- 背景・ロケーション: ${backgrounds.join(' / ')}`);
  variations.push(`- メイク方向性: ${makeup.join(' / ')}`);
  variations.push(`- 撮影環境: ${environments.join(' / ')}`);
  variations.push(`- ストーリーフック: ${storytelling.join(' / ')}`);
  variations.push(`- カメラ設定: ${camera.join(' / ')}`);

  const signatureParts = [
    ...expressions,
    ...poses,
    ...accessories,
    ...lighting,
    ...backgrounds,
    ...makeup,
    ...environments,
    ...storytelling,
    ...camera,
  ];

  return {
    description: variations.join('\n'),
    signatureParts,
  };
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
  hairPreferences?: Partial<HairParameters>,
  additionalNote?: string,
  hasReferenceImage?: boolean,
): string {
  const genderLabel = MODEL_GENDER_LABELS[gender];
  const ageLabel = describeModelAge(ageRange);
  const faceLabel = describeModelFace(faceType);
  const moodHints = compileMoodHints(mood);
  const { description: randomVariations, signatureParts } = generateRandomVariations();
  const hairPreferenceDetails = formatModelHairPreferences(hairPreferences);
  const trimmedNote = additionalNote?.trim();
  const hairPreferenceSeedParts = hairPreferences
    ? [
        hairPreferences.length ?? 'length-free',
        hairPreferences.volume ?? 'volume-free',
        hairPreferences.quality ?? 'quality-free',
        hairPreferences.thickness ?? 'thickness-free',
        hairPreferences.texture ?? 'texture-free',
        hairPreferences.bangs ?? 'bangs-free',
        hairPreferences.color ?? 'color-free',
      ]
    : [];
  const uniqueSeed = createUniqueSeed('model', [
    gender,
    ageRange,
    faceType,
    mood?.id ?? 'free',
    ...hairPreferenceSeedParts,
    trimmedNote && trimmedNote.length ? trimmedNote : 'note-free',
    ...signatureParts,
  ]);
  const hairProfileInstruction = hairPreferenceDetails
    ? `- 髪型: 指定のベース条件を反映\n${hairPreferenceDetails}`
    : '- 髪型: 後工程で多様なスタイルに活用できるナチュラルなベースカット';

  const referenceImageInstruction = hasReferenceImage
    ? `
【参考画像について】
添付された画像を参考にして、モデルの外見の一貫性を保ってください。
- 顔の特徴、表情、雰囲気を参考にしてください
- 同じモデルとして認識できるレベルの一貫性を目指してください
- ただし、指定された髪型や年齢帯などの要件は必ず反映してください
`
    : '';

  return `
画像を生成してください。
日本の美容室カタログに掲載するフォトリアルなモデル写真を制作します。
${referenceImageInstruction}

【目的】
- 日本人女性モデルの美容室カタログ撮影
- ターゲット層: ${mood?.targetAudience ?? '幅広い年代'}

【モデル条件】
- 国籍/人種: 日本人女性
- 性別: ${genderLabel}
- 年齢層: ${ageLabel}
- 顔型: ${faceLabel}
${hairProfileInstruction}
- メイク: ${mood?.makeupStyle ?? 'J-beautyらしい自然なメイク'}
${trimmedNote ? `- 追加の人物イメージメモ: ${trimmedNote}` : ''}

- 一枚の画像には必ず1名のみを写し、分割コラージュや複数カットの合成は禁止
- 構図: バストアップ、カメラ目線
- カメラ: 85mmポートレートレンズ / F1.8 / 4:5縦構図 / 浅い被写界深度
- 多様性: 生成ごとに髪色・アクセサリー・ポーズを微妙に変えてランダムさを出してよい

【ランダムバリエーション（この生成特有）】
${randomVariations}

【ユニーク指示タグ】
- Variation-Key: ${uniqueSeed}
- Mood-ID: ${mood?.id ?? 'none'}

【仕上がり要件】
- 肌テクスチャは自然に保ち、過度なレタッチは禁止
- 一枚の画像に複数人を配置したり、分割レイアウトやタイル状の構図を出さない
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
  const baseHairProfile = formatModelHairPreferences(model.hair_profile);
  const moodHints = compileMoodHints(mood);
  const { description: randomVariations, signatureParts } = generateRandomVariations();
  const uniqueSeed = createUniqueSeed('style-model', [
    model.id,
    model.gender,
    modelAge,
    faceType,
    params.length,
    params.volume ?? 'volume-free',
    params.quality ?? 'quality-free',
    params.thickness ?? 'thickness-free',
    params.color ?? 'unknown',
    params.texture ?? 'texture-free',
    mood?.id ?? 'free',
    ...signatureParts,
  ]);

  return `
画像を生成してください。
日本の美容室カタログに掲載するフォトリアルなヘアスタイル提案を作成します。

【参考画像について】
添付された画像は、ヘアスタイルを適用するモデルの写真です。
- このモデルの顔の特徴、表情、肌の質感を保持してください
- 同じモデルとして認識できるレベルの一貫性を維持してください
- モデルの外見は変えず、ヘアスタイルのみを変更してください

【モデル情報】
- 日本人${MODEL_GENDER_LABELS[model.gender]}モデル
- 年齢層: ${modelAge}
- 顔型: ${faceType}
${baseHairProfile ? `- 既存の髪状態:\n${baseHairProfile}` : ''}
- メイク: ${mood?.makeupStyle ?? '透明感のあるナチュラルメイク'}

【ヘアスタイル指示】
${hairDetails}

- 一枚の画像には必ず1名のみを写し、分割コラージュや複数カットの合成は禁止
- 構図: バストアップ、ヘア全体が映る角度
- カメラ: 85mmポートレートレンズ / F2.0付近 / 4:5縦構図 / 浅い被写界深度
- 多様性: 生成ごとにスタイリング小物や髪色のニュアンスを変えてクリエイティブに

【ランダムバリエーション（この生成特有）】
${randomVariations}

【ユニーク指示タグ】
- Variation-Key: ${uniqueSeed}
- Mood-ID: ${mood?.id ?? 'none'}
- Model-Source: ${model.id}

【仕上がり要件】
- 髪色と質感をフォトリアルに再現し、エアブラシ過多は避ける
- 一枚の画像に複数人を配置したり、分割レイアウトやタイル状の構図を出さない
- テキストや説明文は一切含めない
- 出力形式はPNG画像のみ

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

function buildBatchStylePrompt(mood: StyleMoodHint | null): string {
  const moodHints = compileMoodHints(mood);
  const { description: randomVariations, signatureParts } = generateRandomVariations();
  const uniqueSeed = createUniqueSeed('style-batch', [mood?.id ?? 'free', ...signatureParts]);

  return `
画像を生成してください。
日本の美容室カタログに掲載するフォトリアルなヘアスタイルを作成します。

【目的】
- 日本人女性を中心とした美容室カタログ用のスタイルバリエーション

【バリエーション指針】
- 年代や雰囲気を生成ごとに変化させる（1画像につき1名のみ）
- 長さ・カラー・質感・前髪・スタイリングを幅広く構成し、トレンド感を演出
- メイクは清潔感をキープしつつ、魅力的に

- 一枚の画像には必ず1名のみを写し、分割コラージュや複数カットの合成は禁止
- 構図: バストアップ中心、髪のディテールが明確に映る
- カメラ: 85mmまたは50mmポートレートレンズ / 浅い被写界深度 / 4:5縦構図
- 多様性: スタイルごとにポーズ・表情・アクセサリーを変えて似通いを避ける

【ランダムバリエーション（この生成特有）】
${randomVariations}

【ユニーク指示タグ】
- Variation-Key: ${uniqueSeed}
- Mood-ID: ${mood?.id ?? 'none'}

【仕上がり要件】
- 肌質は自然で、過度なレタッチやアニメ風表現は禁止
- 一枚の画像に複数人を配置したり、分割レイアウトやタイル状の構図を出さない
- テキスト・ロゴ・透かしは入れない
- 出力形式はPNG画像のみ

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

function buildStyleTransferPrompt(mood: StyleMoodHint | null, params: HairParameters): string {
  const hairDetails = formatHairParameters(params);
  const moodHints = compileMoodHints(mood);
  const { description: randomVariations, signatureParts } = generateRandomVariations();
  const uniqueSeed = createUniqueSeed('style-transfer', [
    params.length,
    params.volume ?? 'volume-free',
    params.quality ?? 'quality-free',
    params.thickness ?? 'thickness-free',
    params.texture ?? 'texture-free',
    params.color ?? 'color-free',
    mood?.id ?? 'free',
    ...signatureParts,
  ]);

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
- 仕上がり: フォトリアル、肌や髪の質感を保持し、アニメ風表現は禁止
- 一枚の画像には必ず1名のみを写し、分割コラージュや複数カットの合成は禁止

【ランダムバリエーション（この生成特有）】
${randomVariations}

【ユニーク指示タグ】
- Variation-Key: ${uniqueSeed}
- Mood-ID: ${mood?.id ?? 'none'}

【出力要件】
- 文字や説明文は一切含めない
- 一枚の画像に複数人を配置したり、分割レイアウトやタイル状の構図を出さない
- 出力形式はPNG画像のみ

【参考ヒント（任意で採用可）】
${moodHints}
`.trim();
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const byte1 = bytes[i] ?? 0;
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    i += 3;

    const first = byte1 >> 2;
    const second = ((byte1 & 0x03) << 4) | ((byte2 ?? 0) >> 4);
    const third = byte2 !== undefined ? ((byte2 & 0x0f) << 2) | ((byte3 ?? 0) >> 6) : 64;
    const fourth = byte3 !== undefined ? byte3 & 0x3f : 64;

    result += BASE64_ALPHABET[first];
    result += BASE64_ALPHABET[second];
    result += third === 64 ? '=' : BASE64_ALPHABET[third];
    result += fourth === 64 ? '=' : BASE64_ALPHABET[fourth];
  }

  return result;
}

function encodeSvgToBase64(svg: string): string {
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  if (encoder) {
    const bytes = encoder.encode(svg);

    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      let binary = '';
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      return window.btoa(binary);
    }

    return bytesToBase64(bytes);
  }

  const btoaFn =
    typeof window !== 'undefined' && typeof window.btoa === 'function'
      ? window.btoa.bind(window)
      : typeof btoa === 'function'
        ? btoa
        : null;

  if (!btoaFn) {
    throw new Error('Base64 encoding is not supported in this environment');
  }

  const asciiSafe = svg.replace(/[\u0100-\uFFFF]/g, '?');
  return btoaFn(asciiSafe);
}

function createMockImageDataUrl(text: string, bgColor: string = '#E5E7EB'): string {
  // Create a simple SVG placeholder that always works (no network needed)
  const sanitizedLabel = text.replace(/\s+/g, ' ').trim();
  const svg = `
    <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="500" fill="${bgColor}"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6B7280">
        ${sanitizedLabel}
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9CA3AF">
        (モック画像)
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${encodeSvgToBase64(svg)}`;
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

  try {
    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['Image'],
        temperature: config.temperature ?? 0.7,
        topK: config.topK ?? 40,
        topP: config.topP ?? 0.95,
      },
    });

    console.log('Full API response:', JSON.stringify(response, null, 2));

    const candidates = response.candidates ?? [];
    console.log('Number of candidates:', candidates.length);

    for (const candidate of candidates) {
      const candidateParts = candidate.content?.parts ?? [];
      console.log(
        'Candidate parts:',
        candidateParts.length,
        JSON.stringify(candidateParts, null, 2),
      );

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

    interface ResponseCandidate {
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }

    const textResponse = (candidates as ResponseCandidate[])
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
    console.error('Error details:', JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
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
  options: CutModelGenerationOptions = {},
): Promise<string> {
  const { hairPreferences, onProgress, additionalNote, referenceImage } = options;
  onProgress?.(0);

  let referenceImageData: BaseImageInput | undefined;
  if (referenceImage) {
    try {
      const base64Data = await fileToBase64(referenceImage);
      referenceImageData = {
        data: base64Data,
        mimeType: referenceImage.type || 'image/jpeg',
      };
    } catch (error) {
      console.error('Failed to process reference image:', error);
      throw new Error('Failed to process reference image');
    }
  }

  const prompt = buildModelPrompt(
    mood,
    gender,
    ageRange,
    faceType,
    hairPreferences,
    additionalNote,
    Boolean(referenceImageData),
  );
  onProgress?.(50);
  const imageUrl = await generateImage(prompt, referenceImageData, createRandomGenerationConfig());
  onProgress?.(100);
  return imageUrl;
}

export async function generateCutModels(
  mood: StyleMoodHint | null,
  gender: ModelGender,
  ageRange: ModelAgeRange,
  faceType: ModelFaceType,
  count: number,
  options: CutModelBatchOptions = {},
): Promise<string[]> {
  const results: string[] = [];
  const { hairPreferences, onModelGenerated, onProgress, additionalNote, referenceImage } = options;

  for (let i = 0; i < count; i++) {
    try {
      const imageUrl = await generateCutModel(mood, gender, ageRange, faceType, {
        ...(hairPreferences ? { hairPreferences } : {}),
        ...(additionalNote ? { additionalNote } : {}),
        ...(referenceImage ? { referenceImage } : {}),
      });
      results.push(imageUrl);
      onModelGenerated?.(imageUrl, i);
      if (onProgress) {
        const progress = Math.round(((i + 1) / count) * 100);
        onProgress(progress);
      }
    } catch (error) {
      console.error(`Failed to generate model ${i + 1}:`, error);
      const mockUrl = createMockImageDataUrl(`モデル ${i + 1}`, '#F3F4F6');
      results.push(mockUrl);
      onModelGenerated?.(mockUrl, i);
      if (onProgress) {
        const progress = Math.round(((i + 1) / count) * 100);
        onProgress(progress);
      }
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
  const results: string[] = [];

  // Convert model image to base64 reference image
  let modelImageData: BaseImageInput | undefined;
  try {
    if (model.image_url.startsWith('data:')) {
      // Already a data URL, extract base64 data
      const base64Match = model.image_url.match(/^data:([^;]+);base64,(.+)$/);
      if (base64Match && base64Match[2]) {
        modelImageData = {
          data: base64Match[2],
          mimeType: base64Match[1] ?? 'image/png',
        };
      }
    } else {
      // Remote URL - fetch and convert to base64
      const response = await fetch(model.image_url);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          if (!base64) {
            reject(new Error('Failed to extract base64 from image'));
            return;
          }
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      modelImageData = {
        data: base64Data,
        mimeType: blob.type || 'image/png',
      };
    }
  } catch (error) {
    console.warn('Failed to load model image as reference, generating without reference:', error);
  }

  for (let i = 0; i < count; i++) {
    try {
      const prompt = buildStylePromptWithModel(mood, model, params);
      const imageUrl = await generateImage(prompt, modelImageData, createRandomGenerationConfig());
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
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const prompt = buildBatchStylePrompt(mood);
      const imageUrl = await generateImage(prompt, undefined, createRandomGenerationConfig());
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
  const base64Image = await fileToBase64(referenceImage);
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const prompt = buildStyleTransferPrompt(mood, params);
      const imageUrl = await generateImage(
        prompt,
        {
          data: base64Image,
          mimeType: referenceImage.type || 'image/jpeg',
        },
        createRandomGenerationConfig(),
      );
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
