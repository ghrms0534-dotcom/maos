import { Clock3, Play } from 'lucide-react';

import type { ApiStatus } from '../api/client';

type StatusPillProps = {
  status: ApiStatus;
};

export function StatusPill({ status }: StatusPillProps) {
  const label =
    status === 'checking' ? 'Checking API' : status === 'online' ? 'API Status: Online' : 'API Status: Offline';
  const className =
    status === 'online'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
      : status === 'offline'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className={`flex h-9 items-center gap-2 rounded border px-3 text-sm font-medium ${className}`}>
      {status === 'checking' ? <Clock3 size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      {label}
    </div>
  );
}
