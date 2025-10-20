import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { InfrastructureModule } from '../infrastructure/infrastructure.module'
import { ReceiveWhatsAppMessageUseCase } from './application/useCases/receive-whatsapp-message.use-case'
import { ChatHistoryController } from './controllers/chatHistory.controller'
import { SchedulerController } from './controllers/scheduler.controller'
import { WAHAWebhookController } from './controllers/waha/waha-webhook.controller'
import { DrizzleChatHistoryRepository } from './infrastructure/drizzle/repositories/chat-history.repository'
import { CHAT_HISTORY_REPOSITORY } from './tokens'

@Module({
  imports: [CqrsModule, InfrastructureModule],
  controllers: [WAHAWebhookController, ChatHistoryController],
  providers: [
    ReceiveWhatsAppMessageUseCase,
    WhatsAppClientService,
    SchedulerController,
    {
      provide: CHAT_HISTORY_REPOSITORY,
      useClass: DrizzleChatHistoryRepository
    }
  ],
  exports: [ReceiveWhatsAppMessageUseCase, CHAT_HISTORY_REPOSITORY]
})
export class ChatHistoryModule {}
