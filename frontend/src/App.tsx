import { useState, useEffect } from 'react';
import './App.css';
import { ChatHistoryList } from './components/ChatHistory';
import { KnowledgeManager } from './components/Knowledge';
import { SystemPromptEditor } from './components/SystemPrompt';
import { notificationsApi } from './services/api';

type Tab = 'chats' | 'knowledge' | 'system-prompt';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await notificationsApi.healthCheck();
        setApiStatus(response.success ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    checkApi();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chat WAHA - Painel de Administração</h1>
        <div className={`api-status ${apiStatus}`}>
          API: {apiStatus === 'checking' ? 'Verificando...' : apiStatus === 'online' ? 'Online' : 'Offline'}
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'chats' ? 'active' : ''}
          onClick={() => setActiveTab('chats')}
        >
          Conversas
        </button>
        <button
          className={activeTab === 'knowledge' ? 'active' : ''}
          onClick={() => setActiveTab('knowledge')}
        >
          Conhecimento
        </button>
        <button
          className={activeTab === 'system-prompt' ? 'active' : ''}
          onClick={() => setActiveTab('system-prompt')}
        >
          System Prompt
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'chats' && <ChatHistoryList />}
        {activeTab === 'knowledge' && <KnowledgeManager />}
        {activeTab === 'system-prompt' && <SystemPromptEditor />}
      </main>

      <footer className="app-footer">
        <p>Chat WAHA - Sistema de Atendimento via WhatsApp</p>
      </footer>
    </div>
  );
}

export default App;
