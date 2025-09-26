import React from 'react';

import type { TodoStatistics } from '../types';

interface TodoSummaryProps extends TodoStatistics {}

/**
 * Todo summary card
 *
 * Highlights progress and counts for the current todo list.
 */
export function TodoSummary({
  totalCount,
  completedCount,
  activeCount,
  completionRate,
}: TodoSummaryProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">完了率</p>
        <p className="text-2xl font-semibold text-gray-900">{completionRate}%</p>
      </div>

      <div className="flex flex-1 flex-wrap justify-end gap-6 text-sm">
        <SummaryItem label="合計" value={totalCount} />
        <SummaryItem label="未完了" value={activeCount} />
        <SummaryItem label="完了" value={completedCount} />
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="min-w-[80px] text-right">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-medium text-gray-900">{value} 件</p>
    </div>
  );
}
