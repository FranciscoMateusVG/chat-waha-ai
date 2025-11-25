import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateKnowledgeDto {
  @ApiProperty({
    description: 'Knowledge type/category',
    example: 'Product Information'
  })
  @IsString()
  @IsNotEmpty()
  type: string

  @ApiProperty({
    description: 'Specific topic within the type',
    example: 'Payment Methods'
  })
  @IsString()
  @IsNotEmpty()
  topic: string

  @ApiProperty({
    description: 'The knowledge content',
    example: 'We support credit cards (Visa, Mastercard), PIX, and bank transfers.'
  })
  @IsString()
  @IsNotEmpty()
  content: string

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['payments', 'billing'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'support-docs', priority: 'high' }
  })
  @IsOptional()
  metadata?: Record<string, any>
}