import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateKnowledgeDto {
  @ApiProperty({
    description: 'The updated knowledge content',
    example: 'We support credit cards (Visa, Mastercard), PIX, bank transfers, and cryptocurrency.'
  })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiPropertyOptional({
    description: 'Updated tags for categorization',
    example: ['payments', 'billing', 'crypto'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({
    description: 'Updated metadata',
    example: { source: 'support-docs', priority: 'high', lastReviewed: '2024-01-15' }
  })
  @IsOptional()
  metadata?: Record<string, any>
}