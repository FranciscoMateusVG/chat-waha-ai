import { AggregateRoot } from '@nestjs/cqrs'
import { BatchStatus, NotificationChannel } from '../value-objects'
import { BatchId } from './ids'
import { Notification } from './notification.entity'

export interface NotificationBatchProps {
  id: BatchId
  channel: NotificationChannel
  notifications: Notification[]
  status: BatchStatus
  createdAt: Date
  processedAt?: Date
}

export class NotificationBatch extends AggregateRoot {
  private readonly _id: BatchId
  private readonly _channel: NotificationChannel
  private _notifications: Notification[]
  private _status: BatchStatus
  private readonly _createdAt: Date
  private _processedAt?: Date

  constructor(props: NotificationBatchProps) {
    super()
    this._id = props.id
    this._channel = props.channel
    this._notifications = [...props.notifications]
    this._status = props.status
    this._createdAt = props.createdAt
    this._processedAt = props.processedAt

    this.validateInvariants()
  }

  get id(): BatchId {
    return this._id
  }

  get channel(): NotificationChannel {
    return this._channel
  }

  get notifications(): ReadonlyArray<Notification> {
    return [...this._notifications]
  }

  get status(): BatchStatus {
    return this._status
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get processedAt(): Date | undefined {
    return this._processedAt
  }

  get notificationCount(): number {
    return this._notifications.length
  }

  canBeProcessed(): boolean {
    return this._status.isPending()
  }

  canAddNotification(notification: Notification): boolean {
    if (!this._status.isPending()) {
      return false
    }

    if (!notification.canBeAssignedToBatch()) {
      return false
    }

    if (!notification.channel.equals(this._channel)) {
      return false
    }

    return true
  }

  addNotification(notification: Notification): void {
    if (!this.canAddNotification(notification)) {
      throw new Error(
        'Cannot add notification to batch. Check batch status, notification status, and channel compatibility.'
      )
    }

    notification.assignToBatch(this._id)
    this._notifications.push(notification)
  }

  startProcessing(): void {
    if (!this.canBeProcessed()) {
      throw new Error('Batch cannot be processed. Must be in pending state.')
    }

    const newStatus = BatchStatus.processing()
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      )
    }

    this._status = newStatus
  }

  markAsCompleted(): void {
    if (!this._status.isProcessing()) {
      throw new Error('Batch must be processing before it can be completed')
    }

    const newStatus = BatchStatus.completed()
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      )
    }

    this._status = newStatus
    this._processedAt = new Date()
  }

  markAsFailed(errorMessage: string): void {
    const newStatus = BatchStatus.failed(errorMessage)
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}`
      )
    }

    this._status = newStatus
    this._processedAt = new Date()
  }

  private validateInvariants(): void {
    if (this._notifications.length === 0) {
      throw new Error('Batch must contain at least one notification')
    }

    const firstNotificationChannel = this._notifications[0].channel
    const allSameChannel = this._notifications.every((notification) =>
      notification.channel.equals(firstNotificationChannel)
    )

    if (!allSameChannel) {
      throw new Error(
        'All notifications in a batch must be for the same channel'
      )
    }

    if (!this._channel.equals(firstNotificationChannel)) {
      throw new Error('Batch channel must match notifications channel')
    }

    const allPending = this._notifications.every((notification) =>
      notification.status.isPending()
    )

    if (!allPending && this._status.isPending()) {
      throw new Error('All notifications must be pending when batch is created')
    }
  }

  static create(
    channel: NotificationChannel,
    notifications: Notification[]
  ): NotificationBatch {
    if (notifications.length === 0) {
      throw new Error('Cannot create batch without notifications')
    }
    const batchId = BatchId.generate()

    notifications.forEach((notification) => {
      notification.assignToBatch(batchId)
    })

    const batch = new NotificationBatch({
      id: batchId,
      channel,
      notifications,
      status: BatchStatus.pending(),
      createdAt: new Date()
    })

    return batch
  }

  static fromPersistence(props: NotificationBatchProps): NotificationBatch {
    return new NotificationBatch(props)
  }

  equals(other: NotificationBatch): boolean {
    return this._id.equals(other._id)
  }
}
