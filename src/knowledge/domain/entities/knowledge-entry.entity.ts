import { KnowledgeId } from '../value-objects'

export interface KnowledgeEntryProps {
  id: KnowledgeId
  type: string
  topic: string
  key: string
  content: string
  tags?: string[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class KnowledgeEntry {
  private readonly _id: KnowledgeId
  private readonly _type: string
  private readonly _topic: string
  private readonly _key: string
  private _content: string
  private _tags?: string[]
  private _metadata?: Record<string, any>
  private readonly _createdAt: Date
  private _updatedAt: Date

  constructor(props: KnowledgeEntryProps) {
    this.validateProps(props)
    this._id = props.id
    this._type = props.type
    this._topic = props.topic
    this._key = props.key
    this._content = props.content
    this._tags = props.tags
    this._metadata = props.metadata
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  get id(): KnowledgeId {
    return this._id
  }

  get type(): string {
    return this._type
  }

  get topic(): string {
    return this._topic
  }

  get key(): string {
    return this._key
  }

  get content(): string {
    return this._content
  }

  get tags(): string[] | undefined {
    return this._tags
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  getType(): string {
    return this._type
  }

  getTopic(): string {
    return this._topic
  }

  getContent(): string {
    return this._content
  }

  update(content: string, tags?: string[], metadata?: Record<string, any>): void {
    this.validateContent(content)
    this._content = content
    this._tags = tags
    this._metadata = metadata
    this._updatedAt = new Date()
  }

  equals(other: KnowledgeEntry): boolean {
    return this._id.equals(other._id)
  }

  static create(
    type: string,
    topic: string,
    content: string,
    tags?: string[],
    metadata?: Record<string, any>
  ): KnowledgeEntry {
    if (!type || !topic || !content) {
      throw new Error('Type, topic, and content are required')
    }

    const key = `${type}:${topic}`
    const now = new Date()
    
    return new KnowledgeEntry({
      id: new KnowledgeId(),
      type,
      topic,
      key,
      content,
      tags,
      metadata,
      createdAt: now,
      updatedAt: now
    })
  }

  static reconstitute(props: KnowledgeEntryProps): KnowledgeEntry {
    return new KnowledgeEntry(props)
  }

  private validateProps(props: KnowledgeEntryProps): void {
    this.validateType(props.type)
    this.validateTopic(props.topic)
    this.validateKey(props.key)
    this.validateContent(props.content)
  }

  private validateType(type: string): void {
    if (!type || type.trim().length === 0) {
      throw new Error('Knowledge entry type cannot be empty')
    }
  }

  private validateTopic(topic: string): void {
    if (!topic || topic.trim().length === 0) {
      throw new Error('Knowledge entry topic cannot be empty')
    }
  }

  private validateKey(key: string): void {
    if (!key || key.trim().length === 0) {
      throw new Error('Knowledge entry key cannot be empty')
    }
  }

  private validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Knowledge entry content cannot be empty')
    }
  }
}