import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { whatsappAccountsApi } from '@/services/api'
import type {
  WhatsappAccount,
  WhatsAppConnectionStatus,
  WhatsAppQRCodeData,
  WAHADiagnosticsResult,
  ConnectionStatus
} from '@/types/api'
import {
  Smartphone,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface AccountWithStatus extends WhatsappAccount {
  connectionStatus?: WhatsAppConnectionStatus
  qrData?: WhatsAppQRCodeData
  diagnostics?: WAHADiagnosticsResult
  isLoadingStatus?: boolean
  isLoadingQR?: boolean
  isLoadingDiagnostics?: boolean
  showDiagnostics?: boolean
}

function getStatusBadge(status: ConnectionStatus | string | undefined) {
  switch (status) {
    case 'connected':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>
    case 'needs_qr':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Aguardando QR</Badge>
    case 'connecting':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Conectando...</Badge>
    case 'disconnected':
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Desconectado</Badge>
    case 'failed':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Erro</Badge>
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Desconhecido</Badge>
  }
}

function getStatusIcon(status: ConnectionStatus | string | undefined) {
  switch (status) {
    case 'connected':
      return <Wifi className="h-5 w-5 text-green-400" />
    case 'needs_qr':
      return <QrCode className="h-5 w-5 text-yellow-400" />
    case 'connecting':
      return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
    case 'disconnected':
      return <WifiOff className="h-5 w-5 text-gray-400" />
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-400" />
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />
  }
}

export function WhatsAppAccounts() {
  const [accounts, setAccounts] = useState<AccountWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await whatsappAccountsApi.getAll()
      setAccounts(data.map(acc => ({ ...acc })))
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar contas:', err)
      setError('Falha ao carregar contas WhatsApp')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const fetchAccountStatus = async (accountId: string) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? { ...acc, isLoadingStatus: true } : acc
    ))

    try {
      const response = await whatsappAccountsApi.getStatus(accountId)
      if (response.success && response.data) {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            connectionStatus: response.data,
            isLoadingStatus: false
          } : acc
        ))
      }
    } catch (err) {
      console.error('Erro ao buscar status:', err)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, isLoadingStatus: false } : acc
      ))
    }
  }

  const fetchQRCode = async (accountId: string) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? { ...acc, isLoadingQR: true } : acc
    ))

    try {
      const response = await whatsappAccountsApi.getQRCode(accountId)
      if (response.success && response.data) {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            qrData: response.data,
            isLoadingQR: false
          } : acc
        ))
      } else {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            qrData: { qrAvailable: false, message: response.error },
            isLoadingQR: false
          } : acc
        ))
      }
    } catch (err) {
      console.error('Erro ao buscar QR:', err)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, isLoadingQR: false } : acc
      ))
    }
  }

  const runDiagnostics = async (accountId: string) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? { ...acc, isLoadingDiagnostics: true, showDiagnostics: true } : acc
    ))

    try {
      const response = await whatsappAccountsApi.getDiagnostics(accountId)
      if (response.success && response.data) {
        const diagnosticsData = response.data.diagnostics
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            diagnostics: diagnosticsData,
            isLoadingDiagnostics: false
          } : acc
        ))
      }
    } catch (err) {
      console.error('Erro ao executar diagnóstico:', err)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, isLoadingDiagnostics: false } : acc
      ))
    }
  }

  const connectAccount = async (accountId: string) => {
    try {
      const response = await whatsappAccountsApi.connect(accountId)
      if (response.success) {
        // Refresh status and QR
        await fetchAccountStatus(accountId)
        await fetchQRCode(accountId)
      }
    } catch (err) {
      console.error('Erro ao conectar:', err)
    }
  }

  const disconnectAccount = async (accountId: string) => {
    try {
      const response = await whatsappAccountsApi.disconnect(accountId)
      if (response.success) {
        await fetchAccountStatus(accountId)
      }
    } catch (err) {
      console.error('Erro ao desconectar:', err)
    }
  }

  const createAccount = async () => {
    if (!newAccountName.trim()) return

    setCreating(true)
    try {
      await whatsappAccountsApi.create({ name: newAccountName })
      setNewAccountName('')
      setShowCreateForm(false)
      await fetchAccounts()
    } catch (err) {
      console.error('Erro ao criar conta:', err)
    } finally {
      setCreating(false)
    }
  }

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta WhatsApp?')) return

    try {
      await whatsappAccountsApi.delete(accountId)
      await fetchAccounts()
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie suas conexões WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAccounts} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Nova Conta WhatsApp</CardTitle>
            <CardDescription>Adicione uma nova conexão WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da conta (ex: Vendas, Suporte)"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createAccount()}
              />
              <Button onClick={createAccount} disabled={creating || !newAccountName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma conta WhatsApp cadastrada.<br />
              Clique em "Nova Conta" para adicionar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {account.connectionStatus
                        ? getStatusIcon(account.connectionStatus.status)
                        : <Smartphone className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {account.connectionStatus?.phoneNumber && (
                          <span>+{account.connectionStatus.phoneNumber}</span>
                        )}
                        {account.connectionStatus?.pushName && (
                          <span>({account.connectionStatus.pushName})</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.connectionStatus && getStatusBadge(account.connectionStatus.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAccount(account.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAccountStatus(account.id)}
                    disabled={account.isLoadingStatus}
                  >
                    {account.isLoadingStatus
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <RefreshCw className="h-4 w-4 mr-2" />
                    }
                    Verificar Status
                  </Button>

                  {account.connectionStatus?.status !== 'connected' ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => connectAccount(account.id)}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  )}

                  {(account.connectionStatus?.status === 'needs_qr' ||
                    account.connectionStatus?.qrAvailable) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchQRCode(account.id)}
                      disabled={account.isLoadingQR}
                    >
                      {account.isLoadingQR
                        ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        : <QrCode className="h-4 w-4 mr-2" />
                      }
                      Gerar QR Code
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (account.showDiagnostics) {
                        setAccounts(prev => prev.map(acc =>
                          acc.id === account.id ? { ...acc, showDiagnostics: false } : acc
                        ))
                      } else {
                        runDiagnostics(account.id)
                      }
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Diagnóstico
                    {account.showDiagnostics
                      ? <ChevronUp className="h-4 w-4 ml-1" />
                      : <ChevronDown className="h-4 w-4 ml-1" />
                    }
                  </Button>
                </div>

                {/* QR Code Display */}
                {account.qrData?.qrAvailable && account.qrData.qrCode && (
                  <div className="border border-border/50 rounded-lg p-4 bg-white flex flex-col items-center">
                    <p className="text-gray-900 text-sm font-medium mb-2">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <img
                      src={account.qrData.qrCode.startsWith('data:')
                        ? account.qrData.qrCode
                        : `data:image/png;base64,${account.qrData.qrCode}`
                      }
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                    <p className="text-gray-500 text-xs mt-2">
                      O QR Code expira em alguns segundos. Clique em "Gerar QR Code" para atualizar.
                    </p>
                  </div>
                )}

                {account.qrData && !account.qrData.qrAvailable && account.qrData.message && (
                  <div className="border border-green-500/50 rounded-lg p-4 bg-green-500/10 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <p className="text-green-400">{account.qrData.message}</p>
                  </div>
                )}

                {/* Connection Error */}
                {account.connectionStatus?.error && (
                  <div className="border border-red-500/50 rounded-lg p-4 bg-red-500/10 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-red-400">{account.connectionStatus.error}</p>
                  </div>
                )}

                {/* Diagnostics Panel */}
                {account.showDiagnostics && (
                  <div className="border border-border/50 rounded-lg p-4 bg-background/50 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Diagnóstico da Conexão
                    </h4>

                    {account.isLoadingDiagnostics ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Executando diagnóstico...
                      </div>
                    ) : account.diagnostics ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {account.diagnostics.wahaReachable
                            ? <CheckCircle className="h-4 w-4 text-green-400" />
                            : <XCircle className="h-4 w-4 text-red-400" />
                          }
                          <span>WAHA {account.diagnostics.wahaReachable ? 'acessível' : 'não acessível'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {account.diagnostics.sessionExists
                            ? <CheckCircle className="h-4 w-4 text-green-400" />
                            : <XCircle className="h-4 w-4 text-red-400" />
                          }
                          <span>Sessão {account.diagnostics.sessionExists ? 'existe' : 'não existe'}</span>
                        </div>

                        {account.diagnostics.sessionStatus && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status WAHA:</span>
                            <Badge variant="outline">{account.diagnostics.sessionStatus}</Badge>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Status conexão:</span>
                          {getStatusBadge(account.diagnostics.connectionStatus)}
                        </div>

                        <div className="flex items-center gap-2">
                          {account.diagnostics.qrAvailable
                            ? <CheckCircle className="h-4 w-4 text-green-400" />
                            : <XCircle className="h-4 w-4 text-gray-400" />
                          }
                          <span>QR Code {account.diagnostics.qrAvailable ? 'disponível' : 'não disponível'}</span>
                        </div>

                        {account.diagnostics.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Telefone:</span>
                            <span>+{account.diagnostics.phoneNumber}</span>
                          </div>
                        )}

                        {account.diagnostics.pushName && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Nome:</span>
                            <span>{account.diagnostics.pushName}</span>
                          </div>
                        )}

                        {account.diagnostics.error && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>{account.diagnostics.error}</span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-2">
                          Verificado em: {new Date(account.diagnostics.checkedAt).toLocaleString('pt-BR')}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runDiagnostics(account.id)}
                          className="mt-2"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Executar Novamente
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Clique em "Diagnóstico" para verificar a conexão
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
