import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Bell,
  MessageCircle,
  Settings,
  MessageSquare,
} from "lucide-react";

const navigation = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Notificacoes", href: "/notifications", icon: Bell },
  { name: "Conversas", href: "/conversations", icon: MessageCircle },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="rounded-lg bg-primary/10 p-2">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Chat WAHA</span>
          <span className="text-xs text-muted-foreground">Programa Incluir</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Configuracoes
        </Link>
      </div>
    </div>
  );
}
