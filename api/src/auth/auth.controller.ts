import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto, LoginDto } from './dto/auth.dto'

const COOKIE_NAME = 'session_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, token } = await this.authService.register(dto.email, dto.password, dto.name)

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, token } = await this.authService.login(dto.email, dto.password)

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = req.cookies?.[COOKIE_NAME]
    if (token) {
      await this.authService.logout(token)
    }

    res.clearCookie(COOKIE_NAME, { path: '/' })

    return { message: 'Logout realizado com sucesso' }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async me(@Req() req: Request) {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) {
      throw new UnauthorizedException('Não autenticado')
    }

    const user = await this.authService.validateSession(token)
    if (!user) {
      throw new UnauthorizedException('Sessão inválida ou expirada')
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    }
  }
}
