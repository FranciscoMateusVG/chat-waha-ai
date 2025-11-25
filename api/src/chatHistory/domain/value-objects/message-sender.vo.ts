// Purpose: the actual message text with validation

export enum MessageSenderType {
  USER = 'user',
  SYSTEM = 'system',
  AI = 'ai',
  OWNER = 'owner'
}

export class MessageSender {
  private readonly _value: MessageSenderType

  constructor(value?: MessageSenderType) {
    this._value = value ?? MessageSenderType.USER
  }

  static user(): MessageSender {
    return new MessageSender(MessageSenderType.USER)
  }

  static system(): MessageSender {
    return new MessageSender(MessageSenderType.SYSTEM)
  }

  static ai(): MessageSender {
    return new MessageSender(MessageSenderType.AI)
  }

  static owner(): MessageSender {
    return new MessageSender(MessageSenderType.OWNER)
  }

  get value(): MessageSenderType {
    return this._value
  }

  equals(other: MessageSender): boolean {
    return this._value === other._value
  }

  isAi(): boolean {
    return this._value === MessageSenderType.AI
  }

  isOwner(): boolean {
    return this._value === MessageSenderType.OWNER
  }

  isSystem(): boolean {
    return this._value === MessageSenderType.SYSTEM
  }

  isUser(): boolean {
    return this._value === MessageSenderType.USER
  }
}
