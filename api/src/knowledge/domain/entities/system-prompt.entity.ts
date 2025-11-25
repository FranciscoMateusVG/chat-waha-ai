export interface SystemPromptProps {
  id: string
  content: string
  updatedAt: Date
}

export class SystemPrompt {
  private readonly _id: string
  private _content: string
  private _updatedAt: Date

  constructor(props: SystemPromptProps) {
    this.validateProps(props)
    this._id = props.id
    this._content = props.content
    this._updatedAt = props.updatedAt
  }

  get id(): string {
    return this._id
  }

  get content(): string {
    return this._content
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  updateContent(content: string): void {
    this.validateContent(content)
    this._content = content
    this._updatedAt = new Date()
  }

  static create(content: string): SystemPrompt {
    if (!content || content.trim().length === 0) {
      throw new Error('System prompt content cannot be empty')
    }

    return new SystemPrompt({
      id: 'system-prompt',
      content: content.trim(),
      updatedAt: new Date()
    })
  }

  static reconstitute(props: SystemPromptProps): SystemPrompt {
    return new SystemPrompt(props)
  }

  private validateProps(props: SystemPromptProps): void {
    this.validateContent(props.content)
  }

  private validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('System prompt content cannot be empty')
    }
  }
}
