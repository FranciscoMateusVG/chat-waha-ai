import { contactInfoMap } from '../application'
import { SendIndividualNotificationDto } from '../application/dtos/send-notification.dto'
import {
  Notification,
  NotificationChannel,
  NotificationContent,
  UserId
} from '../domain'

export function notificationFactory(dto: SendIndividualNotificationDto) {
  // Create domain objects
  const recipientId = new UserId(dto.recipientId)
  const content = new NotificationContent(dto.title, dto.body, dto.metadata)
  const channel = new NotificationChannel(dto.channel)
  const ContactInfoClass = contactInfoMap[dto.channel]
  const contactInfo = ContactInfoClass
    ? new ContactInfoClass(dto.contactInfo)
    : null

  if (!contactInfo) {
    throw new Error('Contact info is required for channel: ' + dto.channel)
  }

  contactInfo.validate()

  // Create notification aggregate
  const notification = Notification.create(
    recipientId,
    content,
    channel,
    contactInfo
  )

  return notification
}
