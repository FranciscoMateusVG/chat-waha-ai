# Notification System - Domain-Driven Design Implementation

A comprehensive notification system built with Domain-Driven Design (DDD) principles, CQRS pattern, and event-driven architecture using NestJS and TypeScript.

## Overview

This notification system supports three delivery channels:
- **System** (in-app notifications)
- **WhatsApp** (with rate limiting)
- **Email** (via Mailtrap)

The system supports both individual and batch sending, with channel-specific optimizations and rate limiting.

## Architecture

### Domain-Driven Design Layers

```
src/notifications/
├── domain/                 # Business logic and rules
│   ├── entities/          # Aggregates (Notification, NotificationBatch)
│   ├── value-objects/     # Immutable objects (Channel, Content, Status)
│   ├── services/          # Domain services (DeliveryStrategy, RateLimiter)
│   └── events/           # Domain events
├── application/           # Use cases and application services
│   ├── use-cases/        # Business use cases
│   ├── dtos/             # Data transfer objects
│   ├── read-models/      # CQRS query models
│   └── event-handlers/   # Domain event handlers
├── infrastructure/       # External concerns
│   ├── repositories/     # Data persistence
│   ├── persistence/      # Database entities and config
│   └── external-services/ # Third-party integrations
├── presentation/         # API layer
│   └── controllers/      # REST endpoints
└── notifications.module.ts # NestJS module configuration
```

## Key Domain Concepts

### Aggregates

#### Notification (Aggregate Root)
- **Identity**: NotificationId
- **Properties**: recipientId, content, channel, status, createdAt, sentAt, batchId
- **Business Rules**:
  - Can only be sent when in pending state
  - Can be assigned to batch only when pending
  - Tracks delivery lifecycle through status transitions

#### NotificationBatch (Aggregate Root)
- **Identity**: BatchId
- **Properties**: channel, notifications[], status, createdAt, processedAt
- **Business Rules**:
  - Must contain at least one notification
  - All notifications must be for the same channel
  - All notifications must be pending when batch is created

### Value Objects

#### NotificationChannel
- **Values**: system | whatsapp | email
- **Capabilities**: supportsBatchDelivery(), requiresRateLimiting()

#### NotificationContent
- **Properties**: title, body, metadata?
- **Validation**: Title ≤ 255 chars, Body ≤ 2000 chars

#### NotificationStatus / BatchStatus
- **States**: pending → sent → delivered / failed
- **Behavior**: Enforces valid state transitions

### Domain Services

#### NotificationDeliveryStrategy (Strategy Pattern)
```typescript
interface NotificationDeliveryStrategy {
  deliverSingle(notification: Notification): Promise<void>;
  deliverBatch(batch: NotificationBatch): Promise<void>;
  supportsBatch(): boolean;
}
```

**Implementations**:
- **EmailDeliveryStrategy**: Uses Mailtrap API (single + batch)
- **WhatsAppDeliveryStrategy**: Rate-limited delivery (3 msgs/min)
- **SystemDeliveryStrategy**: Database persistence

#### RateLimiterService
- **WhatsApp**: 3 messages per minute
- **Email**: 100 messages per minute
- **System**: 1000 messages per minute

## API Endpoints

### Send Individual Notification
```http
POST /notifications/send
Content-Type: application/json

{
  "title": "Welcome!",
  "body": "Welcome to our platform",
  "recipientId": "user-123",
  "channel": "email",
  "metadata": {
    "priority": "high"
  }
}
```

### Send Batch Notification
```http
POST /notifications/send/batch
Content-Type: application/json

{
  "title": "System Maintenance",
  "body": "Scheduled maintenance tonight",
  "recipientIds": ["user-1", "user-2", "user-3"],
  "channel": "system"
}
```

### Get Notification History
```http
GET /notifications/history/recipient/user-123?limit=20&offset=0
GET /notifications/history/channel/email?status=sent&startDate=2024-01-01
```

### Get Statistics
```http
GET /notifications/stats?channel=whatsapp&startDate=2024-01-01&endDate=2024-01-31
GET /notifications/stats/channels
```

## Channel-Specific Behavior

### Email (Mailtrap)
- **Individual**: Standard send method
- **Batch**: Bulk API for efficiency
- **Rate Limiting**: None required
- **TODO**: Implement actual Mailtrap API calls

### WhatsApp
- **Individual**: Rate-limited send
- **Batch**: Chunked delivery (3 msgs → wait 60s → next chunk)
- **Rate Limiting**: 3 messages per minute
- **TODO**: Implement actual WhatsApp Business API

