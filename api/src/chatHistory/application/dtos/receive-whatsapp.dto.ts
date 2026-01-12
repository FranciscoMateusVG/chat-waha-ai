import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { MessageSenderType } from 'src/chatHistory/domain/value-objects'

export class ReceiveWhatsAppMessageDto {
  @ApiProperty({
    description: 'User ID for multi-tenant isolation',
    example: 'user-123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string

  @ApiProperty({
    description: 'External chat identifier from the messaging platform',
    example: 'whatsapp:5511999999999@c.us'
  })
  @IsString()
  @IsNotEmpty()
  externalChatId: string

  @ApiProperty({
    description: 'Display name for the chat',
    example: 'John Doe',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  chatName: string

  @ApiProperty({
    description: 'Message content text',
    example: 'Hello, how can I help you today?',
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string

  @ApiProperty({
    description: 'Who sent the message',
    enum: MessageSenderType,
    example: MessageSenderType.USER
  })
  @IsEnum(MessageSenderType)
  sender: MessageSenderType
}
