import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

// Domain Services
import {
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
  PrismaNotificationBatchRepository
} from './infrastructure/prisma/repositories/notification-batch.repository'
import {
  PrismaNotificationHistoryRepository
} from './infrastructure/prisma/repositories/notification-history.repository'
import {
  PrismaNotificationRepository
} from './infrastructure/prisma/repositories/notification.repository'
import {
  PrismaNotificationStatsRepository
} from './infrastructure/prisma/repositories/notification-stats.repository'

// Controllers
import { NotificationsController } from './presentation/controllers/notifications.controller'

// Tokens
import { WhatsAppClientService } from 'src/infrastructure/waha/waha-client.service'
import {
  NOTIFICATION_BATCH_REPOSITORY,
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
    WhatsAppDeliveryStrategy,

    // Application Use Cases
    SendNotificationUseCase,
    GetNotificationHistoryUseCase,

    // Event Handlers
    NotificationSentEventHandler,
    NotificationFailedEventHandler,

    // External Services
    {
      provide: WHATSAPP_CLIENT,
      useClass: WhatsAppClientService
    },

    // Repositories
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository
    },
    {
      provide: NOTIFICATION_HISTORY_REPOSITORY,
      useClass: PrismaNotificationHistoryRepository
    },
    {
      provide: NOTIFICATION_STATS_REPOSITORY,
      useClass: PrismaNotificationStatsRepository
    },
    {
      provide: NOTIFICATION_BATCH_REPOSITORY,
      useClass: PrismaNotificationBatchRepository
    }
  ],
  exports: [
    SendNotificationUseCase,
    GetNotificationHistoryUseCase,
    RateLimiterService
  ]
})
export class NotificationsModule {}
