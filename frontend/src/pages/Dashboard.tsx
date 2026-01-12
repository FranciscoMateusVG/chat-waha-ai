import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { whatsappAccountsApi } from '../services/api';
import type { WhatsappAccount } from '../types/api';
import { ChatHistoryList } from '../components/ChatHistory';
import { KnowledgeManager } from '../components/Knowledge';
import { SystemPromptEditor } from '../components/SystemPrompt';
import './Dashboard.css';

type Tab = 'accounts' | 'chats' | 'knowledge' | 'system-prompt';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'accounts') {
      loadAccounts();
    }
  }, [activeTab]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await whatsappAccountsApi.getAll();
      setAccounts(data);
      setError('');
    } catch {
      setError('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      console.error('Erro ao sair');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormStatus('pending');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (account: WhatsappAccount) => {
    setFormName(account.name);
    setFormPhone(account.phoneNumber || '');
    setFormStatus(account.status);
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingId) {
        await whatsappAccountsApi.update(editingId, {
          name: formName,
          phoneNumber: formPhone || undefined,
          status: formStatus
        });
      } else {
        await whatsappAccountsApi.create({
          name: formName,
          phoneNumber: formPhone || undefined
        });
      }
      resetForm();
      loadAccounts();
    } catch {
      setError('Erro ao salvar conta');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      await whatsappAccountsApi.delete(id);
      loadAccounts();
    } catch {
      setError('Erro ao excluir conta');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      default: return 'Pendente';
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Chat WAHA</h1>
        </div>
        <div className="header-right">
          <span className="user-info">
            {user?.name || user?.email}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'accounts' ? 'active' : ''}
          onClick={() => setActiveTab('accounts')}
        >
          Contas WhatsApp
        </button>
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

      <main className="dashboard-content">
        {activeTab === 'accounts' && (
          <div className="accounts-section">
            <div className="section-header">
              <h2>Contas WhatsApp</h2>
              <button className="add-btn" onClick={() => setShowForm(true)}>
                + Nova Conta
              </button>
            </div>

            {error && <div className="error">{error}</div>}

            {showForm && (
              <form className="account-form" onSubmit={handleSubmit}>
                <h3>{editingId ? 'Editar Conta' : 'Nova Conta'}</h3>
                <div className="form-group">
                  <label htmlFor="name">Nome</label>
                  <input
                    id="name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nome da conta"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Telefone</label>
                  <input
                    id="phone"
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                {editingId && (
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'pending' | 'active' | 'inactive')}
                    >
                      <option value="pending">Pendente</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancelar
                  </button>
                  <button type="submit" className="submit-btn" disabled={formLoading}>
                    {formLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading">Carregando...</div>
            ) : accounts.length === 0 ? (
              <div className="no-data">
                Nenhuma conta cadastrada. Clique em "Nova Conta" para adicionar.
              </div>
            ) : (
              <div className="accounts-list">
                {accounts.map((account) => (
                  <div key={account.id} className="account-item">
                    <div className="account-info">
                      <div className="account-name">{account.name}</div>
                      <div className="account-phone">{account.phoneNumber || 'Sem telefone'}</div>
                    </div>
                    <div className="account-status">
                      <span className={`status ${account.status}`}>
                        {getStatusLabel(account.status)}
                      </span>
                    </div>
                    <div className="account-actions">
                      <button className="edit-btn" onClick={() => handleEdit(account)}>
                        Editar
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(account.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && <ChatHistoryList />}
        {activeTab === 'knowledge' && <KnowledgeManager />}
        {activeTab === 'system-prompt' && <SystemPromptEditor />}
      </main>

      <footer className="dashboard-footer">
        <p>Chat WAHA - Sistema de Atendimento via WhatsApp</p>
      </footer>
    </div>
  );
}
