import React from 'react';

import { Search } from 'lucide-react';

import { Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

import type { TodoFilter } from '../types';

interface TodoFilterBarProps {
  activeFilter: TodoFilter;
  onFilterChange: (nextFilter: TodoFilter) => void;
  counts: {
    total: number;
    active: number;
    completed: number;
  };
  searchTerm: string;
  onSearchChange: (nextSearchTerm: string) => void;
}

const FILTER_OPTIONS: Array<{
  value: TodoFilter;
  label: string;
  countKey: keyof TodoFilterBarProps['counts'];
}> = [
  { value: 'all', label: 'すべて', countKey: 'total' },
  { value: 'active', label: '未完了', countKey: 'active' },
  { value: 'completed', label: '完了', countKey: 'completed' },
];

/**
 * Todo filter bar
 *
 * Provides quick filters for switching between all, active, and completed todos.
 */
export function TodoFilterBar({
  activeFilter,
  onFilterChange,
  counts,
  searchTerm,
  onSearchChange,
}: TodoFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.value === activeFilter;
          const badgeClassName = cn(
            'ml-2 rounded-full px-2 py-0.5 text-xs font-semibold',
            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600',
          );

          return (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={isActive}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'flex items-center gap-2',
                isActive && 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100',
              )}
            >
              <span>{option.label}</span>
              <span className={badgeClassName}>{counts[option.countKey]}</span>
            </Button>
          );
        })}
      </div>

      <div className="relative w-full md:w-64">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <Input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="キーワードで絞り込み"
          className="pl-9 text-sm"
          aria-label="Todo検索"
        />
      </div>
    </div>
  );
}
