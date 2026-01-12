import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import { Send, MessageSquare, Loader2 } from 'lucide-react'

export function Notifications() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSend = async () => {
    if (!title || !body || !recipientId || !contactInfo) {
      setResult({ success: false, message: 'Preencha todos os campos' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await api.post('notifications/send', {
        title,
        body,
        recipientId,
        contactInfo,
        channel: 'whatsapp',
      })

      if (response.data.success) {
        setResult({ success: true, message: 'Notificação enviada com sucesso!' })
        setTitle('')
        setBody('')
        setRecipientId('')
        setContactInfo('')
      } else {
        setResult({ success: false, message: response.data.error || 'Erro ao enviar' })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar notificação'
      setResult({ success: false, message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Send Notification */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <CardTitle>Enviar Notificação</CardTitle>
          </div>
          <CardDescription>
            Envie uma notificação via WhatsApp para um destinatário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID do Destinatário</label>
              <Input
                placeholder="ex: user-123"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone (WhatsApp)</label>
              <Input
                placeholder="ex: +5531999999999"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              placeholder="Título da notificação"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem</label>
            <Textarea
              placeholder="Conteúdo da mensagem..."
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {result && (
            <div
              className={`rounded-lg p-3 ${
                result.success
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {result.message}
            </div>
          )}

          <Button onClick={handleSend} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar via WhatsApp
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Channel Info */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Canais Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="success">WhatsApp</Badge>
            <Badge variant="secondary">Sistema</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            As notificações são enviadas através do WAHA (WhatsApp HTTP API) conectado ao sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
