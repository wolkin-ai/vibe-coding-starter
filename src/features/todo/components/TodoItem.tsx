import React, { useState } from 'react';
import { Check, Trash2, Edit3 } from 'lucide-react';

import { Button } from '@/shared/ui';
import { cn, formatDate } from '@/shared/lib/utils';

import { useDeleteTodo, useToggleTodo, useUpdateTodo } from '../hooks';

import type { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
}

/**
 * Individual todo item component
 *
 * Handles display, editing, completion toggle, and deletion of todos.
 */
export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const deleteTodo = useDeleteTodo();
  const toggleTodo = useToggleTodo();
  const updateTodo = useUpdateTodo();

  const handleToggle = () => {
    toggleTodo.mutate({
      id: todo.id,
      completed: !todo.completed,
    });
  };

  const handleDelete = () => {
    if (window.confirm('このTodoを削除してもよろしいですか？')) {
      deleteTodo.mutate(todo.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(todo.title);
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      updateTodo.mutate({
        id: todo.id,
        input: { title: editTitle.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className={cn('group flex items-center gap-3 rounded-lg border p-4 transition-colors', {
        'bg-gray-50 opacity-75': todo.completed,
        'bg-white hover:bg-gray-50': !todo.completed,
      })}
    >
      {/* Completion toggle */}
      <button
        onClick={handleToggle}
        disabled={toggleTodo.isPending}
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
          {
            'border-green-500 bg-green-500 text-white': todo.completed,
            'border-gray-300 hover:border-green-400': !todo.completed,
          },
        )}
      >
        {todo.completed && <Check className="h-3 w-3" />}
      </button>

      {/* Title */}
      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <div className="space-y-1">
            <p
              className={cn('text-sm', {
                'text-gray-500 line-through': todo.completed,
                'text-gray-900': !todo.completed,
              })}
            >
              {todo.title}
            </p>
            <p className="text-xs text-gray-400">作成日時: {formatDate(todo.created_at)}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!isEditing && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={todo.completed || updateTodo.isPending}
            >
              <Edit3 className="h-3 w-3" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteTodo.isPending}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
