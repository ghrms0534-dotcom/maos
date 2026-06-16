import { useState } from 'react';
import { Activity, CheckCircle2, Circle, Loader2, Send } from 'lucide-react';

import type { ChatMessage, ToolInfo } from '../types/chat';

type ChatConsoleProps = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  tools: ToolInfo[];
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatConsole({ messages, input, loading, error, tools, onInputChange, onSend }: ChatConsoleProps) {
  const [orchestratorOpen, setOrchestratorOpen] = useState(false);

  return (
    <main className="workspace flex min-w-0 flex-col">
      <section className="surface border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">에이전트 콘솔</h2>
            <p className="text-muted text-sm">기존 FastAPI 백엔드와 Agent runner를 그대로 사용합니다.</p>
          </div>
          <div className="relative">
            <button
              className="card-subtle text-muted flex h-9 items-center gap-2 px-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setOrchestratorOpen((current) => !current)}
            >
              <Activity size={17} aria-hidden="true" />
              Multi MCP Orchestrator
            </button>
            {orchestratorOpen && (
              <div className="card absolute right-0 top-11 z-20 w-72 p-4">
                <div className="mb-3 text-sm font-semibold">오케스트레이터 상태</div>
                <StatusLine label="General Orchestrator" active />
                <StatusLine label="Kubernetes Tool" active={isToolActive(tools, 'k8s')} />
                <StatusLine label="GitHub Tool" active={isToolActive(tools, 'github')} />
                <StatusLine label="Network Tool" active={isToolActive(tools, 'public_ip')} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex w-full flex-col gap-3">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div key={message.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <article className={`card max-w-[72%] px-4 py-3 ${isUser ? 'border-slate-300' : ''}`}>
                  <div className="text-muted mb-1 text-[11px] font-semibold uppercase">
                    {isUser ? '사용자' : '에이전트'}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                </article>
              </div>
            );
          })}

          {loading && (
            <div className="flex w-full justify-start">
              <div className="card text-muted flex items-center gap-2 px-4 py-3 text-sm">
                <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                에이전트 요청을 처리하는 중입니다.
              </div>
            </div>
          )}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="surface border-t p-4">
        <div className="flex w-full gap-3">
          <input
            className="field h-11 flex-1 rounded border px-4 text-sm"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSend();
              }
            }}
            placeholder="쿠버네티스, GitHub, 네트워크 상태 등을 물어보세요."
          />
          <button
            className="primary-btn flex h-11 items-center gap-2 rounded px-5 text-sm font-medium"
            onClick={onSend}
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
            전송
          </button>
        </div>
      </section>
    </main>
  );
}

function StatusLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 last:mb-0">
      <span className="text-xs font-medium">{label}</span>
      <span className={`flex items-center gap-1 text-xs ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
        {active ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        {active ? '사용 가능' : '비활성'}
      </span>
    </div>
  );
}

function isToolActive(tools: ToolInfo[], keyword: string): boolean {
  return tools.some((tool) => tool.name.includes(keyword) && tool.status === 'active');
}
