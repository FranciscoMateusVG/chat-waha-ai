// Aggregate root, represents a chat history with a person

import { ChatStatus } from '../value-objects/chat-status.vo'
import { ExternalChatId } from '../value-objects/external-chat-id.vo'
import { MessageContent } from '../value-objects/message-content.vo'
import { MessageSender } from '../value-objects/message-sender.vo'
import { ChatHistoryId, ChatMessageId } from '../value-objects/uuid.vo'
import { ChatMessage } from './chat-message'

export class ChatHistory {
  private readonly id: ChatHistoryId
  private readonly userId: string // Owner of this chat history (multi-tenant isolation)
  private readonly externalChatId: ExternalChatId
  private readonly chatName: string
  private status: ChatStatus
  private messages: ChatMessage[]
  private readonly openedAt: Date
  private lastMessageAt: Date
  private closedAt?: Date
  private isGroupChat: boolean

  constructor(props: {
    id: ChatHistoryId
    userId: string
    externalChatId: ExternalChatId
    chatName: string
    status: ChatStatus
    openedAt: Date
    lastMessageAt: Date
    messages: ChatMessage[]
    closedAt?: Date
  }) {
    // sort messages by timestamp this will make sure the first message is the oldest and the last message is the newest
    // we already do this in the repository, but this logic needs to live in the domain entity
    // so that we dont need to remember to do it in the repository
    const chatMessages = props.messages.sort(
      (a, b) => a.messageTimestamp.getTime() - b.messageTimestamp.getTime()
    )

    this.id = props.id
    this.userId = props.userId
    this.externalChatId = props.externalChatId
    this.chatName = props.chatName
    this.status = props.status
    this.openedAt = props.openedAt
    this.lastMessageAt = props.lastMessageAt
    this.closedAt = props.closedAt
    this.messages = chatMessages
    this.isGroupChat = props.externalChatId.isGroupChat()
  }

  static create(
    userId: string,
    externalChatId: ExternalChatId,
    chatName: string,
    messageContent: MessageContent,
    messageSender: MessageSender,
    id?: ChatHistoryId
  ): ChatHistory {
    return new ChatHistory({
      id: id ?? new ChatHistoryId(),
      userId,
      externalChatId,
      chatName,
      status: ChatStatus.open(),
      openedAt: new Date(),
      lastMessageAt: new Date(),
      messages: [
        new ChatMessage({
          id: new ChatMessageId(),
          content: messageContent,
          sender: messageSender,
          timestamp: new Date()
        })
      ]
    })
  }

  removeUserMessage(messageId: ChatMessageId): void {
    this.messages = this.messages.filter(
      (message) => !message.chatMessageId.equals(messageId)
    )
  }

  addUserMessage(content: MessageContent): void {
    this.validateChatIsOpen()

    // checks how many user messages are in the chat, if more than 20 remove the first user message
    const userMessages = this.messages.filter((message) =>
      message.messageSender.isUser()
    )
    if (userMessages.length > 20) {
      //find the first user message
      const firstUserMessage = userMessages[0]
      this.removeUserMessage(firstUserMessage.chatMessageId)
    }

    this.messages.push(
      new ChatMessage({
        id: new ChatMessageId(),
        content: content,
        sender: MessageSender.user(),
        timestamp: new Date()
      })
    )

    this.lastMessageAt = new Date()
  }

  addAiMessage(content: MessageContent): void {
    this.validateChatIsOpen()

    this.messages.push(
      new ChatMessage({
        id: new ChatMessageId(),
        content: content,
        sender: MessageSender.ai(),
        timestamp: new Date()
      })
    )

    this.lastMessageAt = new Date()
  }

  addOwnerMessage(content: MessageContent): void {
    this.validateChatIsOpen()

    this.messages.push(
      new ChatMessage({
        id: new ChatMessageId(),
        content: content,
        sender: MessageSender.owner(),
        timestamp: new Date()
      })
    )

    this.lastMessageAt = new Date()
  }

  addSystemMessage(content: MessageContent): void {
    this.validateChatIsOpen()

    this.messages.push(
      new ChatMessage({
        id: new ChatMessageId(),
        content: content,
        sender: MessageSender.system(),
        timestamp: new Date()
      })
    )

    this.lastMessageAt = new Date()
  }

  closeChat(): void {
    this.status = ChatStatus.closed()
    this.closedAt = new Date()
  }

  // Query Methods (read state)
  hasOwnerIntervened(): boolean {
    return this.messages.some((message) => message.messageSender.isOwner())
  }

  validateChatIsOpen(): void {
    if (this.isChatClosed()) {
      throw new Error('Chat is closed')
    }
  }

  needsAiResponse(): boolean {
    if (this.getIsGroupChat()) {
      // group chats are not supported yet
      return false
    }

    return (
      this.status.isOpen() &&
      this.getLastMessageSender().isUser() &&
      !this.hasOwnerIntervened()
    )
  }

  isChatOpen(): boolean {
    return this.status.isOpen()
  }

  isChatClosed(): boolean {
    return this.status.isClosed()
  }

  getMessages(): ChatMessage[] {
    return this.messages
  }

  getRecentMessages(limit: number): ReadonlyArray<ChatMessage> {
    return this.messages.slice(-limit)
  }

  getId() {
    return this.id
  }
  getUserId() {
    return this.userId
  }
  getExternalChatId() {
    return this.externalChatId
  }
  getChatName() {
    return this.chatName
  }
  getStatus() {
    return this.status
  }
  getLastMessageSender() {
    return this.messages[this.messages.length - 1].messageSender
  }
  getOpenedAt() {
    return this.openedAt
  }
  getLastMessageAt() {
    return this.lastMessageAt
  }
  getClosedAt() {
    return this.closedAt
  }

  getIsGroupChat(): boolean {
    return this.isGroupChat
  }

  shouldBeClosed(): boolean {
    const EIGHT_HOURS = 8 * 60 * 60 * 1000 // milliseconds
    const timeSinceLastMessage = Date.now() - this.lastMessageAt.getTime()
    return timeSinceLastMessage >= EIGHT_HOURS && this.status.isOpen()
  }
}
