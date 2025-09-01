import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/shared/lib/supabase';
import { getCurrentUser, signInWithEmail, signOut, signUpWithEmail } from './api';

const AUTH_QUERY_KEY = ['auth', 'user'];

/**
 * Auth hooks for Vibe Coding Starter
 *
 * Provides authentication state management using React Query.
 */

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInWithEmail(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
    onError: (error) => {
      console.error('Sign in failed:', error);
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signUpWithEmail(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
    onError: (error) => {
      console.error('Sign up failed:', error);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear(); // Clear all queries on sign out
    },
    onError: (error) => {
      console.error('Sign out failed:', error);
    },
  });
}
