import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Zap, Code2 } from 'lucide-react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { AppConfig } from '@/shared/config';

/**
 * Home page
 *
 * Welcome page that introduces Vibe Coding and provides navigation.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Hero section */}
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">{AppConfig.name}</h1>
        </div>
        <p className="mx-auto max-w-2xl text-xl text-gray-600">{AppConfig.description}</p>
      </div>

      {/* Features */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">機能ファーストアーキテクチャ</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              ファイル種別ではなく機能単位で整理。理解しやすく拡張しやすい構造です。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">型安全</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              TypeScript strictモードとzodバリデーション。実行時の意外なエラーを防ぎます。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">AI フレンドリー</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              明確な境界とパターンでAIコード生成に最適化された構造です。
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting started */}
      <Card>
        <CardHeader>
          <CardTitle>Vibeコーディングを始めよう</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            このスターターテンプレートは機能ファーストLiteアーキテクチャを実証します。
            初心者にやさしく、かつプロフェッショナルな基準を保つよう設計されています。
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">含まれているもの：</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• React 18 + TypeScript（strict設定）</li>
              <li>• Tailwind CSS（スタイリング）</li>
              <li>• Supabase（バックエンド・認証）</li>
              <li>• React Query（データフェッチ）</li>
              <li>• Zod（バリデーション）</li>
              <li>• ESLint + Prettier（コード品質）</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <Link to="/todos">Todoアプリを試す</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth/login">サインイン</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
