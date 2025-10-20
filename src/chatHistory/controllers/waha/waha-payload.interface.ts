export interface WAHAWebhookPayload {
  event: string // 'message' | 'message.any' | etc
  session: string // Session name
  engine: string // 'WEBJS' | 'NOWEB'
  payload: {
    id: string
    timestamp: number
    from: string // '5531999999999@c.us'
    fromMe: boolean
    to: string
    body: string
    hasMedia: boolean
    ack?: number
    _data?: {
      id: {
        fromMe: boolean
        remote: string
        id: string
      }
      body: string
      type: string
      timestamp: number
      notifyName?: string
    }
  }
}

export interface WAHAChatInfo {
  id: string // '5531999999999@c.us'
  name?: string
  isGroup: boolean
}
