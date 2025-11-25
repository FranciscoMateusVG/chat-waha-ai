import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator'

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10
}

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  currentPage: number

  @ApiProperty({
    description: 'Number of items per page',
    example: 10
  })
  pageSize: number

  @ApiProperty({
    description: 'Total number of items',
    example: 50
  })
  totalItems: number

  @ApiProperty({
    description: 'Total number of pages',
    example: 5
  })
  totalPages: number

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true
  })
  hasNextPage: boolean

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false
  })
  hasPreviousPage: boolean
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Operation success status'
  })
  success: boolean

  @ApiProperty({
    description: 'Paginated data items'
  })
  data: T[]

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto
  })
  meta: PaginationMetaDto

  @ApiPropertyOptional({
    description: 'Error message if operation failed'
  })
  error?: string
}
