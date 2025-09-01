import { supabase } from '@/shared/lib/supabase';

import { todoInputSchema, todoUpdateSchema } from './schema';

import type { Todo, TodoInsert } from './types';
import type { TodoInput, TodoUpdate } from './schema';

/**
 * Todo API functions
 *
 * All todo-related database operations go here.
 * This provides a clean abstraction over Supabase calls.
 */

export async function listTodos(): Promise<Todo[]> {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch todos: ${error.message}`);
  }

  return data ?? [];
}

export async function addTodo(input: TodoInput): Promise<Todo> {
  // Validate input using our schema
  const validatedInput = todoInputSchema.parse(input);

  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const todoData: TodoInsert = {
    title: validatedInput.title,
    user_id: user.user.id,
    completed: false,
  };

  const { data, error } = await supabase.from('todos').insert(todoData).select().single();

  if (error) {
    throw new Error(`Failed to add todo: ${error.message}`);
  }

  return data;
}

export async function updateTodo(id: string, input: TodoUpdate): Promise<Todo> {
  // Validate input using our schema
  const validatedInput = todoUpdateSchema.parse(input);

  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const updateData: Partial<TodoInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (validatedInput.title !== undefined) {
    updateData.title = validatedInput.title;
  }
  if (validatedInput.completed !== undefined) {
    updateData.completed = validatedInput.completed;
  }

  const { data, error } = await supabase
    .from('todos')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.user.id) // Ensure user can only update their own todos
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update todo: ${error.message}`);
  }

  return data;
}

export async function deleteTodo(id: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', user.user.id); // Ensure user can only delete their own todos

  if (error) {
    throw new Error(`Failed to delete todo: ${error.message}`);
  }
}

/**
 * Delete all completed todos for the current user
 */
export async function deleteCompletedTodos(): Promise<number> {
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', user.user.id)
    .eq('completed', true)
    .select('id'); // Return deleted IDs to count them

  if (error) {
    throw new Error(`Failed to delete completed todos: ${error.message}`);
  }

  return data?.length ?? 0;
}
