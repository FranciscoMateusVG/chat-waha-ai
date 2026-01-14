import { useEffect, useState, useCallback, useRef } from 'react'
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
  ChevronUp,
  Clock
} from 'lucide-react'

// Connection flow states for state machine
type ConnectionFlowState =
  | 'idle'           // Initial state, not connected
  | 'starting'       // Session is being created/started
  | 'awaiting_qr'    // QR code displayed, waiting for scan
  | 'connecting'     // QR scanned, WAHA connecting to WhatsApp
  | 'connected'      // Successfully connected
  | 'timeout'        // Connection took too long
  | 'error'          // Error occurred

interface AccountWithStatus extends WhatsappAccount {
  connectionStatus?: WhatsAppConnectionStatus
  qrData?: WhatsAppQRCodeData
  diagnostics?: WAHADiagnosticsResult
  isLoadingStatus?: boolean
  isLoadingQR?: boolean
  isLoadingDiagnostics?: boolean
  showDiagnostics?: boolean
  // State machine fields
  flowState: ConnectionFlowState
  flowStartedAt?: number // Timestamp when flow started (for timeout)
  justConnected?: boolean // Flag for showing success animation
}

const POLLING_INTERVAL = 3000 // 3 seconds
const CONNECTION_TIMEOUT = 30000 // 30 seconds

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

function getFlowStateIcon(flowState: ConnectionFlowState) {
  switch (flowState) {
    case 'connected':
      return <CheckCircle className="h-5 w-5 text-green-400" />
    case 'awaiting_qr':
      return <QrCode className="h-5 w-5 text-yellow-400" />
    case 'starting':
    case 'connecting':
      return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
    case 'timeout':
      return <Clock className="h-5 w-5 text-orange-400" />
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-400" />
    default:
      return <Smartphone className="h-5 w-5 text-primary" />
  }
}

