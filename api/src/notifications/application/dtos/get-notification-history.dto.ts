import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'
import {
  NotificationChannelType,
  NotificationStatusType
} from '../../domain/value-objects'

export class GetNotificationHistoryDto {
  @ApiPropertyOptional({
    description: 'Filter by specific recipient ID',
    example: 'user-123'
  })
  @IsOptional()
  @IsString()
  recipientId?: string

  @ApiPropertyOptional({
    description: 'Filter by notification channel',
    enum: NotificationChannelType,
    example: NotificationChannelType.WHATSAPP
  })
  @IsOptional()
  @IsEnum(NotificationChannelType)
  channel?: NotificationChannelType

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: NotificationStatusType,
    example: NotificationStatusType.DELIVERED
  })
  @IsOptional()
  @IsEnum(NotificationStatusType)
  status?: NotificationStatusType

  @ApiPropertyOptional({
    description: 'Filter notifications from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({
    description: 'Filter notifications until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({
    description: 'Number of notifications to return (1-100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({
    description: 'Number of notifications to skip',
    example: 0,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  offset?: number = 0
}

export class GetNotificationStatsDto {
  @ApiPropertyOptional({
    description: 'Filter statistics by notification channel',
    enum: NotificationChannelType,
    example: NotificationChannelType.WHATSAPP
  })
  @IsOptional()
  @IsEnum(NotificationChannelType)
  channel?: NotificationChannelType

  @ApiPropertyOptional({
    description: 'Filter statistics from this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({
    description: 'Filter statistics until this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string
}
