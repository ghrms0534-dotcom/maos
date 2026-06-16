import type { AgentActivityStep, ToolInfo } from '../types/chat';

export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  answer: string;
};

export type ApiStatus = 'checking' | 'online' | 'offline';

type StreamEvent =
  | ({ type: 'trace' } & Required<AgentActivityStep>)
  | { type: 'answer'; answer: string }
  | { type: 'error'; message: string };

export async function checkHealth(apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export async function fetchTools(apiBaseUrl: string): Promise<ToolInfo[]> {
  const response = await fetch(`${apiBaseUrl}/tools`);
  if (!response.ok) {
    throw new Error(`Tools request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { tools?: ToolInfo[] };
  return data.tools ?? [];
}

export async function sendChat(message: string, apiBaseUrl: string): Promise<ChatResponse> {
  const response = await fetch(`${apiBaseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message } satisfies ChatRequest),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as ChatResponse;
}

export async function streamChat(
  message: string,
  apiBaseUrl: string,
  onActivity: (step: AgentActivityStep) => void,
): Promise<ChatResponse> {
  const response = await fetch(`${apiBaseUrl}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message } satisfies ChatRequest),
  });

  if (!response.ok || !response.body) {
    return sendChat(message, apiBaseUrl);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as StreamEvent;
      if (event.type === 'trace') {
        onActivity({
          label: event.label,
          description: event.description,
          status: event.status,
        });
      } else if (event.type === 'answer') {
        return { answer: event.answer };
      } else if (event.type === 'error') {
        throw new Error(event.message);
      }
    }

    if (done) {
      break;
    }
  }

  throw new Error('Agent stream ended without an answer.');
}
