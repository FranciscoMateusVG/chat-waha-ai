import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  BookOpen,
  Bot,
  Settings,
  MessageCircle,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Notificações', href: '/notifications', icon: Bell },
  { name: 'Conversas', href: '/chats', icon: MessageSquare },
  { name: 'Base de Conhecimento', href: '/knowledge', icon: BookOpen },
  { name: 'Teste de IA', href: '/ai-test', icon: Bot },
  { name: 'Contas WhatsApp', href: '/whatsapp', icon: Smartphone },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">Chat WAHA</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )
          }
        >
          <Settings className="h-5 w-5" />
          Configurações
        </NavLink>
      </div>
    </aside>
  )
}
