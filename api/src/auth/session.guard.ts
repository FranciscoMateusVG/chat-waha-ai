import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'

const COOKIE_NAME = 'session_token'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string | null
      }
    }
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = request.cookies?.[COOKIE_NAME]

    if (!token) {
      throw new UnauthorizedException('Não autenticado')
    }

    const user = await this.authService.validateSession(token)
    if (!user) {
      throw new UnauthorizedException('Sessão inválida ou expirada')
    }

    // Attach user to request for use in controllers
    request.user = {
      id: user.id,
      email: user.email,
      name: user.name
    }

    return true
  }
}
