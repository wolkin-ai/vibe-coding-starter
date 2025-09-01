import React from 'react';
import { LogOut, User } from 'lucide-react';

import { Button } from '@/shared/ui/Button';
import { useAuth, useSignOut } from '../hooks';

export function UserProfile() {
  const { user } = useAuth();
  const signOut = useSignOut();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
        <User className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
        <p className="text-xs text-gray-500">ログイン中</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
        className="flex items-center gap-1"
      >
        <LogOut className="h-3 w-3" />
        {signOut.isPending ? '...' : 'ログアウト'}
      </Button>
    </div>
  );
}
