import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service'
import { Notification as PrismaNotification } from '@prisma/generated'
import { contactInfoMap } from 'src/notifications/application/use-cases/send-notification.use-case'
import { Notification, NotificationProps } from '../../../domain/entities'
import {
  BatchId,
  NotificationId,
  UserId
} from '../../../domain/entities/ids'
import { NotificationRepository } from '../../../domain/repositories/notification.repository.interface'
import {
  NotificationChannel,
  NotificationContent,
  NotificationStatus
} from '../../../domain/value-objects'

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  private readonly logger = new Logger(PrismaNotificationRepository.name)

  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<void> {
    try {
      const notificationData = this.mapToDbRecord(notification)

      await this.prisma.notification.upsert({
        where: { id: notificationData.id },
        create: notificationData,
        update: {
          status: notificationData.status,
          sentAt: notificationData.sentAt,
          batchId: notificationData.batchId,
          errorMessage: notificationData.errorMessage,
          updatedAt: new Date(),
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

  async saveMany(notificationList: Notification[]): Promise<void> {
    if (notificationList.length === 0) {
      return
    }

    try {
      const notificationData = notificationList.map((notification) =>
        this.mapToDbRecord(notification)
      )

      // Use transaction for bulk upsert
      await this.prisma.$transaction(
        notificationData.map((data) =>
          this.prisma.notification.upsert({
            where: { id: data.id },
            create: data,
            update: {
              status: data.status,
              sentAt: data.sentAt,
              batchId: data.batchId,
              contactInfo: data.contactInfo,
              errorMessage: data.errorMessage,
              updatedAt: new Date()
            }
          })
        )
      )

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
      const result = await this.prisma.notification.findUnique({
        where: { id }
      })

      if (!result) {
        return null
      }

      return this.mapToDomainEntity(result)
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
      const results = await this.prisma.notification.findMany({
        where: { recipientId },
        orderBy: { createdAt: 'desc' }
      })

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
      const results = await this.prisma.notification.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
      })

      return results.map((result) => this.mapToDomainEntity(result))
    } catch (error) {
      this.logger.error(
        `Failed to find notifications by status ${status}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to find notifications: ${error.message}`)
    }
  }

  async update(notification: Notification): Promise<void> {
    await this.save(notification)
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.notification.delete({
        where: { id }
      })
      this.logger.debug(`Notification ${id} deleted successfully`)
    } catch (error) {
      this.logger.error(
        `Failed to delete notification ${id}: ${error.message}`,
        error.stack
      )
      throw new Error(`Failed to delete notification: ${error.message}`)
    }
  }

  private mapToDbRecord(notification: Notification) {
    return {
      id: notification.id.value,
      userId: notification.userId,
      recipientId: notification.recipientId.value,
      title: notification.content.title,
      body: notification.content.body,
      channel: notification.channel.value,
      status: notification.status.value,
      metadata: notification.content.metadata || null,
      batchId: notification.batchId?.value || null,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt || null,
      contactInfo: notification.contactInfo.value,
      errorMessage: null,
      updatedAt: new Date()
    }
  }

  private mapToDomainEntity(dbRecord: PrismaNotification): Notification {
    const metadata = dbRecord.metadata as Record<string, unknown> | null

    const ContactInfoClass = contactInfoMap[dbRecord.channel]
    const contactInfo = new ContactInfoClass(dbRecord.contactInfo)

    const props: NotificationProps = {
      id: new NotificationId(dbRecord.id),
      userId: dbRecord.userId,
      recipientId: new UserId(dbRecord.recipientId),
      content: new NotificationContent(dbRecord.title, dbRecord.body, metadata || undefined),
      channel: new NotificationChannel(dbRecord.channel),
      status: new NotificationStatus(dbRecord.status),
      contactInfo: contactInfo,
      createdAt: dbRecord.createdAt,
      sentAt: dbRecord.sentAt || undefined,
      batchId: dbRecord.batchId ? new BatchId(dbRecord.batchId) : undefined
    }

    return new Notification(props)
  }
}
