import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'
import { Bot, Send, Loader2, User, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AITest() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || loading) return

    const userMessage: Message = { role: 'user', content: message }
    setConversation((prev) => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const response = await api.post('ai/test/generate-simple', {
        message: message,
      })

      if (response.data.success && response.data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.response,
        }
        setConversation((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        }
        setConversation((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Erro de conexão com a API.',
      }
      setConversation((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const clearConversation = () => {
    setConversation([])
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Teste de IA</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={clearConversation}>
              Limpar conversa
            </Button>
          </div>
          <CardDescription>
            Teste as respostas da IA usando a base de conhecimento configurada
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Chat Area */}
      <Card className="flex flex-1 flex-col border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="flex flex-1 flex-col p-4">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-auto pb-4">
            {conversation.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Bot className="h-16 w-16 opacity-50" />
                <p className="mt-4 text-center">
                  Envie uma mensagem para testar a IA
                </p>
                <p className="text-sm opacity-70">
                  A resposta será baseada na base de conhecimento e system prompt configurados
                </p>
              </div>
            ) : (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-muted px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              size="icon"
              className="h-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
