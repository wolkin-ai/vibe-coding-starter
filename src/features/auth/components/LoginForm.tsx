import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { useSignIn, useSignUp } from '../hooks';

const authSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

type AuthInput = z.infer<typeof authSchema>;

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const signIn = useSignIn();
  const signUp = useSignUp();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthInput) => {
    try {
      if (isSignUp) {
        const result = await signUp.mutateAsync(data);
        // サインアップ成功時、メール確認が必要な場合の処理
        if (result.user && !result.session) {
          // メール確認が必要な場合
          setAwaitingConfirmation(true);
          console.log('メール確認が必要です。メールをご確認ください。');
        }
      } else {
        await signIn.mutateAsync(data);
      }
      reset();
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const isLoading = signIn.isPending || signUp.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{isSignUp ? 'アカウント作成' : 'ログイン'}</CardTitle>
          <p className="text-center text-sm text-gray-600">Vibe Coding スターターへようこそ</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('email')}
              type="email"
              label="メールアドレス"
              placeholder="your@email.com"
              error={errors.email?.message}
              disabled={isLoading}
            />

            <Input
              {...register('password')}
              type="password"
              label="パスワード"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                {isSignUp
                  ? 'すでにアカウントをお持ちですか？ ログインする'
                  : 'アカウントをお持ちでない方はこちら'}
              </button>
            </div>
          </form>

          {awaitingConfirmation && (
            <div className="mt-4 rounded-md bg-blue-50 p-3">
              <p className="text-sm text-blue-600">
                📧 メール確認が必要です。送信されたメールのリンクをクリックしてください。
              </p>
              <button
                type="button"
                onClick={() => setAwaitingConfirmation(false)}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700"
              >
                別のアカウントでログインする
              </button>
            </div>
          )}

          {(signIn.error || signUp.error) && !awaitingConfirmation && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">
                {(signIn.error as Error)?.message || (signUp.error as Error)?.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
