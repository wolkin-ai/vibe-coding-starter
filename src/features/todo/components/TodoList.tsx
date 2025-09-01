import React from 'react';
import { CheckCircle2 } from 'lucide-react';

import { useTodos } from '../hooks';
import { TodoItem } from './TodoItem';

/**
 * Todo list component
 *
 * Displays all todos with loading and error states.
 */
export function TodoList() {
  const { data: todos, isLoading, error } = useTodos();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border bg-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-gray-200" />
              <div className="h-4 flex-1 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          Todoの読み込みに失敗しました。もう一度お試しください。
        </p>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">まだTodoがありません</h3>
        <p className="mt-2 text-sm text-gray-500">上の入力欄から最初のTodoを追加してみましょう。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">合計 {todos.length} 件のTodo</p>
      </div>
    </div>
  );
}
