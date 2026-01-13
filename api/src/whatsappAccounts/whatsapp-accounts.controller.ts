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
  HttpStatus,
  Logger
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { WhatsappAccountsService } from './whatsapp-accounts.service'
import { CreateWhatsappAccountDto, UpdateWhatsappAccountDto } from './dto/whatsapp-account.dto'
import { SessionGuard } from '../auth/session.guard'
import { WAHASessionService } from '../infrastructure/waha/waha-session.service'

@ApiTags('whatsapp-accounts')
@ApiBearerAuth()
@Controller('whatsapp-accounts')
@UseGuards(SessionGuard)
export class WhatsappAccountsController {
  private readonly logger = new Logger(WhatsappAccountsController.name)

  constructor(
    private readonly service: WhatsappAccountsService,
    private readonly wahaSessionService: WAHASessionService
  ) {}

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
    this.logger.log(`Deleting WhatsApp account ${id}`)

    // First verify ownership (this throws if not found or not owned)
    const account = await this.service.findById(id, req.user!.id)

    // Delete WAHA session (best-effort - don't block deletion if WAHA fails)
    const sessionName = account.id
    try {
      await this.wahaSessionService.deleteSession(sessionName)
      this.logger.log(`WAHA session ${sessionName} deleted for account ${id}`)
    } catch (error) {
      // Log the error but proceed with account deletion
      this.logger.warn(
        `Falha ao excluir sessão WAHA ${sessionName}: ${error.message}. ` +
        `A conta será removida do banco de dados mesmo assim.`
      )
    }

    // Delete the account from database
    await this.service.delete(id, req.user!.id)
    this.logger.log(`WhatsApp account ${id} deleted successfully`)
  }

  // ============ WAHA Integration Endpoints ============

  @Get(':id/status')
  @ApiOperation({ summary: 'Get WhatsApp connection status for an account' })
  @ApiResponse({ status: 200, description: 'Connection status' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getConnectionStatus(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Getting connection status for account ${id}`)

    // Verify ownership first
    const account = await this.service.findById(id, req.user!.id)

    // Account ID is used as WAHA session name
    const sessionName = account.id
    const status = await this.wahaSessionService.getConnectionStatus(sessionName)

    // Update account status in DB if changed
    const newDbStatus = this.mapConnectionStatusToDbStatus(status.status)
    if (newDbStatus !== account.status) {
      await this.service.update(id, req.user!.id, { status: newDbStatus })
    }

    return {
      success: true,
      data: {
        accountId: account.id,
        accountName: account.name,
        ...status
      }
    }
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for WhatsApp connection' })
  @ApiResponse({ status: 200, description: 'QR code data' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getQRCode(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Getting QR code for account ${id}`)

    // Verify ownership first
    const account = await this.service.findById(id, req.user!.id)

    // Account ID is used as WAHA session name
    const sessionName = account.id

    // First ensure session exists and is started
    try {
      await this.wahaSessionService.ensureSessionStarted(sessionName)
    } catch (error) {
      this.logger.error(`Failed to ensure session started: ${error.message}`)
      return {
        success: false,
        error: `Erro ao iniciar sessão: ${error.message}`
      }
    }

    // Get QR code
    const qr = await this.wahaSessionService.getQRCode(sessionName)

    if (!qr) {
      // Check status - might already be connected
      const status = await this.wahaSessionService.getConnectionStatus(sessionName)

      if (status.status === 'connected') {
        return {
          success: true,
          data: {
            qrAvailable: false,
            message: 'WhatsApp já está conectado',
            status: status.status
          }
        }
      }

      return {
        success: false,
        error: 'QR code não disponível. Tente novamente em alguns segundos.'
      }
    }

    return {
      success: true,
      data: {
        qrAvailable: true,
        qrCode: qr.value,
        mimetype: qr.mimetype || 'image/png'
      }
    }
  }

  @Post(':id/connect')
  @ApiOperation({ summary: 'Start/Connect a WhatsApp session' })
  @ApiResponse({ status: 200, description: 'Session started' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async connect(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Connecting WhatsApp account ${id}`)

    // Verify ownership first
    const account = await this.service.findById(id, req.user!.id)

    const sessionName = account.id

    try {
      const session = await this.wahaSessionService.ensureSessionStarted(sessionName)
      const status = this.wahaSessionService.mapWAHAStatusToConnectionStatus(session.status)

      // Update account status
      const newDbStatus = this.mapConnectionStatusToDbStatus(status)
      await this.service.update(id, req.user!.id, { status: newDbStatus })

      return {
        success: true,
        data: {
          sessionId: sessionName,
          status,
          wahaStatus: session.status,
          message: status === 'needs_qr'
            ? 'Sessão iniciada. Escaneie o QR code para conectar.'
            : status === 'connected'
              ? 'WhatsApp conectado com sucesso!'
              : 'Sessão iniciada. Aguardando conexão...'
        }
      }
    } catch (error) {
      this.logger.error(`Failed to connect account ${id}: ${error.message}`)
      return {
        success: false,
        error: `Erro ao conectar: ${error.message}`
      }
    }
  }

  @Post(':id/disconnect')
  @ApiOperation({ summary: 'Disconnect/Stop a WhatsApp session' })
  @ApiResponse({ status: 200, description: 'Session stopped' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async disconnect(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Disconnecting WhatsApp account ${id}`)

    // Verify ownership first
    const account = await this.service.findById(id, req.user!.id)

    const sessionName = account.id

    try {
      await this.wahaSessionService.stopSession(sessionName)

      // Update account status
      await this.service.update(id, req.user!.id, { status: 'disconnected' })

      return {
        success: true,
        data: {
          sessionId: sessionName,
          status: 'disconnected',
          message: 'WhatsApp desconectado com sucesso'
        }
      }
    } catch (error) {
      this.logger.error(`Failed to disconnect account ${id}: ${error.message}`)
      return {
        success: false,
        error: `Erro ao desconectar: ${error.message}`
      }
    }
  }

  @Get(':id/diagnostics')
  @ApiOperation({ summary: 'Run diagnostics for WhatsApp connection' })
  @ApiResponse({ status: 200, description: 'Diagnostics results' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async runDiagnostics(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Running diagnostics for account ${id}`)

    // Verify ownership first
    const account = await this.service.findById(id, req.user!.id)

    const sessionName = account.id
    const diagnostics = await this.wahaSessionService.runDiagnostics(sessionName)

    return {
      success: true,
      data: {
        accountId: account.id,
        accountName: account.name,
        diagnostics
      }
    }
  }

  @Post(':id/diagnostics/create-session')
  @ApiOperation({ summary: 'Create WAHA session for diagnostics' })
  @ApiResponse({ status: 200, description: 'Session created' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async createSessionForDiagnostics(@Param('id') id: string, @Req() req: Request) {
    this.logger.log(`Creating WAHA session for account ${id}`)

    // Verify ownership first
    const account = await this.service.findById(id, req.user!.id)

    const sessionName = account.id

    try {
      const session = await this.wahaSessionService.createSession({
        name: sessionName,
        start: true
      })

      return {
        success: true,
        data: {
          sessionId: sessionName,
          status: session.status,
          message: 'Sessão criada com sucesso'
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create session for ${id}: ${error.message}`)
      return {
        success: false,
        error: `Erro ao criar sessão: ${error.message}`
      }
    }
  }

  private mapConnectionStatusToDbStatus(status: string): string {
    switch (status) {
      case 'connected':
        return 'connected'
      case 'disconnected':
      case 'needs_qr':
      case 'connecting':
      case 'failed':
      case 'unknown':
      default:
        return 'pending'
    }
  }
}
