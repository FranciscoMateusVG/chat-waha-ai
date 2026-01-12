import { Suspense } from "react";
import { Bell, Mail, MessageSquareText, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn } from "@/lib/utils/cn";

type NotificationChannel = "email" | "whatsapp" | "system";
type NotificationStatus = "sent" | "failed" | "pending";

interface Notification {
  id: string;
  recipient: string;
  channel: NotificationChannel;
  subject: string;
  status: NotificationStatus;
  sentAt: string;
}

async function getNotificationStats() {
  // TODO: Fetch from backend /notifications/stats
  return {
    total: 1247,
    sent: 1189,
    failed: 23,
    pending: 35,
    byChannel: {
      email: 542,
      whatsapp: 678,
      system: 27,
    },
  };
}

async function getRecentNotifications(): Promise<Notification[]> {
  // TODO: Fetch from backend /notifications/history
  return [
    {
      id: "1",
      recipient: "maria.silva@email.com",
      channel: "email",
      subject: "Confirmacao de matricula",
      status: "sent",
      sentAt: "2025-01-12T10:30:00",
    },
    {
      id: "2",
      recipient: "+55 11 98765-4321",
      channel: "whatsapp",
      subject: "Lembrete de documentacao",
      status: "sent",
      sentAt: "2025-01-12T09:15:00",
    },
    {
      id: "3",
      recipient: "joao.santos@email.com",
      channel: "email",
      subject: "Atualizacao de status",
      status: "failed",
      sentAt: "2025-01-12T08:45:00",
    },
    {
      id: "4",
      recipient: "+55 21 99876-5432",
      channel: "whatsapp",
      subject: "Bem-vindo ao Programa Incluir",
      status: "pending",
      sentAt: "2025-01-12T08:30:00",
    },
    {
      id: "5",
      recipient: "ana.oliveira@email.com",
      channel: "email",
      subject: "Documentos recebidos",
      status: "sent",
      sentAt: "2025-01-11T16:20:00",
    },
  ];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChannelIcon({ channel }: { channel: NotificationChannel }) {
  switch (channel) {
    case "email":
      return <Mail className="h-4 w-4" />;
    case "whatsapp":
      return <MessageSquareText className="h-4 w-4" />;
    case "system":
      return <Bell className="h-4 w-4" />;
  }
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  const config = {
    sent: {
      label: "Enviado",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700",
    },
    failed: {
      label: "Falhou",
      icon: XCircle,
      className: "bg-red-100 text-red-700",
    },
    pending: {
      label: "Pendente",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-700",
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

async function StatsSection() {
  const stats = await getNotificationStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Enviadas"
        value={stats.total.toLocaleString("pt-BR")}
        description="este mes"
        icon={Send}
      />
      <StatCard
        title="Via E-mail"
        value={stats.byChannel.email.toLocaleString("pt-BR")}
        icon={Mail}
      />
      <StatCard
        title="Via WhatsApp"
        value={stats.byChannel.whatsapp.toLocaleString("pt-BR")}
        icon={MessageSquareText}
      />
      <StatCard
        title="Taxa de Sucesso"
        value={`${((stats.sent / stats.total) * 100).toFixed(1)}%`}
        description={`${stats.failed} falhas`}
        icon={CheckCircle2}
      />
    </div>
  );
}

async function NotificationsTable() {
  const notifications = await getRecentNotifications();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notificacoes Recentes</CardTitle>
          <CardDescription>
            Historico das ultimas notificacoes enviadas
          </CardDescription>
        </div>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          Nova Notificacao
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Destinatario</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Assunto</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {notification.recipient}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ChannelIcon channel={notification.channel} />
                      <span className="capitalize">{notification.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{notification.subject}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={notification.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(notification.sentAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notificacoes</h1>
        <p className="text-muted-foreground">
          Gerencie e acompanhe o envio de notificacoes
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
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        }
      >
        <NotificationsTable />
      </Suspense>
    </div>
  );
}
