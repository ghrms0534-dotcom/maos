import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';

import type { AgentActivityStep, DashboardSettings, ToolInfo } from '../types/chat';

type RightPanelProps = {
  settings: DashboardSettings;
  tools: ToolInfo[];
  activity: AgentActivityStep[];
};

export function RightPanel({ settings, tools, activity }: RightPanelProps) {
  return (
    <aside className="surface overflow-y-auto border-l p-5">
      <Panel title="Agent Info">
        <InfoRow label="Model" value={settings.modelName} />
        <InfoRow label="Framework" value="pydantic-ai" />
        <InfoRow label="Status" value="Active" />
      </Panel>

      <Panel title="Available Tools">
        <div className="space-y-2">
          {tools.map((tool) => (
            <div key={tool.name} className="card-subtle flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate text-sm">{tool.name}</span>
              <ToolStatus status={tool.status} />
            </div>
          ))}
          {tools.length === 0 && <div className="text-muted text-sm">No tools loaded.</div>}
        </div>
      </Panel>

      <Panel title="Agent Activity">
        <div className="space-y-3">
          {activity.map((step, index) => (
            <div key={`${step.label}-${index}`} className="flex gap-3">
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
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
          {activity.length === 0 && <div className="text-muted text-sm">No active activity.</div>}
        </div>
      </Panel>
    </aside>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="text-muted mb-3 text-sm font-semibold uppercase">{title}</h3>
      <div className="card p-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 last:mb-0">
      <span className="text-muted text-sm">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function ToolStatus({ status }: { status: ToolInfo['status'] }) {
  if (status === 'active') {
    return <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-label="Active" />;
  }
  if (status === 'error') {
    return <AlertCircle size={16} className="shrink-0 text-red-600" aria-label="Error" />;
  }
  return <Circle size={16} className="shrink-0 text-slate-400" aria-label="Inactive" />;
}
