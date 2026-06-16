import { BrainCircuit, History, MessageSquare, Settings, Wrench } from 'lucide-react';

import type { ChatMessage, DashboardSettings } from '../types/chat';

export const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'agent',
    content: 'Pydantic AI Agent 대시보드가 준비되었습니다. Kubernetes, GitHub, 네트워크 상태 등을 물어보세요.',
  },
];

export const navigationItems = [
  { id: 'chat', label: '채팅', icon: MessageSquare },
  { id: 'tools', label: '도구', icon: Wrench },
  { id: 'trace', label: '에이전트 활동', icon: BrainCircuit },
  { id: 'history', label: '대화 기록', icon: History },
  { id: 'settings', label: '설정', icon: Settings },
];

export const defaultSettings: DashboardSettings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  modelName: 'qwen2.5:3b',
  theme: 'light',
};
