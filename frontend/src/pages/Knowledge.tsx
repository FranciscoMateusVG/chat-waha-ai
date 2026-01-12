import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/services/api'
import { BookOpen, Plus, Save, Loader2, FileText, Sparkles } from 'lucide-react'

interface KnowledgeEntry {
  id: string
  type: string
  topic: string
  content: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export function Knowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [promptSaved, setPromptSaved] = useState(false)

  // New entry form
  const [newType, setNewType] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [entriesRes, promptRes] = await Promise.all([
        api.get('knowledge/all?limit=20'),
        api.get('knowledge/system-prompt'),
      ])

      if (entriesRes.data.success) {
        setEntries(entriesRes.data.data || [])
      }

      if (promptRes.data.success && promptRes.data.data) {
        setSystemPrompt(promptRes.data.data.content || '')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSystemPrompt = async () => {
    setPromptLoading(true)
    try {
      await api.post('knowledge/system-prompt', { content: systemPrompt })
      setPromptSaved(true)
      setTimeout(() => setPromptSaved(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar system prompt:', error)
    } finally {
      setPromptLoading(false)
    }
  }

  const addEntry = async () => {
    if (!newType || !newTopic || !newContent) return

    setSaving(true)
    try {
      const response = await api.post('knowledge', {
        type: newType,
        topic: newTopic,
        content: newContent,
      })

      if (response.data.success) {
        setNewType('')
        setNewTopic('')
        setNewContent('')
        fetchData()
      }
    } catch (error) {
      console.error('Erro ao adicionar entrada:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>System Prompt</CardTitle>
          </div>
          <CardDescription>
            Defina o comportamento base da IA para todas as interações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite o system prompt da IA..."
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            {promptSaved && (
              <span className="text-sm text-green-400">Salvo com sucesso!</span>
            )}
            <Button onClick={saveSystemPrompt} disabled={promptLoading} className="ml-auto">
              {promptLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Add New Entry */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <CardTitle>Adicionar Conhecimento</CardTitle>
          </div>
          <CardDescription>
            Adicione novas informações à base de conhecimento da IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Input
                placeholder="ex: Informações do Produto"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tópico</label>
              <Input
                placeholder="ex: Formas de Pagamento"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo</label>
            <Textarea
              placeholder="Conteúdo do conhecimento..."
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <Button onClick={addEntry} disabled={saving || !newType || !newTopic || !newContent}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Adicionar
          </Button>
        </CardContent>
      </Card>

      {/* Knowledge Entries */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Base de Conhecimento</CardTitle>
          </div>
          <CardDescription>
            {entries.length} entradas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Nenhuma entrada encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border/50 bg-background/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.type}</Badge>
                        <span className="font-medium">{entry.topic}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
