import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ui } from '@/shared/config';

import { addTodo, deleteTodo, listTodos, updateTodo } from './api';

import type { TodoInput, TodoUpdate } from './schema';

/**
 * Todo React Query hooks
 *
 * These hooks provide a consistent interface for todo data operations.
 * All todo-related components should use these hooks instead of calling the API directly.
 */

const TODO_QUERY_KEY = ['todos'] as const;

export function useTodos() {
  return useQuery({
    queryKey: TODO_QUERY_KEY,
    queryFn: listTodos,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      // Invalidate todos query to refetch the list
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to add todo:', error);
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TodoUpdate }) => updateTodo(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update todo:', error);
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to delete todo:', error);
    },
  });
}

// Optimistic update version (more advanced, for Level 2+)
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      updateTodo(id, { completed }),
    onMutate: async ({ id, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY });

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(TODO_QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData(TODO_QUERY_KEY, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((todo) => (todo.id === id ? { ...todo, completed } : todo));
      });

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(TODO_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY });
    },
  });
}
