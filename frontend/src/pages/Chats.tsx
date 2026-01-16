import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { chatHistoryApi } from '@/services/api'
import type { ChatHistory, ChatHistoryWithMessages, ChatMessage, PaginationMeta } from '@/types/api'
import { MessageSquare, RefreshCw, User, Clock, Users, X, Bot, UserCircle, Trash2, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Chats() {
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedChat, setSelectedChat] = useState<ChatHistoryWithMessages | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const fetchChats = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const response = await chatHistoryApi.getAll(pageNum, 10)
      if (response.success) {
        setChats(response.data || [])
        setMeta(response.meta)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChatDetails = async (chatId: string) => {
    setLoadingDetails(true)
    try {
      const response = await chatHistoryApi.getById(chatId)
      if (response.success && response.data) {
        setSelectedChat(response.data)
        setDialogOpen(true)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeChat = async (chatId: string) => {
    try {
      const response = await chatHistoryApi.close(chatId)
      if (response.success) {
        // Update local state
        setChats(chats.map(c =>
          c.id === chatId ? { ...c, status: 'closed' } : c
        ))
        if (selectedChat?.id === chatId) {
          setSelectedChat({ ...selectedChat, status: 'closed' })
        }
      }
    } catch (error) {
      console.error('Erro ao fechar conversa:', error)
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return
    try {
      const response = await chatHistoryApi.delete(chatId)
      if (response.success) {
        setChats(chats.filter(c => c.id !== chatId))
        if (selectedChat?.id === chatId) {
          setDialogOpen(false)
          setSelectedChat(null)
        }
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || sendingMessage) return
    setSendingMessage(true)
    try {
      const response = await chatHistoryApi.sendMessage(selectedChat.id, newMessage.trim())
      if (response.success) {
        setNewMessage('')
        // Refresh chat details to show new message
        await fetchChatDetails(selectedChat.id)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  useEffect(() => {
    fetchChats(page)
  }, [page])

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pt-BR')
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'user':
        return <UserCircle className="h-4 w-4" />
      case 'ai':
        return <Bot className="h-4 w-4" />
      case 'owner':
        return <User className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getSenderLabel = (sender: string) => {
    switch (sender) {
      case 'user':
        return 'Cliente'
      case 'ai':
        return 'IA'
      case 'owner':
        return 'Atendente'
      default:
        return sender
    }
  }

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case 'user':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'ai':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'owner':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historico de Conversas</h2>
          <p className="text-sm text-muted-foreground">
            {meta ? `${meta.totalItems} conversas encontradas` : 'Carregando...'}
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchChats(page)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Chat List */}
      <div className="space-y-3">
        {loading && chats.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Carregando conversas...</div>
            </CardContent>
          </Card>
        ) : chats.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Nenhuma conversa encontrada</p>
            </CardContent>
          </Card>
        ) : (
          chats.map((chat) => (
            <Card
              key={chat.id}
              className="border-border/50 bg-card/50 backdrop-blur transition-colors hover:bg-accent/30 cursor-pointer"
              onClick={() => fetchChatDetails(chat.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {chat.isGroupChat ? (
                        <Users className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {chat.chatName || 'Chat sem nome'}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {chat.externalChatId}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingDetails && (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <Badge variant={chat.status === 'open' ? 'default' : 'secondary'}>
                      {chat.status === 'open' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 text-sm md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mensagens:</span>
                    <span className="font-medium">{chat.messageCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Iniciado:</span>
                    <span className="font-medium">{formatDate(chat.openedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ultima msg:</span>
                    <span className="font-medium">{formatDate(chat.lastMessageAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPreviousPage || loading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {meta.currentPage} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
          >
            Proxima
          </Button>
        </div>
      )}

      {/* Chat Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {selectedChat?.isGroupChat ? (
                    <Users className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <DialogTitle>{selectedChat?.chatName || 'Chat sem nome'}</DialogTitle>
                  <DialogDescription>{selectedChat?.externalChatId}</DialogDescription>
                </div>
              </div>
              <Badge variant={selectedChat?.status === 'open' ? 'default' : 'secondary'}>
                {selectedChat?.status === 'open' ? 'Aberto' : 'Fechado'}
              </Badge>
            </div>
          </DialogHeader>

          {/* Chat Info */}
          <div className="flex flex-wrap gap-4 text-sm border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Mensagens:</span>
              <span className="font-medium">{selectedChat?.messageCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Iniciado:</span>
              <span className="font-medium">{formatDate(selectedChat?.openedAt)}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {selectedChat?.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedChat && closeChat(selectedChat.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Fechar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedChat && deleteChat(selectedChat.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {selectedChat?.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2" />
                  <p>Nenhuma mensagem nesta conversa</p>
                </div>
              ) : (
                selectedChat?.messages.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-1 rounded-lg border p-3 ${getSenderColor(message.sender)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {getSenderIcon(message.sender)}
                        {getSenderLabel(message.sender)}
                      </div>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          {selectedChat?.status === 'open' && (
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <Input
                placeholder="Digite uma mensagem como atendente..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sendingMessage}
              />
              <Button
                onClick={sendMessage}
                disabled={sendingMessage || !newMessage.trim()}
              >
                {sendingMessage ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
