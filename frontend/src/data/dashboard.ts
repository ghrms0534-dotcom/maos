import { BrainCircuit, History, MessageSquare, Settings, Wrench } from 'lucide-react';

import type { ChatMessage, DashboardSettings } from '../types/chat';

export const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'agent',
    content: 'Pydantic AI Agent Dashboard is ready. Ask about Kubernetes, GitHub, or network status.',
  },
];

export const navigationItems = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'trace', label: 'Agent Activity', icon: BrainCircuit },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const defaultSettings: DashboardSettings = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  modelName: 'qwen2.5:3b',
  theme: 'light',
};
