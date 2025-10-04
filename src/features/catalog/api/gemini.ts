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

type VariationCategory = keyof typeof VARIATION_ELEMENTS;

type VariationProfile = 'default' | 'high' | 'controlled';

const VARIATION_CATEGORY_LABELS: Record<VariationCategory, string> = {
  expressions: '表情バリエーション',
  poses: 'ポーズ案',
  accessories: 'アクセサリー候補',
  lighting: '照明プラン',
  backgrounds: '背景・ロケーション',
  makeupVariations: 'メイク方向性',
  environments: '撮影環境',
  storytelling: 'ストーリーフック',
  cameraSettings: 'カメラ設定',
};

const VARIATION_COUNT_PRESETS: Record<
  VariationProfile,
  Partial<Record<VariationCategory, number>>
> = {
  default: {
    expressions: 2,
    poses: 2,
    accessories: 2,
    lighting: 1,
    backgrounds: 2,
    makeupVariations: 2,
    environments: 1,
    storytelling: 1,
    cameraSettings: 1,
  },
  high: {
    expressions: 3,
    poses: 3,
    accessories: 3,
    backgrounds: 3,
    environments: 2,
    storytelling: 2,
  },
  controlled: {
    expressions: 1,
    poses: 1,
    accessories: 1,
    backgrounds: 1,
    makeupVariations: 1,
  },
};

interface RandomVariationOptions {
  excludeCategories?: VariationCategory[];
  profile?: VariationProfile;
}

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

