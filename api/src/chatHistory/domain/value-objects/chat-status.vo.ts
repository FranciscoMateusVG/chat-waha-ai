// Purpose: represents if chat is open or closed

export enum ChatStatusType {
  OPEN = 'open',
  CLOSED = 'closed'
}

export class ChatStatus {
  private readonly _value: ChatStatusType

  constructor(value?: ChatStatusType) {
    this._value = value ?? ChatStatusType.OPEN
  }

  static open(): ChatStatus {
    return new ChatStatus(ChatStatusType.OPEN)
  }

  static closed(): ChatStatus {
    return new ChatStatus(ChatStatusType.CLOSED)
  }

  get value(): ChatStatusType {
    return this._value
  }

  isOpen(): boolean {
    return this._value === ChatStatusType.OPEN
  }

  isClosed(): boolean {
    return this._value === ChatStatusType.CLOSED
  }

  equals(other: ChatStatus): boolean {
    return this._value === other._value
  }
}
