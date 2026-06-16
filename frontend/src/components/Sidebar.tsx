import { AlertCircle, CheckCircle2, Circle, Plus } from 'lucide-react';

import { navigationItems } from '../data/dashboard';
import type { AgentActivityStep, ChatSession, DashboardSettings, ToolInfo } from '../types/chat';

export type SidebarView = 'chat' | 'tools' | 'trace' | 'history' | 'settings';

type SidebarProps = {
  activeView: SidebarView;
  sessions: ChatSession[];
  currentSessionId: string;
  settings: DashboardSettings;
  tools: ToolInfo[];
  activity: AgentActivityStep[];
  toolsError: string | null;
  onViewChange: (view: SidebarView) => void;
  onNewChat: () => void;
  onRestoreSession: (sessionId: string) => void;
  onSettingsChange: (settings: DashboardSettings) => void;
};

export function Sidebar({
  activeView,
  sessions,
  currentSessionId,
  settings,
  tools,
  activity,
  toolsError,
  onViewChange,
  onNewChat,
  onRestoreSession,
  onSettingsChange,
}: SidebarProps) {
  return (
    <aside className="surface overflow-y-auto border-r p-4">
      <button
        className="primary-btn mb-5 flex h-10 w-full items-center justify-center gap-2 rounded text-sm font-medium"
        onClick={onNewChat}
      >
        <Plus size={17} aria-hidden="true" />
        New Chat
      </button>

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeView;
          return (
            <button
              key={item.id}
              className={`flex h-10 w-full items-center gap-3 rounded px-3 text-sm ${
                isActive ? 'nav-item-active' : 'nav-item'
              }`}
              onClick={() => onViewChange(item.id as SidebarView)}
            >
              <Icon size={17} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="mt-5 border-t border-line pt-4 dark:border-slate-800">
        {activeView === 'tools' && <ToolsPanel tools={tools} error={toolsError} />}
        {activeView === 'trace' && <ActivityPanel activity={activity} />}
        {activeView === 'history' && (
          <HistoryPanel sessions={sessions} currentSessionId={currentSessionId} onRestoreSession={onRestoreSession} />
        )}
        {activeView === 'settings' && <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />}
      </section>
    </aside>
  );
}

function ToolsPanel({ tools, error }: { tools: ToolInfo[]; error: string | null }) {
  if (error) {
    return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>;
  }

  if (tools.length === 0) {
    return <p className="text-muted text-sm">No registered tools returned.</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-muted text-xs font-semibold uppercase">Registered Tools</h3>
      {tools.map((tool) => (
        <div key={tool.name} className="card-subtle p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{tool.name}</span>
            <ToolStatus status={tool.status} />
          </div>
          <p className="text-muted text-xs leading-5">{tool.description}</p>
          <p className="text-faint mt-1 text-xs">{tool.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityPanel({ activity }: { activity: AgentActivityStep[] }) {
  if (activity.length === 0) {
    return <p className="text-muted text-sm">Agent activity appears when a request is running.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-muted text-xs font-semibold uppercase">Agent Activity</h3>
      {activity.map((step, index) => (
        <div key={`${step.label}-${index}`} className="flex gap-3">
          <div
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              step.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-ink text-white'
            }`}
          >
            {index + 1}
          </div>
          <div>
            <div className="text-sm font-medium">{step.label}</div>
            <div className="text-muted text-xs leading-5">{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({
  sessions,
  currentSessionId,
  onRestoreSession,
}: {
  sessions: ChatSession[];
  currentSessionId: string;
  onRestoreSession: (sessionId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-muted text-xs font-semibold uppercase">Chat History</h3>
      {sessions.map((session) => (
        <button
          key={session.id}
          className={`w-full rounded border p-3 text-left ${
            session.id === currentSessionId
              ? 'border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800'
              : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
          }`}
          onClick={() => onRestoreSession(session.id)}
        >
          <div className="truncate text-sm font-medium">{session.title}</div>
          <div className="text-muted mt-1 text-xs">{new Date(session.updatedAt).toLocaleString()}</div>
        </button>
      ))}
    </div>
  );
}

function SettingsPanel({
  settings,
  onSettingsChange,
}: {
  settings: DashboardSettings;
  onSettingsChange: (settings: DashboardSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-muted text-xs font-semibold uppercase">Settings</h3>
      <label className="block">
        <span className="text-muted mb-1 block text-xs font-medium">API Base URL</span>
        <input
          className="field h-9 w-full rounded border px-3 text-sm"
          value={settings.apiBaseUrl}
          onChange={(event) => onSettingsChange({ ...settings, apiBaseUrl: event.target.value })}
        />
      </label>
      <label className="block">
        <span className="text-muted mb-1 block text-xs font-medium">Model</span>
        <input
          className="field h-9 w-full rounded border px-3 text-sm"
          value={settings.modelName}
          onChange={(event) => onSettingsChange({ ...settings, modelName: event.target.value })}
        />
      </label>
      <div>
        <span className="text-muted mb-2 block text-xs font-medium">Theme</span>
        <div className="grid grid-cols-2 rounded border border-slate-300 p-1 dark:border-slate-700">
          {(['light', 'dark'] as const).map((theme) => (
            <button
              key={theme}
              className={`h-8 rounded text-sm ${settings.theme === theme ? 'segmented-active' : 'segmented-idle'}`}
              onClick={() => onSettingsChange({ ...settings, theme })}
            >
              {theme === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolStatus({ status }: { status: ToolInfo['status'] }) {
  if (status === 'active') {
    return <CheckCircle2 size={16} className="text-emerald-600" aria-label="Active" />;
  }
  if (status === 'error') {
    return <AlertCircle size={16} className="text-red-600" aria-label="Error" />;
  }
  return <Circle size={16} className="text-slate-400" aria-label="Inactive" />;
}
