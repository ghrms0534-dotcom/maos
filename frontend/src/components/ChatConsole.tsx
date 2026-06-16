import { Activity, Loader2, Send } from 'lucide-react';

import type { ChatMessage } from '../types/chat';

type ChatConsoleProps = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatConsole({ messages, input, loading, error, onInputChange, onSend }: ChatConsoleProps) {
  return (
    <main className="workspace flex min-w-0 flex-col">
      <section className="surface border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Agent Console</h2>
            <p className="text-muted text-sm">Existing FastAPI backend and Agent runner are reused.</p>
          </div>
          <div className="text-muted flex items-center gap-2 text-sm">
            <Activity size={17} aria-hidden="true" />
            Multi MCP Orchestrator
          </div>
        </div>
      </section>

      <section className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[82%] rounded border p-4 shadow-soft ${
                message.role === 'user'
                  ? 'card ml-auto border-slate-300 dark:border-slate-700'
                  : 'card mr-auto'
              }`}
            >
              <div className="text-muted mb-2 text-xs font-semibold uppercase">
                {message.role === 'user' ? 'User' : 'Agent'}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
            </article>
          ))}

          {loading && (
            <div className="card text-muted mr-auto flex items-center gap-2 px-4 py-3 text-sm">
              <Loader2 className="animate-spin" size={17} aria-hidden="true" />
              Agent request is running.
            </div>
          )}

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</div>
          )}
        </div>
      </section>

      <section className="surface border-t p-4">
        <div className="mx-auto flex max-w-4xl gap-3">
          <input
            className="field h-11 flex-1 rounded border px-4 text-sm"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSend();
              }
            }}
            placeholder="Show current Kubernetes pod status"
          />
          <button
            className="primary-btn flex h-11 items-center gap-2 rounded px-5 text-sm font-medium"
            onClick={onSend}
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
            Send
          </button>
        </div>
      </section>
    </main>
  );
}
