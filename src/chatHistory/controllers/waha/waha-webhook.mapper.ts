import { ReceiveWhatsAppMessageDto } from 'src/chatHistory/application/dtos/receive-whatsapp.dto'
import { MessageSenderType } from 'src/chatHistory/domain/value-objects'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { WAHAWebhookPayload } from './waha-payload.interface'

export class WAHAWebhookMapper {
  static async toReceiveMessageDto(
    wahaPayload: WAHAWebhookPayload,
    wahaClientService: WhatsAppClientService
  ): Promise<ReceiveWhatsAppMessageDto> {
    const { payload } = wahaPayload

    // Determine sender type
    const sender = payload.fromMe
      ? MessageSenderType.OWNER
      : MessageSenderType.USER

    // Get chat ID (from or to, depending on direction)
    const externalChatId = payload.fromMe ? payload.to : payload.from

    const chatName = await wahaClientService.getName(externalChatId, 'default')

    return {
      externalChatId,
      chatName,
      message: payload.body,
      sender
    }
  }
}
