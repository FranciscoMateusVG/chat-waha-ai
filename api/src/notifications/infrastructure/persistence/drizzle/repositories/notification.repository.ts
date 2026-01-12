import { Injectable, Logger } from '@nestjs/common'
import { desc, eq, sql } from 'drizzle-orm'
import { DrizzleDatabaseService } from 'src/infrastructure/drizzle/database.provider'
import { contactInfoMap } from 'src/notifications/application/use-cases/send-notification.use-case'
import {
  Notification as NotificationDbRecord,
  notifications
} from '../../../../../infrastructure/drizzle/schemas/notification/schema'
import { Notification, NotificationProps } from '../../../../domain/entities'
import {
  BatchId,
  NotificationId,
  UserId
} from '../../../../domain/entities/ids'
import { NotificationRepository } from '../../../../domain/repositories/notification.repository.interface'
import {
  NotificationChannel,
  NotificationContent,
  NotificationStatus
} from '../../../../domain/value-objects'

@Injectable()
export class DrizzleNotificationRepository implements NotificationRepository {
  private readonly logger = new Logger(DrizzleNotificationRepository.name)

  constructor(private readonly databaseService: DrizzleDatabaseService) {}

  private get db() {
    return this.databaseService.getDatabase()
  }

  /**
   * Save a notification (upsert - insert or update)
   * This is called multiple times in the use case:
   * 1. First save when notification is created (status: pending)
   * 2. Second save after delivery (status: sent/failed)
   */
  async save(notification: Notification): Promise<void> {
    try {
      const notificationData = this.mapToDbRecord(notification)

      await this.db
        .insert(notifications)
        .values(notificationData)
        .onConflictDoUpdate({
          target: notifications.id,
          set: {
            status: notificationData.status,
            sentAt: notificationData.sentAt,
            batchId: notificationData.batchId,
            errorMessage: notificationData.errorMessage,
            updatedAt: notificationData.updatedAt,
            contactInfo: notificationData.contactInfo
          }
        })

      this.logger.debug(
        `Notification ${notification.id.value} saved successfully`
      )
    } catch (error) {
      this.logger.error(
        `Failed to save notification ${notification.id.value}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to save notification: ${error.message}`)
    }
  }

  /**
   * Save multiple notifications (bulk upsert)
   */
  async saveMany(notificationList: Notification[]): Promise<void> {
    if (notificationList.length === 0) {
      return
    }

    try {
      const notificationData = notificationList.map((notification) =>
        this.mapToDbRecord(notification)
      )

      await this.db
        .insert(notifications)
        .values(notificationData)
        .onConflictDoUpdate({
          target: notifications.id,
          set: {
            status: sql`excluded.status`,
            sentAt: sql`excluded.sent_at`,
            batchId: sql`excluded.batch_id`,
            contactInfo: sql`excluded.contact_info`,
            errorMessage: sql`excluded.error_message`,
            updatedAt: sql`excluded.updated_at`
          }
        })

      this.logger.debug(
        `${notificationList.length} notifications saved successfully`
      )
    } catch (error) {
      this.logger.error(
        `Failed to save ${notificationList.length} notifications: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to save notifications: ${error.message}`)
    }
  }

  async findById(id: string): Promise<Notification | null> {
    try {
      const result = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.id, id))
        .limit(1)

      if (result.length === 0) {
        return null
      }

      return this.mapToDomainEntity(result[0])
    } catch (error) {
      this.logger.error(
        `Failed to find notification by id ${id}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find notification: ${error.message}`)
    }
  }

  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    try {
      const results = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientId, recipientId))
        .orderBy(desc(notifications.createdAt))

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to find notifications by recipient ${recipientId}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find notifications: ${error.message}`)
    }
  }

  async findByStatus(status: string): Promise<Notification[]> {
    try {
      const results = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.status, status))
        .orderBy(desc(notifications.createdAt))

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to find notifications by status ${status}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find notifications: ${error.message}`)
    }
  }

  /**
   * Update is now redundant since save() does upsert
   * Keeping it for interface compatibility
   */
  async update(notification: Notification): Promise<void> {
    await this.save(notification)
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(notifications).where(eq(notifications.id, id))
      this.logger.debug(`Notification ${id} deleted successfully`)
    } catch (error) {
      this.logger.error(
        `Failed to delete notification ${id}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to delete notification: ${error.message}`)
    }
  }

  /**
   * Map domain entity to database record
   */
  private mapToDbRecord(
    notification: Notification
  ): typeof notifications.$inferInsert {
    // Create a type that ensures all fields are explicitly mapped
    const record = {
      id: notification.id.value,
      userId: notification.userId,
      recipientId: notification.recipientId.value,
      title: notification.content.title,
      body: notification.content.body,
      channel: notification.channel.value,
      status: notification.status.value,
      metadata: notification.content.metadata
        ? JSON.stringify(notification.content.metadata)
        : null,
      batchId: notification.batchId?.value || null,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt || null,
      contactInfo: notification.contactInfo.value,
      errorMessage: null, // TODO: Add errorMessage to domain entity
      updatedAt: new Date()
    } satisfies typeof notifications.$inferInsert

    return record
  }

  /**
   * Map database record to domain entity
   */
  private mapToDomainEntity(dbRecord: NotificationDbRecord): Notification {
    const metadata = dbRecord.metadata
      ? this.safeJsonParse(dbRecord.metadata as string)
      : undefined

    const ContactInfoClass = contactInfoMap[dbRecord.channel]
    const contactInfo = new ContactInfoClass(dbRecord.contactInfo)

    const props: NotificationProps = {
      id: new NotificationId(dbRecord.id),
      userId: dbRecord.userId,
      recipientId: new UserId(dbRecord.recipientId),
      content: new NotificationContent(dbRecord.title, dbRecord.body, metadata),
      channel: new NotificationChannel(dbRecord.channel),
      status: new NotificationStatus(dbRecord.status),
      contactInfo: contactInfo,
      createdAt: dbRecord.createdAt,
      sentAt: dbRecord.sentAt || undefined,
      batchId: dbRecord.batchId ? new BatchId(dbRecord.batchId) : undefined
    }

    return new Notification(props)
  }

  /**
   * Safely parse JSON with error handling
   */
  private safeJsonParse(json: string): Record<string, any> | undefined {
    try {
      return JSON.parse(json)
    } catch (error) {
      this.logger.warn(`Failed to parse metadata JSON: ${json}`)
      return undefined
    }
  }
}
