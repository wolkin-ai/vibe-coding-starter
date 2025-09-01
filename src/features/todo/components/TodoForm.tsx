import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';

import { Button, Input } from '@/shared/ui';

import { useAddTodo } from '../hooks';
import { todoInputSchema } from '../schema';

import type { TodoInput } from '../schema';

/**
 * Todo form component
 *
 * Handles adding new todos with validation and error handling.
 */
export function TodoForm() {
  const addTodo = useAddTodo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TodoInput>({
    resolver: zodResolver(todoInputSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async (data: TodoInput) => {
    try {
      await addTodo.mutateAsync(data);
      reset();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            {...register('title')}
            placeholder="何をする必要がありますか？"
            error={errors.title?.message}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {isSubmitting ? '追加中...' : 'Todoを追加'}
        </Button>
      </div>

      {addTodo.error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-600">Todoの追加に失敗しました。もう一度お試しください。</p>
        </div>
      )}
    </form>
  );
}
