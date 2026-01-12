import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { WhatsappAccountsService } from './whatsapp-accounts.service'
import { CreateWhatsappAccountDto, UpdateWhatsappAccountDto } from './dto/whatsapp-account.dto'
import { SessionGuard } from '../auth/session.guard'

@ApiTags('whatsapp-accounts')
@ApiBearerAuth()
@Controller('whatsapp-accounts')
@UseGuards(SessionGuard)
export class WhatsappAccountsController {
  constructor(private readonly service: WhatsappAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all WhatsApp accounts for current user' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async findAll(@Req() req: Request) {
    const accounts = await this.service.findAllByUser(req.user!.id)
    return { accounts }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific WhatsApp account' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const account = await this.service.findById(id, req.user!.id)
    return { account }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new WhatsApp account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  async create(@Body() dto: CreateWhatsappAccountDto, @Req() req: Request) {
    const account = await this.service.create(req.user!.id, dto.name, dto.phoneNumber)
    return { account }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a WhatsApp account (PUT)' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updatePut(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsappAccountDto,
    @Req() req: Request
  ) {
    const account = await this.service.update(id, req.user!.id, dto)
    return { account }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a WhatsApp account (PATCH)' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsappAccountDto,
    @Req() req: Request
  ) {
    const account = await this.service.update(id, req.user!.id, dto)
    return { account }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a WhatsApp account' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    await this.service.delete(id, req.user!.id)
  }
}
