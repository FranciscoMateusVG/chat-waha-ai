import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class KnowledgeResponseDto {
  @ApiProperty({
    description: 'Knowledge entry ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'Knowledge type/category',
    example: 'Product Information'
  })
  type: string

  @ApiProperty({
    description: 'Specific topic within the type',
    example: 'Payment Methods'
  })
  topic: string

  @ApiProperty({
    description: 'Auto-generated key',
    example: 'Product Information:Payment Methods'
  })
  key: string

  @ApiProperty({
    description: 'The knowledge content',
    example: 'We support credit cards (Visa, Mastercard), PIX, and bank transfers.'
  })
  content: string

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['payments', 'billing'],
    type: [String]
  })
  tags?: string[]

  @ApiPropertyOptional({
    description: 'Additional metadata'
  })
  metadata?: Record<string, any>

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T14:22:00Z'
  })
  updatedAt: Date
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