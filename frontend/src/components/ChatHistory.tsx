import { useState, useEffect } from 'react';
import { chatHistoryApi } from '../services/api';
import type { ChatHistory, ChatHistoryWithMessages, PaginationMeta } from '../types/api';

export function ChatHistoryList() {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatHistoryWithMessages | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatHistoryApi.getAll(page, 10);
      if (response.success) {
        setChats(response.data);
        setPagination(response.meta);
      } else {
        setError('Falha ao carregar conversas');
      }
    } catch (err) {
      setError('Erro ao conectar com a API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChatDetails = async (id: string) => {
    setLoading(true);
    try {
      const response = await chatHistoryApi.getById(id);
      if (response.success && response.data) {
        setSelectedChat(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const closeChat = async (id: string) => {
    try {
      const response = await chatHistoryApi.close(id);
      if (response.success) {
        loadChats(currentPage);
        if (selectedChat?.id === id) {
          setSelectedChat(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadChats(currentPage);
  }, [currentPage]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  if (selectedChat) {
    return (
      <div className="chat-detail">
        <button onClick={() => setSelectedChat(null)} className="back-btn">
          Voltar
        </button>
        <div className="chat-header">
          <h2>{selectedChat.chatName}</h2>
          <span className={`status ${selectedChat.status}`}>
            {selectedChat.status === 'open' ? 'Aberto' : 'Fechado'}
          </span>
        </div>
        <div className="chat-info">
          <p><strong>ID Externo:</strong> {selectedChat.externalChatId}</p>
          <p><strong>Aberto em:</strong> {formatDate(selectedChat.openedAt)}</p>
          <p><strong>Mensagens:</strong> {selectedChat.messageCount}</p>
          {selectedChat.status === 'open' && (
            <button onClick={() => closeChat(selectedChat.id)} className="close-chat-btn">
              Fechar Conversa
            </button>
          )}
        </div>
        <div className="messages-list">
          <h3>Mensagens</h3>
          {selectedChat.messages.length === 0 ? (
            <p className="no-messages">Nenhuma mensagem</p>
          ) : (
            selectedChat.messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-header">
                  <span className="sender">{msg.sender === 'user' ? 'Usuário' : 'Assistente'}</span>
                  <span className="timestamp">{formatDate(msg.timestamp)}</span>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-history">
      <h2>Histórico de Conversas</h2>

      {loading && <p className="loading">Carregando...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && chats.length === 0 && (
        <p className="no-data">Nenhuma conversa encontrada</p>
      )}

      <div className="chat-list">
        {chats.map((chat) => (
          <div key={chat.id} className="chat-item" onClick={() => loadChatDetails(chat.id)}>
            <div className="chat-item-header">
              <span className="chat-name">{chat.chatName}</span>
              <span className={`status ${chat.status}`}>
                {chat.status === 'open' ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            <div className="chat-item-info">
              <span>{chat.messageCount} mensagens</span>
              <span>{chat.isGroupChat ? 'Grupo' : 'Individual'}</span>
              <span>{formatDate(chat.lastMessageAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
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