export function WhatsAppAccounts() {
  const [accounts, setAccounts] = useState<AccountWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [creating, setCreating] = useState(false)

  // Polling refs
  const pollingRef = useRef<{ [accountId: string]: ReturnType<typeof setInterval> }>({})
  const timeoutRef = useRef<{ [accountId: string]: ReturnType<typeof setTimeout> }>({})

  // Derive flow state from connection status
  const deriveFlowState = (status?: WhatsAppConnectionStatus): ConnectionFlowState => {
    if (!status) return 'idle'
    switch (status.status) {
      case 'connected': return 'connected'
      case 'needs_qr': return 'awaiting_qr'
      case 'connecting': return 'connecting'
      case 'failed': return 'error'
      case 'disconnected': return 'idle'
      default: return 'idle'
    }
  }

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await whatsappAccountsApi.getAll()
      setAccounts(data.map(acc => ({
        ...acc,
        flowState: 'idle' as ConnectionFlowState
      })))
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach(interval => clearInterval(interval))
      Object.values(timeoutRef.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  // Start polling for a specific account
  const startPolling = useCallback((accountId: string) => {
    // Don't start if already polling
    if (pollingRef.current[accountId]) return

    console.log(`[Polling] Starting for account ${accountId}`)

    pollingRef.current[accountId] = setInterval(async () => {
      try {
        const response = await whatsappAccountsApi.getStatus(accountId)
        if (response.success && response.data) {
          const newFlowState = deriveFlowState(response.data)

          setAccounts(prev => prev.map(acc => {
            if (acc.id !== accountId) return acc

            const wasNotConnected = acc.flowState !== 'connected'
            const isNowConnected = newFlowState === 'connected'

            // If just connected, stop polling and show success
            if (wasNotConnected && isNowConnected) {
              console.log(`[Polling] Account ${accountId} connected! Stopping polling.`)
              stopPolling(accountId)
              stopTimeout(accountId)
              return {
                ...acc,
                connectionStatus: response.data!,
                flowState: 'connected',
                qrData: undefined, // Clear QR data
                justConnected: true
              }
            }

            // If status changed from needs_qr to connecting (QR was scanned)
            if (acc.flowState === 'awaiting_qr' && response.data!.status === 'connecting') {
              return {
                ...acc,
                connectionStatus: response.data!,
                flowState: 'connecting',
                qrData: undefined // Clear QR, show connecting state
              }
            }

            return {
              ...acc,
              connectionStatus: response.data!,
              flowState: newFlowState
            }
          }))
        }
      } catch (err) {
        console.error(`[Polling] Error for account ${accountId}:`, err)
      }
    }, POLLING_INTERVAL)
  }, [])

  // Stop polling for a specific account
  const stopPolling = useCallback((accountId: string) => {
    if (pollingRef.current[accountId]) {
      console.log(`[Polling] Stopping for account ${accountId}`)
      clearInterval(pollingRef.current[accountId])
      delete pollingRef.current[accountId]
    }
  }, [])

  // Start timeout for connection
  const startTimeout = useCallback((accountId: string) => {
    // Don't start if already has timeout
    if (timeoutRef.current[accountId]) return

    console.log(`[Timeout] Starting for account ${accountId}`)

    timeoutRef.current[accountId] = setTimeout(() => {
      console.log(`[Timeout] Triggered for account ${accountId}`)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId && acc.flowState !== 'connected'
          ? { ...acc, flowState: 'timeout' }
          : acc
      ))
    }, CONNECTION_TIMEOUT)
  }, [])

  // Stop timeout for a specific account
  const stopTimeout = useCallback((accountId: string) => {
    if (timeoutRef.current[accountId]) {
      console.log(`[Timeout] Stopping for account ${accountId}`)
      clearTimeout(timeoutRef.current[accountId])
      delete timeoutRef.current[accountId]
    }
  }, [])

  const fetchAccountStatus = async (accountId: string) => {
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? { ...acc, isLoadingStatus: true } : acc
    ))

    try {
      const response = await whatsappAccountsApi.getStatus(accountId)
      if (response.success && response.data) {
        const newFlowState = deriveFlowState(response.data)
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            connectionStatus: response.data!,
            flowState: newFlowState,
            isLoadingStatus: false,
            // Clear timeout state if we got a valid status
            ...(newFlowState === 'connected' ? { justConnected: false } : {})
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
      acc.id === accountId ? {
        ...acc,
        isLoadingQR: true,
        flowState: 'starting',
        flowStartedAt: Date.now()
      } : acc
    ))

    try {
      const response = await whatsappAccountsApi.getQRCode(accountId)
      if (response.success && response.data) {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            qrData: response.data,
            flowState: response.data!.qrAvailable ? 'awaiting_qr' : acc.flowState,
            isLoadingQR: false
          } : acc
        ))

        // Start polling and timeout when QR is displayed
        if (response.data.qrAvailable) {
          startPolling(accountId)
          startTimeout(accountId)
        }
      } else {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            qrData: { qrAvailable: false, message: response.error },
            isLoadingQR: false,
            flowState: 'error'
          } : acc
        ))
      }
    } catch (err) {
      console.error('Erro ao buscar QR:', err)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? {
          ...acc,
          isLoadingQR: false,
          flowState: 'error'
        } : acc
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
    // Optimistic UI: immediately show starting state
    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? {
        ...acc,
        flowState: 'starting',
        flowStartedAt: Date.now()
      } : acc
    ))

    try {
      const response = await whatsappAccountsApi.connect(accountId)
      if (response.success) {
        // Refresh status and fetch QR
        await fetchAccountStatus(accountId)
        await fetchQRCode(accountId)
      }
    } catch (err) {
      console.error('Erro ao conectar:', err)
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, flowState: 'error' } : acc
      ))
    }
  }

  const disconnectAccount = async (accountId: string) => {
    // Stop any active polling/timeout
    stopPolling(accountId)
    stopTimeout(accountId)

    try {
      const response = await whatsappAccountsApi.disconnect(accountId)
      if (response.success) {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? {
            ...acc,
            flowState: 'idle',
            connectionStatus: undefined,
            qrData: undefined,
            justConnected: false
          } : acc
        ))
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

    // Stop any active polling/timeout
    stopPolling(accountId)
    stopTimeout(accountId)

    try {
      await whatsappAccountsApi.delete(accountId)
      await fetchAccounts()
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
    }
  }

  // Clear justConnected flag after animation
  const clearJustConnected = (accountId: string) => {
    setTimeout(() => {
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, justConnected: false } : acc
      ))
    }, 5000) // Clear after 5 seconds
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
          {accounts.map((account) => {
            // Trigger justConnected effect
            if (account.justConnected) {
              clearJustConnected(account.id)
            }

            return (
            <Card key={account.id} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {getFlowStateIcon(account.flowState)}
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
                {/* Success Banner - shown when just connected */}
                {account.justConnected && (
                  <div className="border border-green-500/50 rounded-lg p-4 bg-green-500/10 flex items-center gap-3 animate-pulse">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <div>
                      <p className="text-green-400 font-medium text-lg">WhatsApp conectado com sucesso!</p>
                      {account.connectionStatus?.phoneNumber && (
                        <p className="text-green-400/80 text-sm">
                          Telefone: +{account.connectionStatus.phoneNumber}
                          {account.connectionStatus.pushName && ` (${account.connectionStatus.pushName})`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

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

                  {account.flowState !== 'connected' && account.flowState !== 'connecting' && account.flowState !== 'awaiting_qr' && account.flowState !== 'starting' ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => connectAccount(account.id)}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  ) : account.flowState === 'connected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                  ) : null}

                  {(account.flowState === 'awaiting_qr' || account.flowState === 'timeout' ||
                    account.connectionStatus?.status === 'needs_qr') && (
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
                      {account.flowState === 'timeout' ? 'Gerar Novo QR Code' : 'Gerar QR Code'}
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

                {/* Starting State */}
                {account.flowState === 'starting' && (
                  <div className="border border-blue-500/50 rounded-lg p-4 bg-blue-500/10 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    <p className="text-blue-400">Iniciando sessão...</p>
                  </div>
                )}

                {/* QR Code Display */}
                {account.flowState === 'awaiting_qr' && account.qrData?.qrAvailable && account.qrData.qrCode && (
                  <div className="border border-border/50 rounded-lg p-4 bg-white flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      <p className="text-gray-900 text-sm font-medium">
                        Aguardando leitura do QR Code...
                      </p>
                    </div>
                    <img
                      src={account.qrData.qrCode.startsWith('data:')
                        ? account.qrData.qrCode
                        : `data:${account.qrData.mimetype || 'image/png'};base64,${account.qrData.qrCode}`
                      }
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                    <p className="text-blue-600 text-xs mt-3 flex items-center gap-1">
                      <span>Verificando conexão automaticamente...</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      O QR Code expira em alguns segundos. Clique em "Gerar QR Code" para atualizar.
                    </p>
                  </div>
                )}

                {/* Connecting State - after QR scan */}
                {account.flowState === 'connecting' && (
                  <div className="border border-blue-500/50 rounded-lg p-4 bg-blue-500/10 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    <div>
                      <p className="text-blue-400 font-medium">Conectando...</p>
                      <p className="text-blue-400/80 text-sm">O WhatsApp está sendo autenticado. Aguarde alguns segundos.</p>
                    </div>
                  </div>
                )}

                {/* Timeout State */}
                {account.flowState === 'timeout' && (
                  <div className="border border-orange-500/50 rounded-lg p-4 bg-orange-500/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-orange-400" />
                      <p className="text-orange-400 font-medium">A conexão está demorando mais que o esperado</p>
                    </div>
                    <p className="text-orange-400/80 text-sm mb-3">
                      Isso pode acontecer se o QR Code expirou ou houve um problema na leitura.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchQRCode(account.id)}
                        disabled={account.isLoadingQR}
                        className="text-orange-400 border-orange-400/50 hover:bg-orange-400/10"
                      >
                        {account.isLoadingQR
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : <QrCode className="h-4 w-4 mr-2" />
                        }
                        Gerar Novo QR Code
                      </Button>
                      <Button
                        variant="ghost"
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
                    </div>
                  </div>
                )}

                {/* Connected State (when not justConnected) */}
                {account.flowState === 'connected' && !account.justConnected && account.connectionStatus && (
                  <div className="border border-green-500/50 rounded-lg p-4 bg-green-500/10 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-medium">WhatsApp conectado</p>
                      {account.connectionStatus.phoneNumber && (
                        <p className="text-green-400/80 text-sm">
                          Telefone: +{account.connectionStatus.phoneNumber}
                          {account.connectionStatus.pushName && ` (${account.connectionStatus.pushName})`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Not Available Message */}
                {account.qrData && !account.qrData.qrAvailable && account.qrData.message && account.flowState !== 'connected' && (
                  <div className="border border-yellow-500/50 rounded-lg p-4 bg-yellow-500/10 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <p className="text-yellow-400">{account.qrData.message}</p>
                  </div>
                )}

                {/* Connection Error */}
                {account.flowState === 'error' && account.connectionStatus?.error && (
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
          )})}
        </div>
      )}
    </div>
  )
}
