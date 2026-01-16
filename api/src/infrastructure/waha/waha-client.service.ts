import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Notification } from 'src/notifications/domain'
import { WhatsappVendor } from 'src/notifications/domain/services/whatsapp/whatsApp-vendor.interface'
import { WhatsappContactInfo } from 'src/notifications/domain/value-objects/whatsapp-contact-info.vo'

interface WAHAResponse {
  id: string
  timestamp: number
  from: string
  to: string
  body: string
}

interface SendTextMessageDto {
  chatId: string
  text: string
  session?: string
}

@Injectable()
export class WhatsAppClientService implements WhatsappVendor {
  private readonly logger = new Logger(WhatsAppClientService.name)
  private readonly wahaBaseUrl: string
  private readonly defaultSession: string

  constructor(private readonly configService: ConfigService) {
    // Get WAHA API configuration from environment variables via ConfigService
    this.wahaBaseUrl = this.configService.get<string>('WAHA_BASE_URL') || 'http://localhost:3002'
    this.defaultSession = this.configService.get<string>('WAHA_DEFAULT_SESSION') || 'default'

    this.logger.log(`WhatsAppClientService initialized with WAHA API at ${this.wahaBaseUrl}`)
  }

  async send(notification: Notification): Promise<void> {
    try {
      // Validate that this is a WhatsApp notification
      if (notification.channel.value !== 'whatsapp') {
        throw new Error('Notification is not a WhatsApp notification')
      }

      // Extract contact info and validate it's WhatsApp contact info
      const contactInfo = notification.contactInfo
      if (!(contactInfo instanceof WhatsappContactInfo)) {
        throw new Error('Contact info is not WhatsApp contact info')
      }

      // Format the phone number for WAHA API (remove + and add @c.us if not present)
      let phoneNumber = contactInfo.value

      if (phoneNumber.includes('@')) {
        this.logger.log(
          `Is chat id ${phoneNumber} no need to check if it exists`
        )
      } else {
        this.logger.log(`Checking if phone number ${phoneNumber} exists`)
        const exists = await this.checkNumberExists(phoneNumber)
        this.logger.log(
          `Phone number ${phoneNumber} exists: ${exists.numberExists}`
        )
        if (!exists.numberExists) {
          throw new Error(`Phone number ${phoneNumber} does not exist`)
        }
        phoneNumber = exists.chatId
      }

      this.logger.log(
        `Sending WhatsApp message to ${phoneNumber} for notification ${notification.id.value}`
      )

      // Create the message content
      const messageText = this.formatMessageContent(notification.content)

      // Send the message via WAHA API
      const result = await this.sendTextMessage({
        chatId: phoneNumber,
        text: messageText,
        session: this.defaultSession
      })

      this.logger.log(
        `WhatsApp message sent successfully. Message ID: ${result.id}`
      )
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message for notification ${notification.id.value}: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  /**
   * Send a text message via WAHA API
   */
  private async sendTextMessage(
    dto: SendTextMessageDto
  ): Promise<WAHAResponse> {
    try {
      const session = dto.session || this.defaultSession
      const url = `${this.wahaBaseUrl}/api/sendText`

      const payload = {
        chatId: dto.chatId,
        text: dto.text,
        session
      }

      this.logger.debug(
        { chatId: dto.chatId, session, textLength: dto.text.length },
        'Sending WhatsApp message via WAHA API'
      )

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `WAHA API error! status: ${response.status}, body: ${errorText}`
        )
      }

      const data = (await response.json()) as WAHAResponse
      this.logger.debug('Message sent successfully via WAHA API')
      return data
    } catch (error) {
      this.logger.error(
        { err: error },
        'Failed to send WhatsApp message via WAHA API'
      )
      throw new Error(`Failed to send WhatsApp message: ${error.message}`)
    }
  }

  /**
   * Format phone number for WAHA API
   * Converts +5511999999999 to 5511999999999@c.us
   */
  private formatPhoneNumberForWAHA(phoneNumber: string): string {
    // Remove the + sign
    const cleanNumber = phoneNumber.replace(/^\+/, '')

    // Add @c.us if not already present
    if (!cleanNumber.includes('@c.us')) {
      return `${cleanNumber}@c.us`
    }

    return cleanNumber
  }

  /**
   * Format notification content into message text
   */
  private formatMessageContent(content: any): string {
    // If content has title and body, format them nicely
    if (content.title && content.body) {
      return `*${content.title}*\n\n${content.body}`
    }

    // If content has body only, use it as is
    if (content.body) {
      return content.body
    }

    // If content is a string, use it directly
    if (typeof content === 'string') {
      return content
    }

    // Fallback to string representation
    return String(content)
  }

  /**
   * Check if a phone number exists on WhatsApp
   */
  async checkNumberExists(
    phoneNumber: string,
    session?: string
  ): Promise<{ numberExists: boolean; chatId: string; error?: boolean }> {
    try {
      const sessionName = session || this.defaultSession
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '')
      const url = `${this.wahaBaseUrl}/api/contacts/check-exists?phone=${cleanPhoneNumber}&session=${sessionName}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`
        )
      }

      const text = await response.text()
      const data = JSON.parse(text) as {
        numberExists: boolean
        chatId: string
      }

      this.logger.debug({ data }, 'checkNumberExists response')

      if (!data.numberExists) {
        return { numberExists: false, chatId: '' }
      }

      return data
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to check number existence')
      // Re-throw to properly propagate WAHA connection errors
      throw new Error(`Failed to check number existence via WAHA: ${error.message}`)
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(session?: string): Promise<any> {
    try {
      const sessionName = session || this.defaultSession
      const url = `${this.wahaBaseUrl}/api/sessions/${sessionName}`

      this.logger.debug({ url }, 'Getting session status')

      const response = await fetch(url)

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status}`
        try {
          const errorBody = await response.text()
          if (errorBody) {
            errorDetails += `: ${errorBody}`
          }
        } catch {
          // Ignore if we can't read the error body
        }

        this.logger.error({ errorDetails }, 'Session status request failed')
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorDetails}`
        )
      }

      const data = await response.json()
      this.logger.debug({ sessionName, data }, 'Session status response')
      return data
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to get session status')
      throw new Error(`Failed to get session status: ${error.message}`)
    }
  }

  async getName(chatId: string, session: string) {
    const url = `${this.wahaBaseUrl}/api/${session}/groups/${chatId}`
    const response = await fetch(url)

    const chatInfo = await response.json()
    const groupName =
      typeof chatInfo.name === 'string' ? chatInfo.name : 'Unknown Group'
    return groupName
  }
}
