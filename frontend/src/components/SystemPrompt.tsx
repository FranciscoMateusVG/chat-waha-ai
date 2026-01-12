import { useState, useEffect } from 'react';
import { knowledgeApi } from '../services/api';
import type { SystemPrompt } from '../types/api';

export function SystemPromptEditor() {
  const [systemPrompt, setSystemPrompt] = useState<SystemPrompt | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadSystemPrompt = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await knowledgeApi.getSystemPrompt();
      if (response.success) {
        setSystemPrompt(response.data ?? null);
        setContent(response.data?.content || '');
      }
    } catch (err) {
      setError('Erro ao carregar system prompt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await knowledgeApi.saveSystemPrompt(content);
      if (response.success) {
        setSuccess('System prompt salvo com sucesso!');
        setIsEditing(false);
        loadSystemPrompt();
      } else {
        setError(response.error || 'Erro ao salvar');
      }
    } catch (err) {
      setError('Erro ao salvar system prompt');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir o system prompt?')) return;
    setSaving(true);
    try {
      const response = await knowledgeApi.deleteSystemPrompt();
      if (response.success) {
        setSystemPrompt(null);
        setContent('');
        setSuccess('System prompt excluído com sucesso!');
      }
    } catch (err) {
      setError('Erro ao excluir system prompt');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSystemPrompt();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  if (loading) {
    return <p className="loading">Carregando...</p>;
  }

  return (
    <div className="system-prompt">
      <h2>System Prompt</h2>
      <p className="description">
        Configure o prompt de sistema que define o comportamento do assistente de IA.
      </p>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {systemPrompt && !isEditing ? (
        <div className="prompt-view">
          <div className="prompt-content">
            <pre>{systemPrompt.content}</pre>
          </div>
          <p className="updated-at">
            Última atualização: {formatDate(systemPrompt.updatedAt)}
          </p>
          <div className="actions">
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Editar
            </button>
            <button onClick={handleDelete} disabled={saving} className="delete-btn">
              Excluir
            </button>
          </div>
        </div>
      ) : (
        <div className="prompt-editor">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder="Digite o system prompt aqui...

Exemplo:
Você é um assistente virtual amigável e prestativo.
Responda sempre em português brasileiro.
Seja conciso e objetivo nas respostas."
          />
          <div className="actions">
            {systemPrompt && (
              <button onClick={() => {
                setIsEditing(false);
                setContent(systemPrompt.content);
              }} className="cancel-btn">
                Cancelar
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !content.trim()} className="submit-btn">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
