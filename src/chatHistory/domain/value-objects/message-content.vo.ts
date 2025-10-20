// Purpose: the actual message text with validation

export class MessageContent {
  private readonly _text: string

  constructor(text: string) {
    if (!text || text.trim().length === 0) {
      throw new Error('Message content cannot be empty')
    }

    let textValue = text.trim()

    if (textValue.length > 5000) {
      textValue = textValue.substring(0, 5000)
    }

    this._text = textValue
  }

  get text(): string {
    return this._text
  }

  equals(other: MessageContent): boolean {
    return this._text === other._text
  }
}
