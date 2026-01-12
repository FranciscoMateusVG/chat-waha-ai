import { Suspense } from "react";
import { Bell, MessageCircle, Users, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getStats() {
  // TODO: Fetch real stats from the backend API
  // For now, returning mock data
  return {
    totalNotifications: 1247,
    activeConversations: 23,
    usersReached: 856,
    responseRate: 94.2,
  };
}

async function getRecentActivity() {
  // TODO: Fetch real activity from backend
  return [
    {
      id: "1",
      type: "notification",
      message: "Notificacao enviada para 15 usuarios",
      time: "Ha 5 minutos",
    },
    {
      id: "2",
      type: "conversation",
      message: "Nova mensagem de +55 11 98765-4321",
      time: "Ha 12 minutos",
    },
    {
      id: "3",
      type: "notification",
      message: "Lote de e-mails processado com sucesso",
      time: "Ha 1 hora",
    },
    {
      id: "4",
      type: "conversation",
      message: "Conversa encerrada automaticamente",
      time: "Ha 2 horas",
    },
  ];
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function StatsSection() {
  const stats = await getStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Notificacoes"
        value={stats.totalNotifications.toLocaleString("pt-BR")}
        description="este mes"
        icon={Bell}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Conversas Ativas"
        value={stats.activeConversations}
        description="aguardando resposta"
        icon={MessageCircle}
      />
      <StatCard
        title="Usuarios Alcancados"
        value={stats.usersReached.toLocaleString("pt-BR")}
        description="nos ultimos 30 dias"
        icon={Users}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Taxa de Resposta"
        value={`${stats.responseRate}%`}
        description="tempo medio: 2.4h"
        icon={CheckCircle}
        trend={{ value: 3, isPositive: true }}
      />
    </div>
  );
}

async function RecentActivitySection() {
  const activity = await getRecentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          Ultimas acoes realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 text-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                {item.type === "notification" ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-foreground">{item.message}</p>
                <p className="text-muted-foreground text-xs">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">
          Visao geral do sistema de notificacoes e mensagens
        </p>
      </div>

      <Suspense fallback={<StatsLoading />}>
        <StatsSection />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <RecentActivitySection />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
            <CardDescription>
              Atalhos para tarefas comuns
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a
              href="/notifications?action=send"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"
            >
              <Bell className="h-4 w-4 text-primary" />
              <span>Enviar nova notificacao</span>
            </a>
            <a
              href="/conversations"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              <span>Ver conversas pendentes</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
