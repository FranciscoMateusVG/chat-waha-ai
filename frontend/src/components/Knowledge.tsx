import { useState, useEffect } from 'react';
import { knowledgeApi } from '../services/api';
import type { Knowledge, PaginationMeta, CreateKnowledgeDto } from '../types/api';

export function KnowledgeManager() {
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Knowledge[] | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [formData, setFormData] = useState<CreateKnowledgeDto>({
    type: '',
    topic: '',
    content: '',
    tags: []
  });
  const [tagsInput, setTagsInput] = useState('');

  const loadKnowledge = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await knowledgeApi.getAll(page, 10);
      if (response.success) {
        setKnowledgeList(response.data);
        setPagination(response.meta);
      }
    } catch (err) {
      setError('Erro ao carregar conhecimentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    try {
      const response = await knowledgeApi.search(searchQuery);
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conhecimento?')) return;
    try {
      const response = await knowledgeApi.delete(id);
      if (response.success) {
        loadKnowledge(currentPage);
        if (searchResults) {
          setSearchResults(searchResults.filter(k => k.id !== id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateForm = () => {
    setEditingKnowledge(null);
    setFormData({ type: '', topic: '', content: '', tags: [] });
    setTagsInput('');
    setShowForm(true);
  };

  const openEditForm = (knowledge: Knowledge) => {
    setEditingKnowledge(knowledge);
    setFormData({
      type: knowledge.type,
      topic: knowledge.topic,
      content: knowledge.content,
      tags: knowledge.tags || []
    });
    setTagsInput((knowledge.tags || []).join(', '));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const dto = { ...formData, tags };

    try {
      if (editingKnowledge) {
        await knowledgeApi.update(editingKnowledge.type, editingKnowledge.topic, {
          content: dto.content,
          tags: dto.tags
        });
      } else {
        await knowledgeApi.create(dto);
      }
      setShowForm(false);
      loadKnowledge(currentPage);
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar conhecimento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge(currentPage);
  }, [currentPage]);

  const displayList = searchResults || knowledgeList;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  if (showForm) {
    return (
      <div className="knowledge-form">
        <h2>{editingKnowledge ? 'Editar Conhecimento' : 'Novo Conhecimento'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo</label>
            <input
              type="text"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              disabled={!!editingKnowledge}
              required
              placeholder="Ex: Produto, FAQ, Procedimento"
            />
          </div>
          <div className="form-group">
            <label>Tópico</label>
            <input
              type="text"
              value={formData.topic}
              onChange={e => setFormData({ ...formData, topic: e.target.value })}
              disabled={!!editingKnowledge}
              required
              placeholder="Ex: Formas de Pagamento"
            />
          </div>
          <div className="form-group">
            <label>Conteúdo</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              placeholder="Descreva o conhecimento..."
            />
          </div>
          <div className="form-group">
            <label>Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Ex: pagamento, cartão, pix"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="knowledge-manager">
      <div className="knowledge-header">
        <h2>Base de Conhecimento</h2>
        <button onClick={openCreateForm} className="add-btn">
          + Novo Conhecimento
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar conhecimentos..."
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Buscar</button>
        {searchResults && (
          <button onClick={clearSearch} className="clear-btn">Limpar</button>
        )}
      </div>

      {loading && <p className="loading">Carregando...</p>}
      {error && <p className="error">{error}</p>}

      {searchResults && (
        <p className="search-info">
          {searchResults.length} resultado(s) encontrado(s)
        </p>
      )}

      {!loading && displayList.length === 0 && (
        <p className="no-data">Nenhum conhecimento encontrado</p>
      )}

      <div className="knowledge-list">
        {displayList.map((k) => (
          <div key={k.id} className="knowledge-item">
            <div className="knowledge-item-header">
              <span className="type">{k.type}</span>
              <span className="topic">{k.topic}</span>
            </div>
            <p className="content-preview">
              {k.content.length > 150 ? k.content.substring(0, 150) + '...' : k.content}
            </p>
            {k.tags && k.tags.length > 0 && (
              <div className="tags">
                {k.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="knowledge-item-footer">
              <span className="date">Atualizado: {formatDate(k.updatedAt)}</span>
              <div className="actions">
                <button onClick={() => openEditForm(k)} className="edit-btn">
                  Editar
                </button>
                <button onClick={() => handleDelete(k.id)} className="delete-btn">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!searchResults && pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPreviousPage}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
