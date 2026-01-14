import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { WhatsappAccountsModule } from '../whatsappAccounts/whatsapp-accounts.module'
import { ReceiveWhatsAppMessageUseCase } from './application/useCases/receive-whatsapp-message.use-case'
import { ChatHistoryController } from './controllers/chatHistory.controller'
import { SchedulerController } from './controllers/scheduler.controller'
import { WAHAWebhookController } from './controllers/waha/waha-webhook.controller'
import { PrismaChatHistoryRepository } from './infrastructure/prisma/repositories/chat-history.repository'
import { CHAT_HISTORY_REPOSITORY } from './tokens'

@Module({
  imports: [CqrsModule, WhatsappAccountsModule],
  controllers: [WAHAWebhookController, ChatHistoryController],
  providers: [
    ReceiveWhatsAppMessageUseCase,
    WhatsAppClientService,
    SchedulerController,
    {
      provide: CHAT_HISTORY_REPOSITORY,
      useClass: PrismaChatHistoryRepository
    }
  ],
  exports: [ReceiveWhatsAppMessageUseCase, CHAT_HISTORY_REPOSITORY]
})
export class ChatHistoryModule {}
