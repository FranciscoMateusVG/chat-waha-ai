import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SearchKnowledgeDto {
  @ApiProperty({
    description: 'Search query',
    example: 'payment methods'
  })
  @IsString()
  @IsNotEmpty()
  query: string

  @ApiPropertyOptional({
    description: 'Filter by knowledge type',
    example: 'Product Information'
  })
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional({
    description: 'Filter by tags',
    example: ['payments', 'billing'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}