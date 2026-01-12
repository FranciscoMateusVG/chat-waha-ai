import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'
import { NotificationChannelType } from '../../domain/value-objects'

export class RecipientDto {
  @ApiProperty({
    description: 'Unique identifier of the recipient',
    example: 'user-123'
  })
  @IsString()
  @IsNotEmpty()
  id: string

  @ApiProperty({
    description: 'Contact information for the recipient (email, phone, etc.)',
    example: 'user@example.com'
  })
  @IsString()
  @IsNotEmpty()
  contactInfo: string
}

export class SendIndividualNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Welcome to our platform!',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @ApiProperty({
    description: 'Notification body content',
    example: 'Thank you for joining us. We are excited to have you on board!',
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string

  @ApiProperty({
    description: 'Unique identifier of the recipient',
    example: 'user-123'
  })
  @IsString()
  @IsNotEmpty()
  recipientId: string

  @ApiProperty({
    description: 'Notification delivery channel',
    enum: NotificationChannelType,
    example: NotificationChannelType.WHATSAPP
  })
  @IsEnum(NotificationChannelType)
  channel: NotificationChannelType

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: { priority: 'high', category: 'welcome' }
  })
  @IsOptional()
  metadata?: Record<string, any>

  @ApiProperty({
    description: 'Contact information for the recipient (email, phone, etc.)',
    example: 'user@example.com'
  })
  @IsString()
  @IsNotEmpty()
  contactInfo: string
}

export class SendBatchNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'System Maintenance Notice',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @ApiProperty({
    description: 'Notification body content',
    example:
      'We will be performing scheduled maintenance tonight from 2 AM to 4 AM.',
    maxLength: 5000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string

  @ApiProperty({
    description: 'Array of recipients for the batch notification',
    type: [RecipientDto],
    example: [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }]
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  recipients: RecipientDto[]

  @ApiProperty({
    description: 'Notification delivery channel',
    enum: NotificationChannelType,
    example: NotificationChannelType.WHATSAPP
  })
  @IsEnum(NotificationChannelType)
  channel: NotificationChannelType

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: { priority: 'medium', category: 'maintenance' }
  })
  @IsOptional()
  metadata?: Record<string, any>
}
