import { useEffect, useMemo, useState } from 'react';

import { ApiStatus, checkHealth, fetchTools, streamChat } from './api/client';
import { ChatConsole } from './components/ChatConsole';
import { Header } from './components/Header';
import { RightPanel } from './components/RightPanel';
import { Sidebar, type SidebarView } from './components/Sidebar';
import { defaultSettings, starterMessages } from './data/dashboard';
import type { AgentActivityStep, ChatMessage, ChatSession, DashboardSettings, ToolInfo } from './types/chat';

const SETTINGS_KEY = 'pydantic-ai-dashboard:settings';
const SESSIONS_KEY = 'pydantic-ai-dashboard:sessions';
const CURRENT_SESSION_KEY = 'pydantic-ai-dashboard:current-session';

function createSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: starterMessages,
    updatedAt: Date.now(),
  };
}

function loadSettings(): DashboardSettings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return defaultSettings;
  }
}

function loadSessions(): ChatSession[] {
  try {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') as ChatSession[];
    return sessions.length > 0 ? sessions : [createSession()];
  } catch {
    return [createSession()];
  }
}

function titleFromMessages(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  if (!firstUserMessage) {
    return 'New Chat';
  }
  return firstUserMessage.content.slice(0, 42) || 'New Chat';
}

function App() {
  const [settings, setSettings] = useState<DashboardSettings>(() => loadSettings());
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const storedSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
    return sessions.some((session) => session.id === storedSessionId) ? storedSessionId ?? '' : sessions[0]?.id ?? '';
  });
  const [activeView, setActiveView] = useState<SidebarView>('chat');
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [activity, setActivity] = useState<AgentActivityStep[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === currentSessionId) ?? sessions[0],
    [currentSessionId, sessions],
  );
  const messages = currentSession?.messages ?? starterMessages;

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    let mounted = true;
    setApiStatus('checking');
    setToolsError(null);

    checkHealth(settings.apiBaseUrl).then((ok) => {
      if (mounted) {
        setApiStatus(ok ? 'online' : 'offline');
      }
    });

    fetchTools(settings.apiBaseUrl)
      .then((nextTools) => {
        if (mounted) {
          setTools(nextTools);
        }
      })
      .catch((requestError) => {
        if (mounted) {
          setTools([]);
          setToolsError(requestError instanceof Error ? requestError.message : 'Failed to load tools.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [settings.apiBaseUrl]);

  function updateCurrentSession(nextMessages: ChatMessage[]) {
    setSessions((current) =>
      current.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              title: titleFromMessages(nextMessages),
              messages: nextMessages,
              updatedAt: Date.now(),
            }
          : session,
      ),
    );
  }

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) {
      return;
    }

    setActiveView('trace');
    setInput('');
    setError(null);
    setLoading(true);
    setActivity([
      { label: 'Request received', description: 'User message queued in the dashboard.', status: 'complete' },
      { label: 'Backend API called', description: `${settings.apiBaseUrl}/api/chat/stream`, status: 'active' },
    ]);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    };
    const nextMessages = [...messages, userMessage];
    updateCurrentSession(nextMessages);

    try {
      const response = await streamChat(message, settings.apiBaseUrl, (step) => {
        setActivity((current) => [...current, step]);
      });
      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: response.answer,
      };
      updateCurrentSession([...nextMessages, agentMessage]);
      setActivity((current) => [
        ...current,
        { label: 'Response received', description: 'Backend returned an agent response.', status: 'complete' },
        { label: 'Request completed', description: 'Message saved to local chat history.', status: 'complete' },
      ]);
    } catch (requestError) {
      const text = requestError instanceof Error ? requestError.message : 'Agent request failed.';
      setError(text);
      setActivity((current) => [...current, { label: 'Request failed', description: text, status: 'error' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat() {
    const session = createSession();
    setSessions((current) => [session, ...current]);
    setCurrentSessionId(session.id);
    setInput('');
    setError(null);
    setActivity([]);
    setActiveView('chat');
  }

  function handleRestoreSession(sessionId: string) {
    setCurrentSessionId(sessionId);
    setInput('');
    setError(null);
    setActiveView('chat');
  }

  return (
    <div className="app-bg min-h-screen">
      <Header apiStatus={apiStatus} />

      <div className="grid h-[calc(100vh-4rem)] grid-cols-[240px_minmax(0,1fr)_320px]">
        <Sidebar
          activeView={activeView}
          sessions={sessions}
          currentSessionId={currentSessionId}
          settings={settings}
          tools={tools}
          activity={activity}
          toolsError={toolsError}
          onViewChange={setActiveView}
          onNewChat={handleNewChat}
          onRestoreSession={handleRestoreSession}
          onSettingsChange={setSettings}
        />
        <ChatConsole
          messages={messages}
          input={input}
          loading={loading}
          error={error}
          onInputChange={setInput}
          onSend={() => void handleSend()}
        />
        <RightPanel settings={settings} tools={tools} activity={activity} />
      </div>
    </div>
  );
}

export default App;
