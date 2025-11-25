export interface NotificationMetadata {
  [key: string]: any
}

export class NotificationContent {
  private readonly _title: string
  private readonly _body: string
  private readonly _metadata?: NotificationMetadata

  constructor(title: string, body: string, metadata?: NotificationMetadata) {
    // Title can be empty for certain channels like WhatsApp
    if (title && title.trim().length > 0 && title.length > 255) {
      throw new Error('Notification title cannot exceed 255 characters')
    }
    if (!body || body.trim().length === 0) {
      throw new Error('Notification body cannot be empty')
    }
    if (body.length > 5000) {
      throw new Error('Notification body cannot exceed 5000 characters')
    }

    this._title = title ? title.trim() : ''
    this._body = body.trim()
    this._metadata = metadata ? { ...metadata } : undefined
  }

  get title(): string {
    return this._title
  }

  get body(): string {
    return this._body
  }

  get metadata(): NotificationMetadata | undefined {
    return this._metadata ? { ...this._metadata } : undefined
  }

  equals(other: NotificationContent): boolean {
    return (
      this._title === other._title &&
      this._body === other._body &&
      JSON.stringify(this._metadata) === JSON.stringify(other._metadata)
    )
  }

  toPlainObject(): {
    title: string
    body: string
    metadata?: NotificationMetadata
  } {
    return {
      title: this._title,
      body: this._body,
      metadata: this._metadata
    }
  }
}
