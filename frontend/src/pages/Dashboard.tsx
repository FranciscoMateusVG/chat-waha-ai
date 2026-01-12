import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import { Bell, MessageSquare, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

interface NotificationStats {
  total: number
  sent: number
  delivered: number
  failed: number
  pending: number
}

interface ChatHistory {
  id: string
  chatName: string
  status: string
  messageCount: number
  lastMessageAt?: string
}

export function Dashboard() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chatsRes] = await Promise.all([
          api.get('notifications/stats'),
          api.get('chat-history?limit=5'),
        ])

        if (statsRes.data.success) {
          setStats(statsRes.data.data)
        }

        if (chatsRes.data.success) {
          setRecentChats(chatsRes.data.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Total de Notificações',
      value: stats?.total ?? 0,
      icon: Bell,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Enviadas',
      value: stats?.sent ?? 0,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Entregues',
      value: stats?.delivered ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      title: 'Falhas',
      value: stats?.failed ?? 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
    },
    {
      title: 'Pendentes',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Chats */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Conversas Recentes</CardTitle>
          </div>
          <CardDescription>Últimas conversas do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {recentChats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma conversa encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{chat.chatName || 'Chat sem nome'}</p>
                      <p className="text-sm text-muted-foreground">
                        {chat.messageCount} mensagens
                      </p>
                    </div>
                  </div>
                  <Badge variant={chat.status === 'open' ? 'success' : 'secondary'}>
                    {chat.status === 'open' ? 'Aberto' : 'Fechado'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
