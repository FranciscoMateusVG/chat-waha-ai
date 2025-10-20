// child entity, represents a message in a chat

import { MessageContent } from '../value-objects/message-content.vo'
import { MessageSender } from '../value-objects/message-sender.vo'
import { ChatMessageId } from '../value-objects/uuid.vo'

export class ChatMessage {
  private readonly id: ChatMessageId
  private readonly content: MessageContent
  private readonly sender: MessageSender
  private readonly timestamp: Date
  private readonly mentionedAi: boolean // Only relevant for groups

  constructor(props: {
    id: ChatMessageId
    content: MessageContent
    sender: MessageSender
    timestamp: Date
  }) {
    this.id = props.id
    this.content = props.content
    this.sender = props.sender
    this.timestamp = props.timestamp
    this.mentionedAi = this.didMentionAi(props.content)
  }

  get chatMessageId(): ChatMessageId {
    return this.id
  }

  get messageContent(): MessageContent {
    return this.content
  }

  get messageSender(): MessageSender {
    return this.sender
  }

  get messageTimestamp(): Date {
    return this.timestamp
  }

  didMentionAi(content: MessageContent): boolean {
    return content.text.toLowerCase().includes('zenao')
  }
}
