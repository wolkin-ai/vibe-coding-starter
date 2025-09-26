import React from 'react';

import { Button } from '@/shared/ui';
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
export function TodoFilterBar({ activeFilter, onFilterChange, counts }: TodoFilterBarProps) {
  return (
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
  );
}
