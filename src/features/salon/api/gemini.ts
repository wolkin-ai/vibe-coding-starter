import { GoogleGenerativeAI } from '@google/generative-ai';
import type { StyleParameters } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn('Google API Key is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

/**
 * 画像をBase64に変換
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to convert file to base64'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * スタイルパラメータからプロンプトを生成
 */
function buildPrompt(parameters: StyleParameters): string {
  const parts: string[] = [];

  parts.push('この人物の髪型を以下のスタイルに変更してください:');

  if (parameters.hair_length) {
    parts.push(`- 髪の長さ: ${parameters.hair_length}`);
  }

  if (parameters.color) {
    parts.push(`- カラー: ${parameters.color}`);
  }

  if (parameters.bangs) {
    parts.push(`- 前髪: ${parameters.bangs}`);
  }

  if (parameters.texture) {
    parts.push(`- 質感: ${parameters.texture}`);
  }

  if (parameters.image_style) {
    parts.push(`- 全体イメージ: ${parameters.image_style}`);
  }

  if (parameters.custom_prompt) {
    parts.push(`\n追加の要望: ${parameters.custom_prompt}`);
  }

  parts.push(
    '\n自然で実写的な仕上がりにしてください。顔の特徴は変えずに、髪型のみを変更してください。',
  );

  return parts.join('\n');
}

export interface GenerationResult {
  image_url: string;
  variation_rank: number;
}

export type OnVariationGenerated = (result: GenerationResult) => void;

/**
 * Google Gemini APIを使って画像を生成
 * 各バリエーションが生成されるたびにコールバックを呼び出す
 */
export async function generateStyleVariations(
  imageFile: File,
  parameters: StyleParameters,
  variationCount: number = 3,
  onVariationGenerated?: OnVariationGenerated,
): Promise<GenerationResult[]> {
  if (!API_KEY) {
    throw new Error('Google API Key is not configured');
  }

  try {
    // 画像をBase64に変換
    const imageBase64 = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    // プロンプトを構築
    const prompt = buildPrompt(parameters);

    // Gemini 2.5 Flash Image モデルを使用（画像編集対応）
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const results: GenerationResult[] = [];

    // 指定された数だけバリエーションを生成
    for (let i = 0; i < variationCount; i++) {
      try {
        console.log(`Generating variation ${i + 1}/${variationCount}...`);

        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7 + i * 0.1, // バリエーションのために温度を変える
            topK: 40,
            topP: 0.95,
          },
        });

        const response = result.response;
        console.log('Response received:', response);

        // 画像データを取得
        if (response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0];
          const parts = candidate.content?.parts || [];

          // 画像データを探す
          let imageFound = false;
          for (const part of parts) {
            if (part.inlineData) {
              const base64Image = part.inlineData.data;
              const imageMime = part.inlineData.mimeType || 'image/png';
              const dataUrl = `data:${imageMime};base64,${base64Image}`;

              const generatedResult = {
                image_url: dataUrl,
                variation_rank: i + 1,
              };

              results.push(generatedResult);

              // コールバックを呼び出して即座に結果を通知
              if (onVariationGenerated) {
                onVariationGenerated(generatedResult);
              }

              imageFound = true;
              console.log(`✓ Variation ${i + 1} generated successfully`);
              break;
            }
          }

          // 画像が見つからない場合、テキストレスポンスをログ
          if (!imageFound) {
            const textPart = parts.find((p) => p.text);
            if (textPart) {
              console.log(`Text response for variation ${i + 1}:`, textPart.text);
            }

            // プレースホルダーを追加
            const colors = ['e3b7ff', 'ffb7c5', 'b7e3ff', 'ffe3b7'];
            const placeholderResult = {
              image_url: `https://placehold.co/800x1000/${colors[i]}/333?text=Variation+${i + 1}%0A%0AModel+returned+text`,
              variation_rank: i + 1,
            };
            results.push(placeholderResult);

            // コールバックを呼び出す
            if (onVariationGenerated) {
              onVariationGenerated(placeholderResult);
            }
          }
        }

        // レート制限対策：リクエスト間に待機
        if (i < variationCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);

        // エラー時はプレースホルダーを追加
        const errorColors = ['ff9999', 'ffaa99', 'ffbb99', 'ffcc99'];
        const errorResult = {
          image_url: `https://placehold.co/800x1000/${errorColors[i]}/FFF?text=Error+${i + 1}%0A%0A${encodeURIComponent(error instanceof Error ? error.message.substring(0, 50) : 'Unknown error')}`,
          variation_rank: i + 1,
        };
        results.push(errorResult);

        // コールバックを呼び出す
        if (onVariationGenerated) {
          onVariationGenerated(errorResult);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in generateStyleVariations:', error);
    throw error;
  }
}
