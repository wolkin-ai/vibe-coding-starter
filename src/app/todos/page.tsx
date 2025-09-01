import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { TodoForm, TodoList } from '@/features/todo';
import { useAuth, LoginForm, UserProfile } from '@/features/auth';

/**
 * Todos page
 *
 * Main page for managing todos with authentication.
 * Demonstrates Feature-first Lite architecture with auth integration.
 */
export default function TodosPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show Todo app if authenticated
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* User profile section */}
      <div className="flex justify-end">
        <UserProfile />
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">私のTodo</h1>
        <p className="mt-2 text-gray-600">
          Vibeコーディング用に作られたシンプルなTodoアプリでタスクを管理しましょう。
        </p>
      </div>

      {/* Add new todo */}
      <Card>
        <CardHeader>
          <CardTitle>新しいTodoを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoForm />
        </CardContent>
      </Card>

      {/* Todo list */}
      <Card>
        <CardHeader>
          <CardTitle>あなたのTodo一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList />
        </CardContent>
      </Card>
    </div>
  );
}
