import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('API key is required')
    }

    const validApiKey = this.configService.get<string>('API_KEY')
    
    if (!validApiKey) {
      throw new UnauthorizedException('API key not configured')
    }

    if (token !== validApiKey) {
      throw new UnauthorizedException('Invalid API key')
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    
    return request.headers['x-api-key'] as string
  }
}