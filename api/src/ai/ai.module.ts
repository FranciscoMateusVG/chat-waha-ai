import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

// Use Cases
import { ProcessOpenChatsWithAiUseCase } from './application/use-cases/process-open-chats-with-ai.use-case'

// Services
import { VercelAiSdkService } from './infrastructure/services/vercel-ai-sdk.service'
import { AiToolRegistry } from './infrastructure/tools/ai-tool-registry'

// Cron
import { AiProcessorCron } from './infrastructure/cron/ai-processor.cron'

// Controllers
import { AiTestController } from './infrastructure/controllers/ai-test.controller'

// Tokens
import { AI_SERVICE } from './tokens'

// Dependencies
import { ChatHistoryModule } from 'src/chatHistory/chatHistory.module'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import { KnowledgeModule } from 'src/knowledge/knowledge.module'
import { NotificationsModule } from 'src/notifications/notifications.module'

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    ChatHistoryModule,
    NotificationsModule,
    KnowledgeModule
  ],
  controllers: [AiTestController],
  providers: [
    // Use Cases
    ProcessOpenChatsWithAiUseCase,

    // Services & Tools
    AiToolRegistry,
    {
      provide: AI_SERVICE,
      useClass: VercelAiSdkService
    },

    // External Services
    WhatsAppClientService,

    // Cron
    AiProcessorCron
  ],
  exports: [ProcessOpenChatsWithAiUseCase]
})
export class AiModule {}
