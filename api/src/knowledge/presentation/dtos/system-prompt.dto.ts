import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class SaveSystemPromptDto {
  @ApiProperty({
    description: 'The system prompt content',
    example: 'You are a helpful AI assistant for our customer support system.'
  })
  @IsString()
  @IsNotEmpty()
  content: string
}

export class SystemPromptResponseDto {
  @ApiProperty({
    description: 'System prompt ID',
    example: 'system-prompt'
  })
  id: string

  @ApiProperty({
    description: 'The system prompt content',
    example: 'You are a helpful AI assistant for our customer support system.'
  })
  content: string

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date
}
