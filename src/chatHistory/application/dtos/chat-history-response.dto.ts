import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ChatMessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I need help with my order'
  })
  content: string

  @ApiProperty({
    description: 'Message sender type',
    example: 'user',
    enum: ['user', 'ai', 'owner', 'system']
  })
  sender: string

  @ApiProperty({
    description: 'Message timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: Date
}

export class ChatHistoryDto {
  @ApiProperty({
    description: 'Chat history ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'External chat ID (from WhatsApp)',
    example: '5511999999999@c.us'
  })
  externalChatId: string

  @ApiProperty({
    description: 'Chat name (contact name)',
    example: 'John Doe'
  })
  chatName: string

  @ApiProperty({
    description: 'Chat status',
    example: 'open',
    enum: ['open', 'closed']
  })
  status: string

  @ApiProperty({
    description: 'Number of messages in this chat',
    example: 15
  })
  messageCount: number

  @ApiProperty({
    description: 'When the chat was opened',
    example: '2024-01-15T10:00:00Z'
  })
  openedAt: Date

  @ApiProperty({
    description: 'Last message timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  lastMessageAt: Date

  @ApiPropertyOptional({
    description: 'When the chat was closed',
    example: '2024-01-15T18:00:00Z'
  })
  closedAt?: Date

  @ApiProperty({
    description: 'Is this a group chat',
    example: false
  })
  isGroupChat: boolean
}

export class ChatHistoryWithMessagesDto extends ChatHistoryDto {
  @ApiProperty({
    description: 'Chat messages',
    type: [ChatMessageDto]
  })
  messages: ChatMessageDto[]
}

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Operation success status'
  })
  success: boolean

  @ApiPropertyOptional({
    description: 'Response data'
  })
  data?: T

  @ApiPropertyOptional({
    description: 'Error message if operation failed'
  })
  error?: string
}
