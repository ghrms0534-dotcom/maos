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
      <Panel title="에이전트 정보">
        <InfoRow label="모델" value={settings.modelName} />
        <InfoRow label="프레임워크" value="pydantic-ai" />
        <InfoRow label="상태" value="활성화" />
      </Panel>

      <Panel title="사용 가능한 도구">
        <div className="space-y-2">
          {tools.map((tool) => (
            <div key={tool.name} className="card-subtle flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate text-sm">{tool.name}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs">
                <ToolStatus status={tool.status} />
                {tool.status === 'active' ? '사용 가능' : '확인 필요'}
              </span>
            </div>
          ))}
          {tools.length === 0 && <div className="text-muted text-sm">불러온 도구가 없습니다.</div>}
        </div>
      </Panel>

      <Panel title="에이전트 활동">
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
          {activity.length === 0 && <div className="text-muted text-sm">현재 진행 중인 활동이 없습니다.</div>}
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
