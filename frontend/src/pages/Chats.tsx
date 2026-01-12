import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import { MessageSquare, RefreshCw, User, Clock } from 'lucide-react'

interface ChatHistory {
  id: string
  externalChatId: string
  chatName: string
  status: 'open' | 'closed'
  messageCount: number
  openedAt: string
  lastMessageAt?: string
  closedAt?: string
  isGroupChat: boolean
}

interface PaginationMeta {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function Chats() {
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchChats = async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const response = await api.get(`chat-history?page=${pageNum}&limit=10`)
      if (response.data.success) {
        setChats(response.data.data || [])
        setMeta(response.data.meta)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChats(page)
  }, [page])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Histórico de Conversas</h2>
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
              className="border-border/50 bg-card/50 backdrop-blur transition-colors hover:bg-accent/30"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {chat.isGroupChat ? (
                        <User className="h-5 w-5 text-primary" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-primary" />
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
                  <Badge variant={chat.status === 'open' ? 'success' : 'secondary'}>
                    {chat.status === 'open' ? 'Aberto' : 'Fechado'}
                  </Badge>
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
                    <span className="text-muted-foreground">Última msg:</span>
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
            Página {meta.currentPage} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