function generateRandomVariations(options: RandomVariationOptions = {}): RandomVariationResult {
  const excludeSet = new Set<VariationCategory>(options.excludeCategories ?? []);
  const profile = options.profile ?? 'default';
  const profileCounts = VARIATION_COUNT_PRESETS[profile] ?? {};
  const variations: string[] = [];
  const signatureParts: string[] = [];

  (Object.keys(VARIATION_ELEMENTS) as VariationCategory[]).forEach((category) => {
    if (excludeSet.has(category)) {
      return;
    }

    const baseCount = VARIATION_COUNT_PRESETS.default[category] ?? 1;
    const requestedCount = profileCounts[category] ?? baseCount;
    const count = Math.max(1, Math.min(VARIATION_ELEMENTS[category].length, requestedCount));
    const elements = randomPickMany(VARIATION_ELEMENTS[category], count);

    if (!elements.length) {
      return;
    }

    const label = VARIATION_CATEGORY_LABELS[category];
    variations.push(`- ${label}: ${elements.join(' / ')}`);
    signatureParts.push(...elements);
  });

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

function buildPromptSection(title: string, lines: Array<string | undefined | null>): string {
  const filtered = lines
    .map((line) => (typeof line === 'string' ? line.trimEnd() : line))
    .filter((line): line is string => Boolean(line && line.trim().length));
  if (!filtered.length) return '';
  return [`【${title}】`, ...filtered].join('\n');
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
  const variationOptions: RandomVariationOptions = hasReferenceImage
    ? {
        profile: 'controlled',
        excludeCategories: ['expressions', 'poses', 'makeupVariations'],
      }
    : {
        profile: 'high',
      };
  const { description: randomVariations, signatureParts } =
    generateRandomVariations(variationOptions);
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
    hasReferenceImage ? 'face-lock' : 'face-open',
    ...signatureParts,
  ]);
  const intro = [
    '画像を生成してください。',
    '日本の美容室カタログに掲載するフォトリアルなモデル写真を制作します。',
  ].join('\n');

  const referenceSection = hasReferenceImage
    ? buildPromptSection('参考画像', [
        '添付された画像のモデルをベースとして、同一人物と認識できる範囲で生成する。',
        '顔保持ルール:',
        '  - 輪郭・骨格・目・鼻・口・眉の形状と配置を変更しない',
        '  - 表情・肌質・肌トーンを一致させ、過度な補正は行わない',
        '  - カメラアングルやポーズの変化は±10度以内の微調整に留める',
      ])
    : '';

  const modelSection = buildPromptSection('モデル設定', [
    `- 性別: ${genderLabel}`,
    `- 年齢層: ${ageLabel}`,
    `- 顔型: ${faceLabel}`,
    `- ターゲット層: ${mood?.targetAudience ?? '幅広い年代'}`,
    `- メイク: ${mood?.makeupStyle ?? 'J-beautyらしい自然なメイク'}`,
  ]);

  const hairProfileInstruction = hairPreferenceDetails
    ? `- ヘアベース条件: 指定のベース設定を反映\n${hairPreferenceDetails}`
    : '- ヘアベース: 後工程で多様なスタイルに展開できるナチュラルなカット';
  const hairSection = buildPromptSection('ヘアベース', [
    hairProfileInstruction,
    trimmedNote ? `- 追加メモ: ${trimmedNote}` : undefined,
  ]);

  const variationSection = buildPromptSection(
    'バリエーション指示',
    hasReferenceImage
      ? [
          '- 参照モデルの顔立ちを維持したまま、髪色・束感・アクセサリーでニュアンスの変化を付ける。',
          '- 表情やポーズは参照に近い範囲で微調整し、別人に見える改変は禁止。',
        ]
      : [
          '- 各生成は異なる人物で構わない。顔立ちや骨格、雰囲気、肌トーンを大胆に変えて多様性を出す。',
          '- 髪色・質感・前髪・スタイリング・アクセサリー・背景を大きく入れ替え、比較しやすい幅広いバリエーションを提示する。',
          '- ターゲット層に合う日本人モデルとしてのリアリティを維持する。',
        ],
  );

  const shootSection = buildPromptSection('撮影ディレクション', [
    '構図: バストアップでモデルの表情と髪全体が分かるアングル。',
    'カメラ: 85mmポートレートレンズ / F1.8前後 / 4:5縦構図。',
    '照明: 柔らかなキーライトと補助光で肌と髪の質感を強調する。',
    '背景: サロンやスタジオのリアルな環境。ムードに合わせて背景色や小物を変えて良い。',
  ]);

  const creativeSection = buildPromptSection('クリエイティブヒント', [randomVariations]);

  const qualitySection = buildPromptSection('品質・出力', [
    '人物は1名のみ。分割レイアウトやマルチカットの合成は禁止。',
    'フォトリアリズムを維持し、アニメ風やAIアート風表現は禁止。',
    '肌テクスチャは自然に保ち、過剰なレタッチは禁止。',
    'テキスト・ロゴ・透かしを含めない。',
    '出力形式: PNGのみ。',
  ]);

  const metaSection = buildPromptSection('生成メタ情報', [
    `- Variation-Key: ${uniqueSeed}`,
    `- Mood-ID: ${mood?.id ?? 'none'}`,
    `- Model-Source: ${hasReferenceImage ? 'reference-image' : 'parametric-profile'}`,
  ]);

  const moodSection = buildPromptSection('参考ヒント（任意）', [moodHints]);

  const sections = [
    intro,
    referenceSection,
    modelSection,
    hairSection,
    variationSection,
    shootSection,
    creativeSection,
    qualitySection,
    metaSection,
    moodSection,
  ].filter(Boolean);

  return sections.join('\n\n').trim();
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
  const { description: randomVariations, signatureParts } = generateRandomVariations({
    excludeCategories: ['expressions', 'poses', 'makeupVariations'],
    profile: 'controlled',
  });
  const uniqueSeed = createUniqueSeed('style-model', [
    model.id,
    model.gender,
    modelAge,
    faceType,
    params.length ?? 'length-free',
    params.volume ?? 'volume-free',
    params.quality ?? 'quality-free',
    params.thickness ?? 'thickness-free',
    params.color ?? 'color-free',
    params.texture ?? 'texture-free',
    params.bangs ?? 'bangs-free',
    mood?.id ?? 'free',
    'face-lock',
    ...signatureParts,
  ]);

  const intro = [
    '画像を生成してください。',
    '日本の美容室カタログ向けに、参照モデルの顔を保持したまま髪型のみを変更したフォトリアル画像を作成します。',
  ].join('\n');

  const referenceSection = buildPromptSection('参照モデル', [
    '添付画像はベースモデルです。同一人物と認識できる顔立ちを厳密に維持してください。',
    '顔保持ルール:',
    '  - 輪郭・骨格・目・鼻・口・眉の形状と位置を変更しない',
    '  - 表情・視線・肌色・肌質は参照画像と一致させ、レタッチは必要最小限',
    '  - 頭部やカメラアングルの調整は±10度以内の微調整にとどめる',
    `- モデル: 日本人${MODEL_GENDER_LABELS[model.gender]} / 年齢層: ${modelAge} / 顔型: ${faceType}`,
    baseHairProfile ? `- 既存の髪状態:\n${baseHairProfile}` : undefined,
    `- メイク: ${mood?.makeupStyle ?? '透明感のあるナチュラルメイク'}`,
  ]);

  const hairSection = buildPromptSection('ヘアスタイル指示', [
    hairDetails,
    '髪の艶・立体感・毛束の流れを自然に表現し、頭頂部から毛先までディテールを保持する',
  ]);

  const compositionSection = buildPromptSection('撮影・構図', [
    '構図: バストアップで髪全体がフレームに収まる角度。カメラ高さは目線と同程度。',
    'カメラ: 85mm相当 / F2.0前後 / 4:5縦構図。カメラ位置の大幅な変化は禁止。',
    '照明: 柔らかなキーライトとリムライトで髪の質感を強調しつつ、顔の陰影を崩さない。',
    '背景: ニュートラルトーンのサロンまたはスタジオ。極端な背景変更や屋外演出は禁止。',
  ]);

  const adjustmentSection = buildPromptSection('許容される微調整', [
    '髪の束感・毛流れ・前髪の分け目は自然な範囲で微調整して良い。',
    'ヘアアクセサリーは小ぶりなピンや控えめなイヤリングのみ追加可。顔の印象を変えるアイテムは禁止。',
  ]);

  const qualitySection = buildPromptSection('品質・出力', [
    '人物は1名のみ。分割レイアウトやマルチカットの合成は禁止。',
    'テキスト・ロゴ・装飾グラフィックは入れない。',
    '肌と髪の質感をフォトリアルに保ち、AIアート風エフェクトは禁止。',
    '参照画像と照合し、顔の特徴が一致していることを確認してから採用する。',
    '出力形式: PNGのみ。',
  ]);

  const metaSection = buildPromptSection('生成メタ情報', [
    `- Variation-Key: ${uniqueSeed}`,
    `- Mood-ID: ${mood?.id ?? 'none'}`,
    `- Model-Source: ${model.id}`,
  ]);

  const moodSection = buildPromptSection('参考ヒント（任意）', [moodHints]);
  const creativeSection = buildPromptSection('調整ヒント', [randomVariations]);

  const sections = [
    intro,
    referenceSection,
    hairSection,
    compositionSection,
    adjustmentSection,
    qualitySection,
    metaSection,
    creativeSection,
    moodSection,
  ].filter(Boolean);

  return sections.join('\n\n').trim();
}

