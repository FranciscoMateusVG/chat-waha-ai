import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

// Domain Services
import {
  EmailDeliveryStrategy,
  RateLimiterService,
  WhatsAppDeliveryStrategy
} from './domain/services'

// Application Layer
import {
  GetNotificationHistoryUseCase,
  SendNotificationUseCase
} from './application/use-cases'

import {
  NotificationFailedEventHandler,
  NotificationSentEventHandler
} from './application/event-handlers'

// Infrastructure Layer
import {
  DrizzleNotificationBatchRepository,
  DrizzleNotificationHistoryRepository,
  DrizzleNotificationRepository,
  DrizzleNotificationStatsRepository
} from './infrastructure/persistence/drizzle/repositories'

import { EmailClientService } from './infrastructure/external-services'

// Controllers
import { NotificationsController } from './presentation/controllers/notifications.controller'

// Tokens
import { DrizzleDatabaseService } from 'src/infrastructure/drizzle/database.provider'
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import {
  EMAIL_CLIENT,
  NOTIFICATION_BATCH_REPOSITORY,
  NOTIFICATION_DATABASE,
  NOTIFICATION_HISTORY_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_STATS_REPOSITORY,
  RATE_LIMITER_MAX_REQUESTS,
  RATE_LIMITER_WINDOW_MS,
  WHATSAPP_CLIENT
} from './tokens'

@Module({
  imports: [CqrsModule],
  controllers: [NotificationsController],
  providers: [
    // Database
    DrizzleDatabaseService,
    {
      provide: NOTIFICATION_DATABASE,
      useFactory: (dbService: DrizzleDatabaseService) => {
        return dbService.getDatabase()
      },
      inject: [DrizzleDatabaseService]
    },

    // Rate Limiter Configuration
    {
      provide: RATE_LIMITER_MAX_REQUESTS,
      useValue: 10 // Maximum 10 requests per window
    },
    {
      provide: RATE_LIMITER_WINDOW_MS,
      useValue: 60000 // 1 minute window
    },

    // Domain Services
    RateLimiterService,
    EmailDeliveryStrategy,
    WhatsAppDeliveryStrategy,

    // Application Use Cases
    SendNotificationUseCase,
    GetNotificationHistoryUseCase,

    // Event Handlers
    NotificationSentEventHandler,

    NotificationFailedEventHandler,

    // External Services
    {
      provide: EMAIL_CLIENT,
      useClass: EmailClientService
    },
    {
      provide: WHATSAPP_CLIENT,
      useClass: WhatsAppClientService
    },

    // Repositories
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: DrizzleNotificationRepository
    },
    {
      provide: NOTIFICATION_HISTORY_REPOSITORY,
      useClass: DrizzleNotificationHistoryRepository
    },
    {
      provide: NOTIFICATION_STATS_REPOSITORY,
      useClass: DrizzleNotificationStatsRepository
    },
    {
      provide: NOTIFICATION_BATCH_REPOSITORY,
      useClass: DrizzleNotificationBatchRepository
    }
  ],
  exports: [
    SendNotificationUseCase,
    GetNotificationHistoryUseCase,
    RateLimiterService
  ]
})
export class NotificationsModule {}
