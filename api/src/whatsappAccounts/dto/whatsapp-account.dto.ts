import { IsString, IsOptional, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateWhatsappAccountDto {
  @ApiProperty({ example: 'Minha conta principal' })
  @IsString()
  @MinLength(1, { message: 'Nome é obrigatório' })
  name: string

  @ApiProperty({ example: '+5511999999999', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string
}

export class UpdateWhatsappAccountDto {
  @ApiProperty({ example: 'Minha conta atualizada', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @ApiProperty({ example: '+5511999999999', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string
}
