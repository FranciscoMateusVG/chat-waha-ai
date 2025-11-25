import { AggregateRoot } from '@nestjs/cqrs'
import {
  NotificationChannel,
  NotificationContent,
  NotificationStatus
} from '../value-objects'
import { ContactInfo } from './contact-info'
import { BatchId, NotificationId, UserId } from './ids'

export interface NotificationProps {
  id: NotificationId
  recipientId: UserId
  content: NotificationContent
  channel: NotificationChannel
  contactInfo: ContactInfo
  status: NotificationStatus
  createdAt: Date
  sentAt?: Date
  batchId?: BatchId
}

export class Notification extends AggregateRoot {
  private readonly _id: NotificationId
  private readonly _recipientId: UserId
  private readonly _content: NotificationContent
  private readonly _channel: NotificationChannel
  // This can be phone number, email, etc.
  private readonly _contactInfo: ContactInfo
  private _status: NotificationStatus
  private readonly _createdAt: Date
  private _sentAt?: Date
  private _batchId?: BatchId

  constructor(props: NotificationProps) {
    super()
    this._id = props.id
    this._recipientId = props.recipientId
    this._content = props.content
    this._channel = props.channel
    this._contactInfo = props.contactInfo
    this._status = props.status
    this._createdAt = props.createdAt
    this._sentAt = props.sentAt
    this._batchId = props.batchId
  }

  get id(): NotificationId {
    return this._id
  }

  get recipientId(): UserId {
    return this._recipientId
  }

  get content(): NotificationContent {
    return this._content
  }

  get channel(): NotificationChannel {
    return this._channel
  }

  get contactInfo(): ContactInfo {
    return this._contactInfo
  }

  get status(): NotificationStatus {
    return this._status
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get sentAt(): Date | undefined {
    return this._sentAt
  }

  get batchId(): BatchId | undefined {
    return this._batchId
  }

  canBeSent(): boolean {
    return this._status.isPending()
  }

  canBeAssignedToBatch(): boolean {
    return this._status.isPending() && !this._batchId
  }

  assignToBatch(batchId: BatchId): void {
    if (!this.canBeAssignedToBatch()) {
      throw new Error(
        'Notification cannot be assigned to batch. Must be pending and not already in a batch.'
      )
    }
    this._batchId = batchId
  }

  markAsSent(): void {
    if (!this.canBeSent()) {
      throw new Error(
        `Notification cannot be sent. Must be in pending state and its ${this._status.value}`
      )
    }

    const newStatus = NotificationStatus.sent()
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      )
    }

    this._status = newStatus
    this._sentAt = new Date()
  }

  markAsDelivered(): void {
    if (!this._status.isSent()) {
      throw new Error('Notification must be sent before it can be delivered')
    }

    const newStatus = NotificationStatus.delivered()
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      )
    }

    this._status = newStatus
  }

  markAsFailed(errorMessage: string): void {
    const newStatus = NotificationStatus.failed(errorMessage)
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      )
    }

    this._status = newStatus
  }

  static create(
    recipientId: UserId,
    content: NotificationContent,
    channel: NotificationChannel,
    contactInfo: ContactInfo
  ): Notification {
    const notification = new Notification({
      id: NotificationId.generate(),
      recipientId,
      content,
      channel,
      status: NotificationStatus.pending(),
      createdAt: new Date(),
      contactInfo: contactInfo
    })

    return notification
  }

  static fromPersistence(props: NotificationProps): Notification {
    return new Notification(props)
  }

  getChannelStrategy() {
    return this._channel.value
  }

  equals(other: Notification): boolean {
    return this._id.equals(other._id)
  }
}
