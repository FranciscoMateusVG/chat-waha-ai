import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/notifications': 'Notificações',
  '/chats': 'Conversas',
  '/knowledge': 'Base de Conhecimento',
  '/ai-test': 'Teste de IA',
  '/settings': 'Configurações',
}

export function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Chat WAHA'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Sistema de Atendimento
        </span>
      </div>
    </header>
  )
}
