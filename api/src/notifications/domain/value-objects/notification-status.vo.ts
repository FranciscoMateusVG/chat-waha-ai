export enum NotificationStatusType {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

export class NotificationStatus {
  private readonly _value: NotificationStatusType
  private readonly _errorMessage?: string

  constructor(value: NotificationStatusType | string, errorMessage?: string) {
    if (typeof value === 'string') {
      if (
        !Object.values(NotificationStatusType).includes(
          value as NotificationStatusType
        )
      ) {
        throw new Error(`Invalid notification status: ${value}`)
      }
      this._value = value as NotificationStatusType
    } else {
      this._value = value
    }

    if (this._value === NotificationStatusType.FAILED && !errorMessage) {
      throw new Error('Error message is required for failed status')
    }

    this._errorMessage = errorMessage
  }

  get value(): NotificationStatusType {
    return this._value
  }

  get errorMessage(): string | undefined {
    return this._errorMessage
  }

  isPending(): boolean {
    return this._value === NotificationStatusType.PENDING
  }

  isSent(): boolean {
    return this._value === NotificationStatusType.SENT
  }

  isDelivered(): boolean {
    return this._value === NotificationStatusType.DELIVERED
  }

  isFailed(): boolean {
    return this._value === NotificationStatusType.FAILED
  }

  canTransitionTo(newStatus: NotificationStatus): boolean {
    const transitions: Record<
      NotificationStatusType,
      NotificationStatusType[]
    > = {
      [NotificationStatusType.PENDING]: [
        NotificationStatusType.SENT,
        NotificationStatusType.FAILED
      ],
      [NotificationStatusType.SENT]: [
        NotificationStatusType.DELIVERED,
        NotificationStatusType.FAILED
      ],
      [NotificationStatusType.DELIVERED]: [],
      [NotificationStatusType.FAILED]: []
    }

    return transitions[this._value].includes(newStatus._value)
  }

  equals(other: NotificationStatus): boolean {
    return (
      this._value === other._value && this._errorMessage === other._errorMessage
    )
  }

  toString(): string {
    return this._value
  }

  static pending(): NotificationStatus {
    return new NotificationStatus(NotificationStatusType.PENDING)
  }

  static sent(): NotificationStatus {
    return new NotificationStatus(NotificationStatusType.SENT)
  }

  static delivered(): NotificationStatus {
    return new NotificationStatus(NotificationStatusType.DELIVERED)
  }

  static failed(errorMessage: string): NotificationStatus {
    return new NotificationStatus(NotificationStatusType.FAILED, errorMessage)
  }
}