function buildBatchStylePrompt(mood: StyleMoodHint | null): string {
  const moodHints = compileMoodHints(mood);
  const { description: randomVariations, signatureParts } = generateRandomVariations({
    profile: 'high',
  });
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
  const uniqueSeed = createUniqueSeed('style-transfer', [
    params.length ?? 'length-free',
    params.volume ?? 'volume-free',
    params.quality ?? 'quality-free',
    params.thickness ?? 'thickness-free',
    params.texture ?? 'texture-free',
    params.color ?? 'color-free',
    params.bangs ?? 'bangs-free',
    mood?.id ?? 'free',
    'face-lock',
  ]);

  const intro = [
    '画像を生成してください。',
    'アップロードされた参照画像と同一人物として認識できる顔を維持しながら、ヘアスタイルのみを転写してください。',
  ].join('\n');

  const referenceSection = buildPromptSection('参照画像の取り扱い', [
    '添付画像は必ずベースとして使用する。新規の顔や体を生成しない。',
    '顔保持ルール:',
    '  - 頭部の輪郭・骨格・目・鼻・口・眉の形状と配置を変更しない',
    '  - 表情・視線・肌色・肌質・照明の当たり方を保つ',
    '  - カメラアングルは参照と同等。構図変更は±5度以内の微調整まで。',
  ]);

  const hairSection = buildPromptSection('転写するヘアディテール', [
    hairDetails,
    'ヘア転写の目的は髪色・長さ・質感・スタイリングの再現に限定し、顔の形状を変える補正は禁止。',
    mood?.colorPalette?.length
      ? `- カラーパレット: ${mood.colorPalette.join(', ')}`
      : 'カラーは参照画像の肌トーンと調和する自然な仕上げにする',
  ]);

  const compositionSection = buildPromptSection('撮影・背景の制約', [
    '用途: 日本の美容室カタログ。',
    '構図: バストアップ基準でヘア全体を収める。余白バランスは参照画像から大きく逸脱しない。',
    '背景: 参照画像の背景を踏襲するか、トーンを揃えた近似背景に限定。極端な背景置換は禁止。',
    '照明: 参照画像のライティング方向とコントラストを再現する。',
  ]);

  const adjustmentSection = buildPromptSection('許容差分', [
    '毛束の動き・ボリューム・前髪の分け目は自然な範囲で微調整可。',
    'ヘアアクセサリーは参照に存在する場合のみ再現し、新規追加は禁止。',
  ]);

  const qualitySection = buildPromptSection('品質・検証', [
    '人物は1名のみ。マルチカット合成は禁止。',
    'テキスト・ロゴ・透かしを含めない。',
    '肌・髪の質感をフォトリアルに保ち、イラスト風・AIアート風の処理は禁止。',
    '生成結果が参照顔と一致しているか確認し、別人に見える場合は破棄する。',
    '出力形式: PNG。',
  ]);

  const metaSection = buildPromptSection('生成メタ情報', [
    `- Variation-Key: ${uniqueSeed}`,
    `- Mood-ID: ${mood?.id ?? 'none'}`,
  ]);

  const moodSection = buildPromptSection('参考ヒント（任意）', [moodHints]);

  const sections = [
    intro,
    referenceSection,
    hairSection,
    compositionSection,
    adjustmentSection,
    qualitySection,
    metaSection,
    moodSection,
  ].filter(Boolean);

  return sections.join('\n\n').trim();
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
  if (baseImage) {
    console.log('Base image provided with mime type:', baseImage.mimeType);
  }

  if (!API_KEY) {
    throw new Error('Google API Key is not configured');
  }

  try {
    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (baseImage) {
      userParts.push({ inlineData: { mimeType: baseImage.mimeType, data: baseImage.data } });
    }

    userParts.push({ text: prompt });

    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: userParts,
        },
      ],
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
