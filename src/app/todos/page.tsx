import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { TodoForm, TodoList } from '@/features/todo';

/**
 * Todos page
 *
 * Main page for managing todos. This demonstrates the Feature-first Lite
 * architecture where the page is just a composition of feature components.
 */
export default function TodosPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
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
