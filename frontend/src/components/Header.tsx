import { Bot } from 'lucide-react';

import type { ApiStatus } from '../api/client';
import { StatusPill } from './StatusPill';

type HeaderProps = {
  apiStatus: ApiStatus;
};

export function Header({ apiStatus }: HeaderProps) {
  return (
    <header className="surface flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-ink text-white">
          <Bot size={22} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Pydantic AI Agent Dashboard</h1>
          <p className="text-muted text-sm">Local LLM, MCP Router, FastAPI orchestration</p>
        </div>
      </div>
      <StatusPill status={apiStatus} />
    </header>
  );
}
