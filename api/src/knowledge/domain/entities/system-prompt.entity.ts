import { v4 as uuidv4 } from 'uuid'

export interface SystemPromptProps {
  id: string
  userId: string
  content: string
  updatedAt: Date
}

export class SystemPrompt {
  private readonly _id: string
  private readonly _userId: string
  private _content: string
  private _updatedAt: Date

  constructor(props: SystemPromptProps) {
    this.validateProps(props)
    this._id = props.id
    this._userId = props.userId
    this._content = props.content
    this._updatedAt = props.updatedAt
  }

  get id(): string {
    return this._id
  }

  get userId(): string {
    return this._userId
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

  static create(userId: string, content: string): SystemPrompt {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty')
    }
    if (!content || content.trim().length === 0) {
      throw new Error('System prompt content cannot be empty')
    }

    return new SystemPrompt({
      id: uuidv4(),
      userId,
      content: content.trim(),
      updatedAt: new Date()
    })
  }

  static reconstitute(props: SystemPromptProps): SystemPrompt {
    return new SystemPrompt(props)
  }

  private validateProps(props: SystemPromptProps): void {
    this.validateUserId(props.userId)
    this.validateContent(props.content)
  }

  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error('System prompt user ID cannot be empty')
    }
  }

  private validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('System prompt content cannot be empty')
    }
  }
}