### System (In-App)
- **Individual**: Database insert
- **Batch**: Bulk database insert
- **Rate Limiting**: High limit (1000/min)
- **TODO**: Implement actual database operations

## Event-Driven Architecture

### Domain Events
- **NotificationSentEvent**: Individual notification sent
- **NotificationBatchSentEvent**: Batch processing completed
- **NotificationFailedEvent**: Notification delivery failed

### Event Handlers
- Update read models (CQRS)
- Update statistics
- Log events for observability
- Trigger alerts for failures

## CQRS Implementation

### Write Side (Commands)
- `SendNotificationUseCase`: Handles individual and batch sending
- Uses domain aggregates for business logic
- Publishes domain events

### Read Side (Queries)
- `GetNotificationHistoryUseCase`: Optimized for queries
- Separate read models for performance
- Updated via event handlers

### Read Models
- **NotificationHistoryReadModel**: Individual notification history
- **NotificationStatsReadModel**: Aggregated statistics

## Database Design

### Write Models (Domain)
```sql
-- Notifications (aggregate state)
notifications: id, recipientId, title, body, channel, status, metadata, batchId, createdAt, sentAt, errorMessage

-- Notification Batches
notification_batches: id, channel, status, notificationCount, createdAt, processedAt, errorMessage
```

### Read Models (CQRS)
```sql
-- Optimized for history queries
notification_history: notificationId, recipientId, channel, status, title, body, createdAt, sentAt, failedReason, metadata

-- Aggregated statistics
notification_stats: id(date-channel), date, channel, totalSent, totalFailed, totalDelivered
```

## Testing

### Unit Tests
- Domain value objects validation
- Entity business rules
- Service behavior
- Rate limiting logic

### Run Tests
```bash
npm test
npm run test:watch
npm run test:cov
```

## Configuration

### Environment Variables
```env
# Database
NOTIFICATION_DB_PATH=./notification-data.sqlite

# Mailtrap (TODO: implement)
MAILTRAP_TOKEN=your_token
MAILTRAP_TEST_INBOX_ID=your_inbox_id
DEFAULT_FROM_EMAIL=noreply@yourapp.com

# WhatsApp (TODO: implement)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Installation & Setup

1. **Install Dependencies**
```bash
cd apps/chat-ai
npm install
```

2. **Database Migration**
Database tables will be created automatically via TypeORM synchronization (development only).

3. **Start Application**
```bash
npm run start:dev
```

4. **Test the API**
```bash
# Health check
curl http://localhost:3000/notifications/health

# Send notification
curl -X POST http://localhost:3000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Test message",
    "recipientId": "user-123",
    "channel": "system"
  }'
```

## Next Steps / TODOs

### High Priority
1. **External Service Integration**
   - Implement actual Mailtrap API calls
   - Implement WhatsApp Business API integration
   - Add authentication and configuration management

2. **Database Implementation**
   - Complete repository implementations
   - Add proper error handling
   - Implement read model updates in event handlers

3. **Testing**
   - Add integration tests
   - Add end-to-end tests
   - Test actual external service integrations

### Medium Priority
1. **Reliability**
   - Add retry mechanisms for failed deliveries
   - Implement circuit breaker pattern
   - Add dead letter queue for failed messages

2. **Performance**
   - Add queue system (BullMQ) for async processing
   - Implement caching for read models
   - Add database indices optimization

3. **Observability**
   - Add metrics collection (Prometheus)
   - Implement distributed tracing
   - Add structured logging with correlation IDs

### Low Priority
1. **Features**
   - Add template system for notifications
   - Implement user preferences
   - Add notification scheduling
   - Support for rich content (images, links)

2. **Administration**
   - Add admin dashboard
   - Implement A/B testing for notifications
   - Add analytics and reporting

## DDD Principles Followed

✅ **Ubiquitous Language**: Business terms throughout (Notification, Batch, Channel)  
✅ **Aggregates**: Clear boundaries with business invariants  
✅ **Value Objects**: Immutable objects for concepts without identity  
✅ **Domain Services**: Business logic that doesn't belong to entities  
✅ **Domain Events**: Communicate changes across aggregates  
✅ **Repository Pattern**: Abstract persistence concerns  
✅ **CQRS**: Separate write/read models for optimization  
✅ **Event-Driven**: Loose coupling via domain events  

## Architecture Benefits

- **Maintainable**: Clear separation of concerns
- **Testable**: Isolated domain logic
- **Scalable**: CQRS enables independent scaling
- **Flexible**: Strategy pattern for delivery channels
- **Observable**: Event-driven for monitoring
- **Reliable**: Built-in error handling and rate limiting