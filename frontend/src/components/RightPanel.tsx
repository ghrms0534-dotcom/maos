import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';

import type { DashboardSettings, ToolInfo } from '../types/chat';
import { getToolDisplayName } from '../utils/toolDisplay';

type RightPanelProps = {
  settings: DashboardSettings;
  tools: ToolInfo[];
};

export function RightPanel({ settings, tools }: RightPanelProps) {
  return (
    <aside className="surface min-h-0 overflow-y-auto border-l p-5">
      <Panel title="에이전트 정보">
        <InfoRow label="AI 모델" value={settings.modelName} />
        <InfoRow label="연결 상태" value="정상 연결됨" />
        <InfoRow label="응답 상태" value="활성화" />
      </Panel>

      <Panel title="사용 가능한 도구">
        <div className="space-y-2">
          {tools.map((tool) => (
            <div key={tool.name} className="card-subtle flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate text-sm">{getToolDisplayName(tool)}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs">
                <ToolStatus status={tool.status} />
                {tool.status === 'active' ? '사용 가능' : '확인 필요'}
              </span>
            </div>
          ))}
          {tools.length === 0 && <div className="text-muted text-sm">불러온 도구가 없습니다.</div>}
        </div>
      </Panel>

      <Panel title="실행 정보">
        <InfoRow label="최근 실행" value={getToolDisplayName('get_k8s_pods')} />
        <InfoRow label="총 요청" value="14회" />
        <InfoRow label="평균 응답" value="1.3초" />
        <InfoRow label="사용 시간" value="18분" />
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
    return <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-label="활성" />;
  }
  if (status === 'error') {
    return <AlertCircle size={16} className="shrink-0 text-red-600" aria-label="오류" />;
  }
  return <Circle size={16} className="shrink-0 text-slate-400" aria-label="비활성" />;
}
