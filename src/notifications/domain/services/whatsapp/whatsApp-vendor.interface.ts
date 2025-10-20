import { Notification } from '../../entities'

export interface WhatsappVendor {
  send(notification: Notification): Promise<void>
}
