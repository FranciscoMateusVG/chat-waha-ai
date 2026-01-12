import { ReceiveWhatsAppMessageDto } from 'src/chatHistory/application/dtos/receive-whatsapp.dto'
import { MessageSenderType } from 'src/chatHistory/domain/value-objects'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { WhatsappAccountsService } from 'src/whatsappAccounts/whatsapp-accounts.service'
import { WAHAWebhookPayload } from './waha-payload.interface'

export class WAHAWebhookMapper {
  static async toReceiveMessageDto(
    wahaPayload: WAHAWebhookPayload,
    wahaClientService: WhatsAppClientService,
    whatsappAccountsService: WhatsappAccountsService
  ): Promise<ReceiveWhatsAppMessageDto> {
    const { payload, session } = wahaPayload

    // Look up userId from session (session = whatsappAccount.id)
    const userId = await whatsappAccountsService.findUserIdBySession(session)
    if (!userId) {
      throw new Error(`No user found for session: ${session}`)
    }

    // Determine sender type
    const sender = payload.fromMe
      ? MessageSenderType.OWNER
      : MessageSenderType.USER

    // Get chat ID (from or to, depending on direction)
    const externalChatId = payload.fromMe ? payload.to : payload.from

    const chatName = await wahaClientService.getName(externalChatId, session)

    return {
      userId,
      externalChatId,
      chatName,
      message: payload.body,
      sender
    }
  }
}
