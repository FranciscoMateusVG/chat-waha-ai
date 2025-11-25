export abstract class ExternalChatId {
  protected readonly _value: string

  constructor(value: string) {
    this._value = value
  }

  get value(): string {
    return this._value
  }

  equals(other: ExternalChatId): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  abstract isGroupChat(): boolean
}
