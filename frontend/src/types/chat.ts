export type ChatRole = 'user' | 'agent';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

export type AgentActivityStep = {
  label: string;
  description: string;
  status?: 'pending' | 'active' | 'complete' | 'error';
};

export type ToolInfo = {
  name: string;
  category: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  detail: string;
};

export type DashboardSettings = {
  apiBaseUrl: string;
  modelName: string;
  theme: 'light' | 'dark';
};
