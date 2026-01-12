import { Suspense } from "react";
import { MessageCircle, Clock, CheckCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn } from "@/lib/utils/cn";

type ConversationStatus = "active" | "waiting" | "closed";

interface Conversation {
  id: string;
  contact: string;
  phone: string;
  lastMessage: string;
  status: ConversationStatus;
  unreadCount: number;
  lastActivity: string;
}

async function getConversationStats() {
  // TODO: Fetch from backend
  return {
    total: 156,
    active: 23,
    waiting: 12,
    avgResponseTime: "2.4h",
  };
}

async function getConversations(): Promise<Conversation[]> {
  // TODO: Fetch from backend /chat-history
  return [
    {
      id: "1",
      contact: "Maria Silva",
      phone: "+55 11 98765-4321",
      lastMessage: "Obrigada pela informacao! Vou providenciar os documentos.",
      status: "active",
      unreadCount: 2,
      lastActivity: "2025-01-12T10:45:00",
    },
    {
      id: "2",
      contact: "Joao Santos",
      phone: "+55 21 99876-5432",
      lastMessage: "Qual o prazo para entrega da documentacao?",
      status: "waiting",
      unreadCount: 1,
      lastActivity: "2025-01-12T09:30:00",
    },
    {
      id: "3",
      contact: "Ana Oliveira",
      phone: "+55 31 97654-3210",
      lastMessage: "Perfeito, muito obrigada pelo atendimento.",
      status: "closed",
      unreadCount: 0,
      lastActivity: "2025-01-11T16:20:00",
    },
    {
      id: "4",
      contact: "Carlos Ferreira",
      phone: "+55 41 96543-2109",
      lastMessage: "Bom dia, gostaria de saber sobre o programa de inclusao.",
      status: "waiting",
      unreadCount: 3,
      lastActivity: "2025-01-12T08:15:00",
    },
    {
      id: "5",
      contact: "Patricia Lima",
      phone: "+55 51 95432-1098",
      lastMessage: "Ja enviei todos os documentos solicitados.",
      status: "active",
      unreadCount: 0,
      lastActivity: "2025-01-12T11:00:00",
    },
  ];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `Ha ${diffMins}min`;
  if (diffHours < 24) return `Ha ${diffHours}h`;
  return `Ha ${diffDays}d`;
}

function StatusIndicator({ status }: { status: ConversationStatus }) {
  const config = {
    active: {
      label: "Ativa",
      className: "bg-green-500",
    },
    waiting: {
      label: "Aguardando",
      className: "bg-yellow-500",
    },
    closed: {
      label: "Encerrada",
      className: "bg-gray-400",
    },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", config.className)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}

async function StatsSection() {
  const stats = await getConversationStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Conversas"
        value={stats.total}
        description="este mes"
        icon={MessageCircle}
      />
      <StatCard
        title="Conversas Ativas"
        value={stats.active}
        description="em andamento"
        icon={CheckCheck}
      />
      <StatCard
        title="Aguardando Resposta"
        value={stats.waiting}
        description="necessitam atencao"
        icon={AlertCircle}
      />
      <StatCard
        title="Tempo Medio"
        value={stats.avgResponseTime}
        description="de resposta"
        icon={Clock}
      />
    </div>
  );
}

async function ConversationsList() {
  const conversations = await getConversations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversas</CardTitle>
        <CardDescription>
          Lista de todas as conversas via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                conversation.unreadCount > 0 && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">
                  {conversation.contact
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{conversation.contact}</h4>
                    {conversation.unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(conversation.lastActivity)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {conversation.phone}
                </p>
                <p className="text-sm text-foreground/80 truncate mt-1">
                  {conversation.lastMessage}
                </p>
                <div className="mt-2">
                  <StatusIndicator status={conversation.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversas</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie as conversas via WhatsApp
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <StatsSection />
      </Suspense>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        }
      >
        <ConversationsList />
      </Suspense>
    </div>
  );
}
